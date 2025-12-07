import React, { useState, useEffect, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,

  signOut
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';

// --- COMPONENTS ---
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import Timeline from './components/Timeline';
import Resources from './components/Resources';
import Tools from './components/Tools';
import MoodModal from './components/MoodModal';
import { ChatButton, ChatModal } from './components/ChatComponents';
import TabNavigation from './components/TabNavigation';
import BreathingWidget from './components/BreathingWidget';
import CryDecoder from './components/CryDecoder';
import SleepWidget from './components/SleepWidget';
import MagicMemoryModal from './components/MagicMemoryModal';
import ChefWidget from './components/ChefWidget';
import StoryWidget from './components/StoryWidget';

// --- CONFIGURACIÓN DE FIREBASE ---
const firebaseConfig = window.__firebase_config || {
  apiKey: "AIzaSyBr_b-tS0N68na4yBa9vFoEi1KQQRUJ2rI",
  authDomain: "familiaviva-6cc39.firebaseapp.com",
  projectId: "familiaviva-6cc39",
  storageBucket: "familiaviva-6cc39.firebasestorage.app",
  messagingSenderId: "766772076704",
  appId: "1:766772076704:web:bc5d6467a7f07b89f4e9c5",
  measurementId: "G-9759BJTCZW"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof window.__app_id !== 'undefined' ? window.__app_id : 'familia-viva-app';

// --- UTILITY LLM API CALL ---
const callGeminiAPI = async (systemPrompt, userQuery) => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey || apiKey === 'TU_API_KEY_AQUI') {
    return { text: "Error de configuración: Falta la API Key.", sources: [] };
  }
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  const maxRetries = 3;

  const payload = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: "user", parts: [{ text: userQuery }] }]
  };

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();
      const text = result.candidates?.[0]?.content?.parts?.[0]?.text || "No se pudo generar respuesta.";

      const sources = [];
      if (result.candidates?.[0]?.citationMetadata?.citationSources) {
        result.candidates[0].citationMetadata.citationSources.forEach(s => {
          if (s.uri) sources.push({ title: 'Fuente Externa', uri: s.uri });
        });
      }
      return { text, sources };
    } catch {
      if (attempt === maxRetries - 1) return { text: "Error de conexión.", sources: [] };
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
    }
  }
};


// --- COMPONENTE PRINCIPAL ---
export default function FamiliaVivaApp() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const [moodHistory, setMoodHistory] = useState([]);
  const [currentMood, setCurrentMood] = useState(null);
  const [showMoodModal, setShowMoodModal] = useState(false);
  const [modalContent, setModalContent] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showQAchatModal, setShowQAchatModal] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [weeklyInsight, setWeeklyInsight] = useState(null);
  const [isInsightLoading, setIsInsightLoading] = useState(false);
  const [weeklyMilestone, setWeeklyMilestone] = useState(null);
  const [isMilestoneLoading, setIsMilestoneLoading] = useState(false);
  const [activeTool, setActiveTool] = useState(null); // 'cry_decoder', 'breathing', 'sleep_guru', 'magic_journal'

  // EDAD DEL BEBÉ
  const babyAge = "8 meses y 2 semanas";

  // --- AUTENTICACIÓN ---
  useEffect(() => {
    const initAuth = async () => {
      await signInAnonymously(auth).catch(e => console.error(e));
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // --- DATOS ---
  useEffect(() => {
    if (!user) return;
    const moodRef = collection(db, 'artifacts', appId, 'users', user.uid, 'mood_logs');
    const qMood = query(moodRef, orderBy('timestamp', 'desc'), limit(7));
    const unsubMood = onSnapshot(qMood, (snapshot) => {
      const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), date: doc.data().timestamp?.toDate().toLocaleDateString() }));
      setMoodHistory(logs);
      if (logs.length > 0 && logs[0].date === new Date().toLocaleDateString()) setCurrentMood(logs[0].mood);
    });

    const chatRef = collection(db, 'artifacts', appId, 'users', user.uid, 'qa_chat_history');
    const qChat = query(chatRef, orderBy('timestamp', 'asc'), limit(20));
    const unsubChat = onSnapshot(qChat, (snap) => setChatHistory(snap.docs.map(d => ({ id: d.id, ...d.data() }))));

    return () => { unsubMood(); unsubChat(); };
  }, [user]);

  // --- LLM HELPERS ---
  const generateWeeklyMilestone = useCallback(async () => {
    if (!user) return;
    setIsMilestoneLoading(true);
    const systemPrompt = "Eres un psicólogo de desarrollo infantil. Genera un hito de desarrollo para la edad indicada (1 frase) y una actividad de estimulación (1 frase). Tono positivo.";
    const { text } = await callGeminiAPI(systemPrompt, `Edad: ${babyAge}.`, false);
    setWeeklyMilestone(text);
    setIsMilestoneLoading(false);
  }, [user, babyAge]);

  useEffect(() => {
    if (user && activeTab === 'timeline' && !weeklyMilestone) generateWeeklyMilestone();
  }, [user, activeTab, weeklyMilestone, generateWeeklyMilestone]);


  const generateEmotionalInsight = useCallback(async () => {
    if (!user) return;
    setIsInsightLoading(true);
    const moodSummary = moodHistory.reduce((acc, log) => { acc[log.mood] = (acc[log.mood] || 0) + 1; return acc; }, { verde: 0, ambar: 0, rojo: 0 });
    const dataString = `Calma: ${moodSummary.verde}, Estrés: ${moodSummary.ambar}, SOS: ${moodSummary.rojo}.`;
    const systemPrompt = "Coach de bienestar para padres. Analiza el resumen y da un consejo breve y práctico.";
    const { text } = await callGeminiAPI(systemPrompt, dataString, false);
    setWeeklyInsight(text);
    setIsInsightLoading(false);
  }, [user, moodHistory]);

  const askPedagogue = async (question) => {
    if (!user || !question.trim()) return;
    setChatInput('');
    setIsGenerating(true);
    await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'qa_chat_history'), { role: 'user', text: question, timestamp: serverTimestamp() });

    try {
      const systemPrompt = "Pedagogo Asistente experto. Responde conciso (max 100 palabras). Cita fuentes.";
      const { text, sources } = await callGeminiAPI(systemPrompt, question, true);

      let finalText = text;
      if (sources.length) finalText += "\n\nFuentes: " + sources.map(s => s.title).join(', ');

      await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'qa_chat_history'), { role: 'assistant', text: finalText, timestamp: serverTimestamp() });
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  // --- HANDLERS ---
  const handleMoodSelect = async (mood, color, message) => {
    if (!user) return;
    await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'mood_logs'), { mood, color, timestamp: serverTimestamp(), note: message });
    setCurrentMood(mood);

    // Logic for specific moods
    if (mood === 'rojo') {
      setModalContent({
        mood,
        title: "¡ALTO! Te escuchamos.",
        body: "Estás sobrepasado/a y es válido sentirse así. Antes de contactar al especialista, toma un Respiro Emocional guiado.",
        action: "breath", // Special action
        actionLabel: "Recibir Respiro Emocional ✨",
        color: "bg-red-50 text-red-800",
        llmFunction: () => { setShowMoodModal(false); setActiveTool('breathing'); }
      });
    } else if (mood === 'ambar') {
      setModalContent({
        mood,
        title: "Momento de Pausa",
        body: "Estás sintiendo estrés. Es una señal de que necesitas un momento para ti.",
        action: "breath",
        actionLabel: "Hacer Pausa de 1 Minuto",
        color: "bg-amber-50 text-amber-800",
        llmFunction: () => { setShowMoodModal(false); setActiveTool('breathing'); }
      });
    } else {
      // Verde
      setModalContent({
        mood,
        title: "¡Qué bien!",
        body: "Mantener la calma es un superpoder. ¿Quieres guardar este momento?",
        action: "magic",
        actionLabel: "Guardar Recuerdo Mágico",
        color: "bg-green-50 text-green-800",
        llmFunction: () => { setShowMoodModal(false); setActiveTool('magic_journal'); }
      });
    }
    setShowMoodModal(true);
  };

  // --- RENDER ---
  if (loading) return <div className="flex h-screen items-center justify-center bg-slate-50 text-indigo-500 font-bold">Cargando...</div>;
  const userId = user?.uid || 'guest';
  const displayUserName = user?.email?.split('@')[0] || 'Papá/Mamá';

  return (
    <div className="relative flex flex-col h-screen font-sans text-slate-800 overflow-hidden bg-slate-50">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-100 blur-3xl opacity-50"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-sky-100 blur-3xl opacity-50"></div>
      </div>

      <Navbar handleLogout={() => signOut(auth)} userId={userId} />

      <main className="flex-1 overflow-y-auto w-full max-w-md mx-auto z-10 p-4 pb-24 scroll-smooth">
        {activeTab === 'home' && (
          <Dashboard
            displayUserName={displayUserName}
            isAnonymousUser={auth.currentUser?.isAnonymous}
            userId={userId}
            weeklyInsight={weeklyInsight}
            isInsightLoading={isInsightLoading}
            generateEmotionalInsight={generateEmotionalInsight}
            moodHistory={moodHistory}
            currentMood={currentMood}
            handleMoodSelect={handleMoodSelect}
            // Dashboard buttons still work OR we remove them. Let's keep them as quick access for now, but handleToolOpen also works for Tools tab
            handleToolOpen={setActiveTool}
          />
        )}
        {activeTab === 'tools' && (
          <Tools handleToolOpen={setActiveTool} />
        )}
        {activeTab === 'timeline' && (
          <Timeline
            babyAge={babyAge}
            weeklyMilestone={weeklyMilestone}
            isMilestoneLoading={isMilestoneLoading}
            generateWeeklyMilestone={generateWeeklyMilestone}
          />
        )}
        {activeTab === 'resources' && (
          <Resources
            onGenerateResource={async (category, title, context) => {
              const systemPrompt = "Experto en contenido parental. Genera una guía práctica en Markdown.";
              const { text } = await callGeminiAPI(systemPrompt, `Contexto: ${context}. Titulo: ${title}`, false);
              return text;
            }}
          />
        )}
      </main>

      {/* FLOATERS */}
      <ChatButton onClick={() => setShowQAchatModal(true)} />
      <ChatModal
        showQAchatModal={showQAchatModal} setShowQAchatModal={setShowQAchatModal}
        chatHistory={chatHistory} chatInput={chatInput} setChatInput={setChatInput}
        handleChatSubmit={(e) => { e.preventDefault(); askPedagogue(chatInput); }}
        isGenerating={isGenerating}
      />
      <MoodModal showMoodModal={showMoodModal} setShowMoodModal={setShowMoodModal} modalContent={modalContent} />

      {/* WIDGETS */}
      {activeTool === 'breathing' && <BreathingWidget onClose={() => setActiveTool(null)} />}

      <CryDecoder
        isOpen={activeTool === 'cry_decoder'} onClose={() => setActiveTool(null)}
        onAnalyze={async (symptoms) => {
          const systemPrompt = "Pediatra experto. Analiza llanto. Return JSON {cause, solution}.";
          const { text } = await callGeminiAPI(systemPrompt, `Sintomas: ${symptoms.join(',')}`, false);
          try { return JSON.parse(text.replace(/```json/g, '').replace(/```/g, '').trim()); }
          catch { return { cause: "Desconocido", solution: "Intenta calmarlo." }; }
        }}
      />

      <SleepWidget
        isOpen={activeTool === 'sleep_guru'} onClose={() => setActiveTool(null)}
        onGetSleepTip={async () => {
          const { text } = await callGeminiAPI("Experto en sueño infantil. Dame un tip corto para la rutina de sueño de un bebé de 8 meses.", "Tip rápido", false);
          return text;
        }}
      />

      <MagicMemoryModal
        isOpen={activeTool === 'magic_journal'} onClose={() => setActiveTool(null)}
        onMagicify={async (input) => {
          const systemPrompt = "Eres un poeta experto en storytelling. Reescribe este recuerdo parental breve como una pequeña historia mágica, tierna y memorable (max 50 palabras).";
          const { text } = await callGeminiAPI(systemPrompt, input, false);
          if (user) {
            addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'magic_memories'), { original: input, magic: text, timestamp: serverTimestamp() });
          }
          return text;
        }}
      />

      <ChefWidget
        isOpen={activeTool === 'chef'} onClose={() => setActiveTool(null)}
        onGenerateRecipe={async (ingredients, type) => {
          const systemPrompt = "Nutricionista infantil experto. Genera una receta segura, paso a paso y nutricionalmente balanceada para un bebé de 8 meses. Usa formato Markdown.";
          const { text } = await callGeminiAPI(systemPrompt, `Ingredientes disponibles: ${ingredients}. Estilo: ${type}`, false);
          return text;
        }}
      />

      <StoryWidget
        isOpen={activeTool === 'storyteller'} onClose={() => setActiveTool(null)}
        onGenerateStory={async (theme, char) => {
          const systemPrompt = "Cuentacuentos infantil. Escribe un cuento corto (150 palabras) relajante para antes de dormir. Usa lenguaje sensorial y calmado. Markdown.";
          const { text } = await callGeminiAPI(systemPrompt, `Tema: ${theme}. Personaje: ${char}`, false);
          return text;
        }}
      />

      <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}

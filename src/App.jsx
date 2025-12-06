import React, { useState, useEffect, useCallback, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  signInWithCustomToken,
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
  serverTimestamp,
  where,
  getDocs
} from 'firebase/firestore';

// --- COMPONENTS ---
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import Timeline from './components/Timeline';
import Resources from './components/Resources';
import MoodModal from './components/MoodModal';
import { ChatButton, ChatModal } from './components/ChatComponents';
import TabNavigation from './components/TabNavigation';

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
const callGeminiAPI = async (systemPrompt, userQuery, useGrounding = false) => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey || apiKey === 'TU_API_KEY_AQUI') {
    console.error("Falta la API Key de Gemini. Configúrala en el archivo .env");
    return { text: "Error de configuración: Falta la API Key. Por favor contacta al administrador.", sources: [] };
  }
  // Uso el modelo que detectamos que funciona
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  const maxRetries = 3;

  const payload = {
    system_instruction: {
      parts: [{ text: systemPrompt }]
    },
    contents: [
      {
        role: "user",
        parts: [{ text: userQuery }]
      }
    ]
  };

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      const candidate = result.candidates?.[0];
      const text = candidate?.content?.parts?.[0]?.text || "No se pudo generar una respuesta.";

      // Si se usa Grounding, aquí se extraerían las fuentes (simulado por ahora si la API no devuelve citationMetadata de la misma forma)
      // En v1beta standard, citationMetadata suele estar en candidate.citationMetadata
      const sources = [];
      if (candidate?.citationMetadata?.citationSources) {
        candidate.citationMetadata.citationSources.forEach(s => {
          if (s.uri) sources.push({ title: 'Fuente Externa', uri: s.uri });
        });
      }

      return { text, sources };

    } catch (error) {
      if (attempt === maxRetries - 1) {
        console.error("Gemini API failed after multiple retries:", error);
        return { text: "Error al conectar con el asistente. Intenta más tarde.", sources: [] };
      }
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

  // EDAD DEL BEBÉ (Hardcoded para el ejemplo)
  const babyAge = "8 meses y 2 semanas";

  // --- AUTENTICACIÓN Y CARGA DE DATOS ---
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof window.__initial_auth_token !== 'undefined' && window.__initial_auth_token) {
          await signInWithCustomToken(auth, window.__initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Error en autenticación inicial:", error);
        await signInAnonymously(auth).catch(e => console.error("Error en fallback anónimo:", e));
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // --- Cargar Historial de Ánimo y Chat ---
  useEffect(() => {
    if (!user) return;

    // Mood Logs
    const moodRef = collection(db, 'artifacts', appId, 'users', user.uid, 'mood_logs');
    const qMood = query(moodRef, orderBy('timestamp', 'desc'), limit(7));

    const unsubscribeMood = onSnapshot(qMood, (snapshot) => {
      const logs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().timestamp ? doc.data().timestamp.toDate().toLocaleDateString() : 'N/A'
      }));
      setMoodHistory(logs);
      if (logs.length > 0) {
        const lastLog = logs[0];
        const logDate = lastLog.timestamp ? lastLog.timestamp.toDate().toDateString() : new Date().toDateString();
        const today = new Date().toDateString();
        if (logDate === today) {
          setCurrentMood(lastLog.mood);
        }
      }
    }, (error) => console.error("Error fetching mood logs:", error));

    // Historial de Chat (Máximo 10)
    const chatRef = collection(db, 'artifacts', appId, 'users', user.uid, 'qa_chat_history');
    const qChat = query(chatRef, orderBy('timestamp', 'asc'), limit(20));

    const unsubscribeChat = onSnapshot(qChat, (snapshot) => {
      const history = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setChatHistory(history);
    }, (error) => console.error("Error fetching chat history:", error));

    return () => {
      unsubscribeMood();
      unsubscribeChat();
    };
  }, [user]);

  // --- LLM FUNCTIONS ---

  const generateWeeklyMilestone = useCallback(async () => {
    if (!user) return;
    setIsMilestoneLoading(true);
    try {
      const systemPrompt = "Eres un psicólogo de desarrollo infantil y coach de crianza. Analiza la edad del bebé. Genera un hito de desarrollo o habilidad que el bebé esté adquiriendo *esta semana* (en 1 frase). Luego, sugiere una actividad de apego o estimulación sencilla y específica que refuerce ese hito (en 1 frase). Responde con un tono positivo y de celebración. Responde solo con el hito y la actividad.";
      const userQuery = `Mi bebé tiene ${babyAge}. ¿Cuál es el hito de desarrollo clave para esta semana y cómo puedo reforzarlo?`;
      const { text: result } = await callGeminiAPI(systemPrompt, userQuery, false);
      setWeeklyMilestone(result);
    } catch (error) {
      console.error("Error generando el hito semanal:", error);
      setWeeklyMilestone("Lo sentimos, no pudimos generar tu hito semanal. Intenta de nuevo.");
    }
    setIsMilestoneLoading(false);
  }, [user, babyAge]);

  useEffect(() => {
    if (user && activeTab === 'timeline' && !weeklyMilestone && !isMilestoneLoading) {
      // Debounce simple o check para no llamar muchas veces si falla
      generateWeeklyMilestone();
    }
  }, [user, activeTab, weeklyMilestone, isMilestoneLoading, generateWeeklyMilestone]);


  const generateEmotionalInsight = useCallback(async () => {
    if (!user) return;
    setIsInsightLoading(true);
    setWeeklyInsight(null);
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const q = query(
        collection(db, 'artifacts', appId, 'users', user.uid, 'mood_logs'),
        orderBy('timestamp', 'desc'),
        where('timestamp', '>=', sevenDaysAgo)
      );
      const snapshot = await getDocs(q);
      const logs = snapshot.docs.map(doc => ({
        mood: doc.data().mood,
        date: doc.data().timestamp ? doc.data().timestamp.toDate().toLocaleDateString() : 'Fecha N/A'
      }));

      if (logs.length === 0) {
        setWeeklyInsight("No tienes suficientes registros de estado de ánimo esta semana. ¡Empieza a registrar para recibir tu análisis!");
        setIsInsightLoading(false);
        return;
      }

      const moodSummary = logs.reduce((acc, log) => {
        acc[log.mood] = (acc[log.mood] || 0) + 1;
        return acc;
      }, { verde: 0, ambar: 0, rojo: 0 });

      const dataString = `Resumen de ánimo de los últimos ${logs.length} registros: Calma (verde): ${moodSummary.verde} días, Estrés (ambar): ${moodSummary.ambar} días, SOS (rojo): ${moodSummary.rojo} días.`;
      const systemPrompt = "Eres un coach de bienestar para padres, con un tono cálido y empático. Analiza el resumen de datos de ánimo. Proporciona una conclusión de bienestar breve (1 frase) y un consejo proactivo, práctico y no invasivo para la próxima semana (1 frase). No uses la palabra 'LLM'. Responde solo con el resumen y el consejo.";
      const userQuery = `Analiza el siguiente resumen de ánimo de los últimos 7 días y genera una conclusión y un consejo:\n${dataString}`;
      const { text: result } = await callGeminiAPI(systemPrompt, userQuery, false);
      setWeeklyInsight(result);
    } catch (error) {
      console.error("Error generando el informe de bienestar:", error);
      setWeeklyInsight("Lo sentimos, no pudimos generar tu informe semanal en este momento. Intenta de nuevo.");
    }
    setIsInsightLoading(false);
  }, [user]);

  const askPedagogue = useCallback(async (question) => {
    if (!user || !question.trim()) return;
    const userMessage = { role: 'user', text: question.trim(), timestamp: serverTimestamp() }; // Local display timestamp is enough usually but we strictly use Firestore for history

    // Optimistic UI update
    setChatHistory(prev => [...prev, { role: 'user', text: question.trim() }, { role: 'assistant', text: '...' }]);
    setChatInput('');

    await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'qa_chat_history'), {
      role: 'user',
      text: question.trim(),
      timestamp: serverTimestamp()
    });

    const systemPrompt = "Eres un Pedagogo Asistente, experto en desarrollo 0-24 meses. Responde concisa y empáticamente. Usa información actualizada (Grounding) y cita tus fuentes al final en un formato simple (ej: Fuente: [Título del Artículo]). Limita la respuesta a un máximo de 150 palabras.";
    const { text: llmResponseText, sources } = await callGeminiAPI(systemPrompt, question, true);

    let formattedResponse = llmResponseText;
    if (sources.length > 0) {
      formattedResponse += "\n\n**Fuentes Consultadas:**\n";
      sources.forEach((source) => {
        formattedResponse += `- [${source.title}](${source.uri})\n`;
      });
    }

    await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'qa_chat_history'), {
      role: 'assistant',
      text: formattedResponse,
      sources: sources.map(s => ({ title: s.title, uri: s.uri })),
      timestamp: serverTimestamp()
    });
    // La suscripción onSnapshot actualizará el chat, no necesitamos setear el estado manual aquí idealmente, pero para smooth UX está bien
  }, [user]);


  // --- GENERADORES PARA MODAL ---
  const generateActivityTip = async () => {
    setIsGenerating(true);
    const systemPrompt = "Eres un psicólogo especialista en desarrollo infantil temprano y apego. Tu respuesta debe ser una actividad práctica, sencilla, que promueva el vínculo y la estimulación. Limítate a 4 frases concisas y usa un tono positivo y alentador.";
    const userQuery = `Genera una actividad de juego de 5 minutos para un bebé de ${babyAge}. Enfócate en el apego seguro.`;
    const { text: result } = await callGeminiAPI(systemPrompt, userQuery, false);
    setModalContent(prev => ({ ...prev, llmText: result, action: "¡Actividad lista!", color: "bg-green-100 text-green-800" }));
    setIsGenerating(false);
  };

  const generateEmotionalRespite = async () => {
    setIsGenerating(true);
    const systemPrompt = "Eres un coach emocional y psicoterapeuta. Tu tarea es ofrecer validación emocional, normalización del sentimiento y UNA única técnica de afrontamiento inmediata (ej. beber agua, respiración cuadrada) en 4 líneas. Usa un tono de contención y empatía.";
    const userQuery = "Estoy sintiendo que estoy sobrepasado y que no puedo más con la crianza.";
    const { text: result } = await callGeminiAPI(systemPrompt, userQuery, false);
    setModalContent(prev => ({ ...prev, llmText: result, action: "¡Toma un respiro!", color: "bg-red-100 text-red-800" }));
    setIsGenerating(false);
  };


  // --- HANDLERS ---
  const handleMoodSelect = async (mood, color, message) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'mood_logs'), {
        mood: mood,
        color: color,
        timestamp: serverTimestamp(),
        note: message
      });
      setCurrentMood(mood);

      let feedback = {};
      if (mood === 'verde') {
        feedback = {
          title: "¡Día de Calma!",
          body: "Estás en un buen momento. ¡Aprovecha para fortalecer el apego!",
          action: "Generar Actividad ✨",
          color: "bg-green-100 text-green-800",
          llmFunction: generateActivityTip,
          llmText: null,
          actionLabel: "Generar Actividad de Apego ✨",
          mood: 'verde'
        };
      } else if (mood === 'ambar') {
        feedback = {
          title: "Respira un momento",
          body: "Parece que hay un poco de estrés. Es normal. Tómate 3 minutos para ti antes de continuar.",
          action: "Ver Recursos",
          color: "bg-amber-100 text-amber-800",
          llmFunction: null,
          llmText: null,
          actionLabel: "Ver Biblioteca",
          mood: 'ambar'
        };
      } else if (mood === 'rojo') {
        feedback = {
          title: "¡ALTO! Te escuchamos.",
          body: "Estás sobrepasado/a y es válido sentirse así. Antes de contactar al especialista, toma un Respiro Emocional guiado.",
          action: "Respiro Emocional ✨",
          color: "bg-red-100 text-red-800",
          llmFunction: generateEmotionalRespite,
          llmText: null,
          actionLabel: "Recibir Respiro Emocional ✨",
          mood: 'rojo'
        };
      }
      setModalContent(feedback);
      setShowMoodModal(true);
    } catch (error) {
      console.error("Error saving mood:", error);
    }
  };

  const handleChatSubmit = (e) => {
    e.preventDefault();
    if (chatInput.trim() && !isGenerating) {
      askPedagogue(chatInput);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      await signInAnonymously(auth);
      setWeeklyInsight(null);
      setWeeklyMilestone(null);
      setMoodHistory([]);
      setChatHistory([]);
      setActiveTab('home');
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };


  // --- RENDER ---
  if (loading) {
    return <div className="flex items-center justify-center h-screen bg-slate-50 text-indigo-500 font-bold">Cargando Familia Viva...</div>;
  }

  const userId = user?.uid || 'ID de Invitado';
  const displayUserName = user?.email ? user.email.split('@')[0] : 'Papá/Mamá';
  const isAnonymousUser = auth.currentUser?.isAnonymous;

  return (
    <div className="relative flex flex-col h-screen font-sans text-slate-800 overflow-hidden bg-slate-50 selection:bg-indigo-200">

      {/* BACKGROUND ELEMENTS */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-100 blur-3xl opacity-50"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-sky-100 blur-3xl opacity-50"></div>
      </div>

      <Navbar handleLogout={handleLogout} userId={userId} />

      <main className="flex-1 overflow-y-auto w-full max-w-md mx-auto z-10 p-4 scroll-smooth">
        {activeTab === 'home' && (
          <Dashboard
            displayUserName={displayUserName}
            isAnonymousUser={isAnonymousUser}
            userId={userId}
            weeklyInsight={weeklyInsight}
            isInsightLoading={isInsightLoading}
            generateEmotionalInsight={generateEmotionalInsight}
            moodHistory={moodHistory}
            currentMood={currentMood}
            handleMoodSelect={handleMoodSelect}
          />
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
          <Resources />
        )}
      </main>

      <ChatButton onClick={() => setShowQAchatModal(true)} />

      <ChatModal
        showQAchatModal={showQAchatModal}
        setShowQAchatModal={setShowQAchatModal}
        chatHistory={chatHistory}
        chatInput={chatInput}
        setChatInput={setChatInput}
        handleChatSubmit={handleChatSubmit}
        isGenerating={isGenerating}
        isInsightLoading={isInsightLoading}
      />

      <MoodModal
        showMoodModal={showMoodModal}
        setShowMoodModal={setShowMoodModal}
        modalContent={modalContent}
        isGenerating={isGenerating}
      />

      <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithCustomToken,
  signInAnonymously,
  signOut,
  onAuthStateChanged
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
  where
} from 'firebase/firestore';
import {
  Smile,
  Meh,
  Frown,
  MessageCircle,
  BookOpen,
  Home,
  Calendar,
  Send,
  Sparkles,
  LogOut,
  X,
  PlayCircle,
  Headphones
} from 'lucide-react';

/**
 * CONFIGURACIÓN & INICIALIZACIÓN
 * ------------------------------------------------------------------
 * IMPORTANTE PARA VERCEL: 
 * Asegúrate de configurar las variables de entorno correctamente en Vercel 
 * o reemplazar estos valores con tu configuración real de Firebase.
 */

// Variables globales simuladas. Reemplazar con process.env o valores reales.
const __firebase_config = window.__firebase_config || {
  apiKey: "AIzaSyBr_b-tS0N68na4yBa9vFoEi1KQQRUJ2rI",
  authDomain: "familiaviva-6cc39.firebaseapp.com",
  projectId: "familiaviva-6cc39",
  storageBucket: "familiaviva-6cc39.firebasestorage.app",
  messagingSenderId: "766772076704",
  appId: "1:766772076704:web:bc5d6467a7f07b89f4e9c5",
  measurementId: "G-9759BJTCZW"
};
const __app_id = window.__app_id || "familia_viva_app";
const __initial_auth_token = window.__initial_auth_token || "";

// Inicializar Firebase
let app, auth, db;
try {
  app = initializeApp(__firebase_config);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (error) {
  console.error("Error inicializando Firebase:", error);
}

// Constantes
const BABY_AGE = "8 meses y 2 semanas";
const GEMINI_MODEL = "gemini-2.5-flash-preview-09-2025";
const GEMINI_API_KEY = ""; // SE REQUIERE LLAVE API AQUÍ

/**
 * SERVICIO GEMINI API
 * ------------------------------------------------------------------
 */
async function callGeminiAPI(systemPrompt, userQuery, useGrounding = false) {
  const apiKey = GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("Gemini API Key is missing.");
    return "Simulación: Configura la API Key para obtener respuestas reales de Gemini.";
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const tools = useGrounding ? [{ googleSearchRetrieval: { dynamicRetrievalConfig: { mode: "MODE_DYNAMIC", dynamicThreshold: 0.7 } } }] : [];

  const body = {
    contents: [
      {
        role: "user",
        parts: [{ text: `${systemPrompt}\n\nUser Query: ${userQuery}` }]
      }
    ],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 500,
    },
    tools: tools.length > 0 ? tools : undefined
  };

  try {
    // Implementación básica de backoff exponencial omitida por brevedad en un solo archivo, 
    // pero idealmente se usaría un loop con sleep.
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API Error: ${response.status} - ${errText}`);
    }

    const data = await response.json();

    // Extracción de respuesta
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "No se pudo generar respuesta.";

    // Manejo de citas/fuentes si hay grounding
    let sources = "";
    if (useGrounding && data.candidates?.[0]?.groundingMetadata?.groundingChunks) {
      sources = "\n\nFuentes:\n" + data.candidates[0].groundingMetadata.groundingChunks
        .map((chunk, idx) => `[${idx + 1}] ${chunk.web?.title || 'Fuente web'}`)
        .join("\n");
    }

    return content + sources;

  } catch (error) {
    console.error("Error calling Gemini:", error);
    return "Lo siento, hubo un error al consultar a mi asistente inteligente.";
  }
}

/**
 * COMPONENTES DE UI
 * ------------------------------------------------------------------
 */

const Header = ({ user, onLogout }) => (
  <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 px-4 py-3 shadow-sm flex justify-between items-center text-slate-700">
    <h1 className="text-xl font-bold bg-gradient-to-r from-teal-500 to-blue-500 bg-clip-text text-transparent">
      Familia Viva
    </h1>
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium text-slate-500 hidden sm:block">
        {user?.isAnonymous ? 'Invitado' : user?.email || 'Usuario'}
      </span>
      <button onClick={onLogout} className="p-2 rounded-full hover:bg-slate-100 text-slate-500">
        <LogOut size={18} />
      </button>
    </div>
  </header>
);

const TabButton = ({ active, icon: Icon, label, onClick }) => (
  <button
    onClick={onClick}
    className={`flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-colors ${active ? 'text-teal-600' : 'text-slate-400 hover:text-slate-600'
      }`}
  >
    <Icon size={24} strokeWidth={active ? 2.5 : 2} />
    <span className="text-[10px] font-medium">{label}</span>
  </button>
);

const MoodButton = ({ mood, icon: Icon, color, onClick }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center p-4 rounded-2xl shadow-lg transition-transform active:scale-95 bg-white border-2 ${color}`}
  >
    <Icon size={48} className="mb-2" />
    <span className="font-semibold text-sm capitalize">{mood}</span>
  </button>
);

const TimelineItem = ({ ageRange, title, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-l-2 border-teal-200 ml-4 pl-4 py-4 relative">
      <div className="absolute -left-[9px] top-4 w-4 h-4 rounded-full bg-teal-400 border-2 border-white" />
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left font-medium text-slate-700 hover:text-teal-600 mb-1 flex justify-between"
      >
        <span>{ageRange}: {title}</span>
        <span>{isOpen ? '-' : '+'}</span>
      </button>
      {isOpen && <div className="text-sm text-slate-500 mt-2">{children}</div>}
    </div>
  );
};

const ResourceCard = ({ title, type, description, icon: Icon }) => (
  <div className="bg-white p-4 rounded-xl shadow-md border border-slate-100 flex gap-4 items-start">
    <div className="p-3 bg-teal-50 text-teal-600 rounded-lg">
      <Icon size={24} />
    </div>
    <div>
      <h3 className="font-semibold text-slate-800 text-sm mb-1">{title}</h3>
      <span className="text-xs font-medium px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full mb-2 inline-block capitalize">
        {type}
      </span>
      <p className="text-xs text-slate-500 leading-relaxed">{description}</p>
    </div>
  </div>
);

/**
 * MODALES
 * ------------------------------------------------------------------
 */

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50">
          <h2 className="font-bold text-slate-800">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

const ChatBubble = ({ message, isUser }) => (
  <div className={`flex w-full mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
    <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${isUser
      ? 'bg-teal-500 text-white rounded-br-none'
      : 'bg-slate-100 text-slate-700 rounded-bl-none'
      }`}>
      {message}
    </div>
  </div>
);

/**
 * APP PRINCIPAL
 * ------------------------------------------------------------------
 */
export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('home');
  const [modals, setModals] = useState({ mood: false, chat: false, respite: false });
  const [currentMood, setCurrentMood] = useState(null);
  const [insight, setInsight] = useState(null);
  const [weeklyMilestone, setWeeklyMilestone] = useState(null);

  // Datos
  const [moodLogs, setMoodLogs] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Authentication Effect
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u);
      } else {
        // Fallback login
        if (__initial_auth_token) {
          signInWithCustomToken(auth, __initial_auth_token).catch(() => signInAnonymously(auth));
        } else {
          signInAnonymously(auth).catch(console.error);
        }
      }
    });
    return () => unsub();
  }, []);

  // Data Subscriptions
  useEffect(() => {
    if (!user) return;

    // Mood Logs (Last 7 days)
    const moodRef = collection(db, `artifacts/${__app_id}/users/${user.uid}/mood_logs`);
    const qMood = query(moodRef, orderBy("timestamp", "desc"), limit(50)); // Simplified limit for demo
    const unsubMood = onSnapshot(qMood, (snapshot) => {
      setMoodLogs(snapshot.docs.map(d => d.data()));
    });

    // Chat History
    const chatRef = collection(db, `artifacts/${__app_id}/users/${user.uid}/qa_chat_history`);
    const qChat = query(chatRef, orderBy("timestamp", "desc"), limit(10));
    const unsubChat = onSnapshot(qChat, (snapshot) => {
      setChatHistory(snapshot.docs.map(d => d.data()).reverse());
    });

    return () => {
      unsubMood();
      unsubChat();
    };
  }, [user]);

  // Generators (Gemini)
  useEffect(() => {
    if (activeTab === 'home' && moodLogs.length > 0 && !insight) {
      generateEmotionalInsight();
    }
  }, [activeTab, moodLogs]);

  useEffect(() => {
    if (activeTab === 'timeline' && !weeklyMilestone) {
      generateWeeklyMilestone();
    }
  }, [activeTab]);


  // Logica
  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
  };

  const handleMoodClick = async (mood) => {
    if (!user) return;
    setCurrentMood(mood);

    try {
      await addDoc(collection(db, `artifacts/${__app_id}/users/${user.uid}/mood_logs`), {
        mood,
        timestamp: serverTimestamp()
      });
      setModals(p => ({ ...p, mood: true }));
    } catch (e) {
      console.error("Error logging mood:", e);
    }
  };

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !user) return;

    const queryText = chatInput;
    setChatInput("");
    setIsChatLoading(true);

    // Optimistic Update (optional, but using Firestore listener for truth)
    // Save User Msg
    await addDoc(collection(db, `artifacts/${__app_id}/users/${user.uid}/qa_chat_history`), {
      role: 'user',
      text: queryText,
      timestamp: serverTimestamp()
    });

    // Call API
    const systemPrompt = "Eres un Pedagogo Asistente, experto en desarrollo 0-24 meses. Responde concisa y empáticamente. Usa información actualizada (Grounding) y cita tus fuentes al final si aplica.";
    const responseText = await callGeminiAPI(systemPrompt, queryText, true);

    // Save AI Msg
    await addDoc(collection(db, `artifacts/${__app_id}/users/${user.uid}/qa_chat_history`), {
      role: 'assistant',
      text: responseText,
      timestamp: serverTimestamp()
    });

    setIsChatLoading(false);
  };

  // Specific Generators
  const generateEmotionalInsight = async () => {
    const summary = moodLogs.map(l => l.mood).join(", "); // simple string summary
    const systemPrompt = "Eres un coach de bienestar para padres, con un tono cálido y empático. Analiza el resumen de datos de ánimo. Proporciona una conclusión de bienestar breve (1 frase) y un consejo proactivo, práctico y no invasivo para la próxima semana (1 frase).";
    const result = await callGeminiAPI(systemPrompt, `Resumen de ánimos recientes: ${summary}`);
    setInsight(result);
  };

  const generateWeeklyMilestone = async () => {
    const systemPrompt = "Eres un psicólogo de desarrollo infantil y coach de crianza. Analiza la edad del bebé. Genera un hito de desarrollo o habilidad que el bebé esté adquiriendo esta semana (en 1 frase). Luego, sugiere una actividad de apego o estimulación sencilla y específica que refuerce ese hito (en 1 frase). Responde con un tono positivo y de celebración.";
    const result = await callGeminiAPI(systemPrompt, `Edad del bebé: ${BABY_AGE}`);
    setWeeklyMilestone(result);
  };

  const handleEmotionalRespite = async () => {
    setModals(p => ({ ...p, mood: false, respite: true }));
  };

  const generateRespiteContent = async () => {
    // In a real app this would be a state, here generating on open or pre-fetched
    // For simplicity, we just return the promise to the modal content or use a dedicated state
    // Using a simple alert for demo or separate state if needed. 
    // Let's create a local state in the modal or use a prompt.
    return await callGeminiAPI(
      "Eres un coach emocional y psicoterapeuta. Tu tarea es ofrecer validación emocional, normalización del sentimiento y UNA única técnica de afrontamiento inmediata... Usa un tono de contención y empatía.",
      "Me siento abrumado/a (Rojo SOS)"
    );
  };


  // Views Renderers
  const renderHome = () => (
    <div className="space-y-6 pb-20">
      <section className="bg-gradient-to-br from-blue-50 to-teal-50 p-6 rounded-3xl text-center space-y-4 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-700">¿Cómo te sientes hoy?</h2>
        <p className="text-slate-500 text-sm">Registrar tus emociones es el primer paso para el autocuidado.</p>
        <div className="flex justify-center gap-4 mt-6">
          <MoodButton mood="calma" color="border-teal-400 text-teal-600 hover:bg-teal-50" icon={Smile} onClick={() => handleMoodClick('verde')} />
          <MoodButton mood="estrés" color="border-amber-400 text-amber-600 hover:bg-amber-50" icon={Meh} onClick={() => handleMoodClick('ambar')} />
          <MoodButton mood="SOS" color="border-red-400 text-red-600 hover:bg-red-50" icon={Frown} onClick={() => handleMoodClick('rojo')} />
        </div>
      </section>

      {insight && (
        <section className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 mx-4">
          <div className="flex items-center gap-2 mb-3 text-teal-600">
            <Sparkles size={18} />
            <span className="font-bold text-sm uppercase tracking-wide">Insight Semanal</span>
          </div>
          <p className="text-slate-600 text-sm leading-relaxed italic">
            "{insight}"
          </p>
        </section>
      )}
    </div>
  );

  const renderTimeline = () => (
    <div className="space-y-6 pb-20 px-4">
      <div className="bg-teal-600 text-white p-6 rounded-2xl shadow-lg mt-2">
        <span className="text-teal-100 text-xs font-semibold uppercase tracking-wider">Edad Actual</span>
        <h2 className="text-3xl font-bold mt-1">{BABY_AGE}</h2>
      </div>

      {weeklyMilestone && (
        <div className="bg-white p-5 rounded-2xl shadow-md border-l-4 border-teal-500">
          <h3 className="font-bold text-slate-800 mb-2">Hito de la Semana</h3>
          <p className="text-slate-600 text-sm">{weeklyMilestone}</p>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm p-4">
        <h3 className="font-bold text-slate-800 mb-4 px-2">Mapa de Desarrollo</h3>
        <TimelineItem ageRange="0-3 Meses" title="El Cuarto Trimestre">
          Enfoque en la regulación sensorial, apego seguro y adaptación al mundo exterior.
        </TimelineItem>
        <TimelineItem ageRange="3-6 Meses" title="Despertar Social">
          Aparición de la sonrisa social, mayor control de cabeza y descubrimiento de las manos.
        </TimelineItem>
        <TimelineItem ageRange="6-12 Meses" title="Exploración Activa">
          Inicio del gateo, sedestación independiente y primeras palabras.
        </TimelineItem>
        <TimelineItem ageRange="12-24 Meses" title="Autonomía e Identidad">
          Caminar, explosión del lenguaje y primeras manifestaciones de independencia (y berrinches).
        </TimelineItem>
      </div>
    </div>
  );

  const renderResources = () => (
    <div className="space-y-4 pb-20 px-4 pt-2">
      <h2 className="text-xl font-bold text-slate-800 mb-4">Biblioteca de Apoyo</h2>
      <ResourceCard
        title="Masajes para Dormir"
        type="video"
        description="Técnica Shantala paso a paso para relajar a tu bebé antes de dormir."
        icon={PlayCircle}
      />
      <ResourceCard
        title="Ruido Blanco y Calma"
        type="audio"
        description="Playlist de sonidos naturales para momentos de crisis o sueño."
        icon={Headphones}
      />
      <ResourceCard
        title="Guía de Lactancia y Vuelta al Trabajo"
        type="lectura"
        description="Tips para mantener la producción y el vínculo."
        icon={BookOpen}
      />
    </div>
  );

  // Modal Content Logic
  const getMoodModalContent = () => {
    if (currentMood === 'verde') {
      return {
        title: "¡Qué bueno verte bien!",
        body: "Aprovecha esta energía para conectar.",
        action: "Generar Actividad de Apego",
        onAction: async () => { alert(await callGeminiAPI("Sugiere una actividad de apego breve.", "Actividad de apego")); }
      };
    } else if (currentMood === 'ambar') {
      return {
        title: "Un respiro es necesario",
        body: "Es normal sentirse agobiado. ¿Qué tal un recurso de apoyo?",
        action: "Ir a la Biblioteca",
        onAction: () => { setModals(p => ({ ...p, mood: false })); setActiveTab('resources'); }
      };
    } else {
      return {
        title: "Estamos contigo",
        body: "Está bien no estar bien. Tu bienestar es prioridad.",
        action: "Respiro Emocional (SOS)",
        onAction: handleEmotionalRespite
      };
    }
  };
  const moodContent = getMoodModalContent();

  const [respiteText, setRespiteText] = useState("Cargando...");
  useEffect(() => {
    if (modals.respite) {
      generateRespiteContent().then(setRespiteText);
    }
  }, [modals.respite]);


  if (!user) return <div className="h-screen flex items-center justify-center text-slate-400">Cargando Familia Viva...</div>;

  return (
    <div className="bg-slate-50 min-h-screen font-sans text-slate-700 selection:bg-teal-100 pb-safe">
      <Header user={user} onLogout={handleLogout} />

      <main className="max-w-md mx-auto min-h-[calc(100vh-140px)] pt-4">
        {activeTab === 'home' && renderHome()}
        {activeTab === 'timeline' && renderTimeline()}
        {activeTab === 'resources' && renderResources()}
      </main>

      {/* Navigation */}
      <nav className="fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 px-6 py-1 flex justify-between items-center z-40 pb-safe-offset">
        <TabButton active={activeTab === 'home'} icon={Home} label="Hoy" onClick={() => setActiveTab('home')} />
        <TabButton active={activeTab === 'timeline'} icon={Calendar} label="Etapas" onClick={() => setActiveTab('timeline')} />
        <TabButton active={activeTab === 'resources'} icon={BookOpen} label="Recursos" onClick={() => setActiveTab('resources')} />
      </nav>

      {/* FAB */}
      <button
        onClick={() => setModals(p => ({ ...p, chat: true }))}
        className="fixed bottom-20 right-4 bg-teal-600 text-white p-4 rounded-full shadow-xl hover:bg-teal-700 active:scale-90 transition-all z-40"
      >
        <MessageCircle size={28} />
      </button>

      {/* Modals */}
      <Modal isOpen={modals.mood} onClose={() => setModals(p => ({ ...p, mood: false }))} title={moodContent.title}>
        <div className="space-y-4 text-center">
          <p className="text-slate-600">{moodContent.body}</p>
          <button
            onClick={moodContent.onAction}
            className="w-full py-3 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 transition"
          >
            {moodContent.action}
          </button>
        </div>
      </Modal>

      <Modal isOpen={modals.respite} onClose={() => setModals(p => ({ ...p, respite: false }))} title="Respiro Emocional">
        <div className="prose prose-sm prose-slate">
          <p className="whitespace-pre-wrap">{respiteText}</p>
        </div>
        <button onClick={() => setModals(p => ({ ...p, respite: false }))} className="w-full mt-4 py-2 bg-slate-200 rounded-lg text-slate-700 font-medium">Cerrar</button>
      </Modal>

      <Modal isOpen={modals.chat} onClose={() => setModals(p => ({ ...p, chat: false }))} title="Asistente Pedagógico">
        <div className="flex flex-col h-[50vh]">
          <div className="flex-1 overflow-y-auto mb-4 space-y-2">
            {chatHistory.length === 0 && (
              <p className="text-center text-slate-400 text-sm mt-10">Hola, soy tu asistente. Pregúntame sobre el sueño, alimentación o desarrollo de tu bebé.</p>
            )}
            {chatHistory.map((msg, i) => (
              <ChatBubble key={i} message={msg.text} isUser={msg.role === 'user'} />
            ))}
            {isChatLoading && <p className="text-center text-xs text-slate-400 animate-pulse">Escribiendo...</p>}
          </div>
          <form onSubmit={handleChatSubmit} className="flex gap-2 border-t pt-2">
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Escribe tu duda..."
              className="flex-1 bg-slate-100 border-0 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
            />
            <button type="submit" disabled={isChatLoading} className="p-2 bg-teal-600 text-white rounded-xl hover:bg-teal-700 disabled:opacity-50">
              <Send size={20} />
            </button>
          </form>
        </div>
      </Modal>

    </div>
  );
}

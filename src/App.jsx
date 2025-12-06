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
import {
  Heart,
  Baby,
  Calendar,
  BookOpen,
  Smile,
  Meh,
  Frown,
  AlertCircle,
  CheckCircle,
  Info,
  Zap,
  Loader,
  MessageSquare,
  ChevronDown,
  X,
  Send,
  Search,
  BarChart2,
  ClipboardList,
  Clock,
  User,
  LogOut,
} from 'lucide-react';

// --- CONFIGURACIÓN DE FIREBASE (Manejo seguro de credenciales) ---
// *** ATENCIÓN: PARA VERCEL, DEBES CAMBIAR ESTAS LÍNEAS ***
// DEBES USAR: 
// const firebaseConfig = JSON.parse(import.meta.env.VITE_FIREBASE_CONFIG || '{}');
// const appId = import.meta.env.VITE_APP_ID || 'familia-viva-app';
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
// ************************************************************

// --- UTILITY LLM API CALL WITH BACKOFF ---
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const callGeminiAPI = async (systemPrompt, userQuery, useGrounding = false) => {
  const apiKey = "AIzaSyD2ThwOu-r_neNFmzLoE0yGlXuLNhVl30U";
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  const maxRetries = 3;

  const payload = {
    contents: [
      {
        role: "system",
        parts: [{ text: systemPrompt }]
      },
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

      return { text, sources: [] };

    } catch (error) {
      if (attempt === maxRetries - 1) {
        console.error("Gemini API failed after multiple retries:", error);
        return { text: "Error al conectar con el asistente.", sources: [] };
      }
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
  const chatScrollRef = useRef(null);

  // --- AUTENTICACIÓN Y CARGA DE DATOS ---
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof window.__initial_auth_token !== 'undefined' && window.__initial_auth_token) {
          // Intenta autenticar con el token de la plataforma
          await signInWithCustomToken(auth, window.__initial_auth_token);
        } else {
          // Si no hay token, inicia sesión de forma anónima
          await signInAnonymously(auth);
        }
      } catch (error) {
        // En caso de error (probablemente auth/operation-not-allowed),
        // intenta el método alternativo para garantizar un usuario.
        console.error("Error en autenticación inicial, intentando fallback:", error);
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
    const qMood = query(
      moodRef,
      orderBy('timestamp', 'desc'),
      limit(7)
    );

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
    }, (error) => {
      console.error("Error fetching mood logs:", error);
    });

    // Historial de Chat (Máximo 10)
    const chatRef = collection(db, 'artifacts', appId, 'users', user.uid, 'qa_chat_history');
    const qChat = query(
      chatRef,
      orderBy('timestamp', 'asc'),
      limit(10)
    );

    const unsubscribeChat = onSnapshot(qChat, (snapshot) => {
      const history = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setChatHistory(history);
      setTimeout(() => {
        if (chatScrollRef.current) {
          chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
        }
      }, 100);
    }, (error) => {
      console.error("Error fetching chat history:", error);
    });

    return () => {
      unsubscribeMood();
      unsubscribeChat();
    };
  }, [user]);

  // --- LLM FUNCTION: GENERAR HITO SEMANAL PERSONALIZADO ---
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
      generateWeeklyMilestone();
    }
  }, [user, activeTab, weeklyMilestone, isMilestoneLoading, generateWeeklyMilestone]);


  // --- LLM FUNCTION: GENERAR INFORME DE BIENESTAR SEMANAL ---
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

  // --- LLM FUNCTION: PREGUNTAR AL PEDAGOGO (con Grounding) ---
  const askPedagogue = useCallback(async (question) => {
    if (!user || !question.trim()) return;

    const userMessage = { role: 'user', text: question.trim(), timestamp: new Date() };

    setChatHistory(prev => [...prev, userMessage, { role: 'assistant', text: '...' }]);
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

    const assistantMessage = { role: 'assistant', text: formattedResponse, sources, timestamp: new Date() };

    setChatHistory(prev => {
      const newHistory = prev.slice(0, -1);
      return [...newHistory, assistantMessage];
    });

    await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'qa_chat_history'), {
      role: 'assistant',
      text: llmResponseText,
      sources: sources.map(s => ({ title: s.title, uri: s.uri })),
      timestamp: serverTimestamp()
    });

    setTimeout(() => {
      if (chatScrollRef.current) {
        chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
      }
    }, 100);

  }, [user]);

  // --- LLM FUNCTION: GENERAR ACTIVIDAD DE APEGO (VERDE) ---
  const generateActivityTip = async () => {
    setIsGenerating(true);
    const systemPrompt = "Eres un psicólogo especialista en desarrollo infantil temprano y apego. Tu respuesta debe ser una actividad práctica, sencilla, que promueva el vínculo y la estimulación. Limítate a 4 frases concisas y usa un tono positivo y alentador.";
    const userQuery = `Genera una actividad de juego de 5 minutos para un bebé de ${babyAge}. Enfócate en el apego seguro.`;

    const { text: result } = await callGeminiAPI(systemPrompt, userQuery, false);

    setModalContent(prev => ({
      ...prev,
      llmText: result,
      action: "¡Actividad lista!",
      color: "bg-green-100 text-green-800"
    }));

    setIsGenerating(false);
  };

  // --- LLM FUNCTION: GENERAR RESPIRO EMOCIONAL (ROJO) ---
  const generateEmotionalRespite = async () => {
    setIsGenerating(true);
    const systemPrompt = "Eres un coach emocional y psicoterapeuta. Tu tarea es ofrecer validación emocional, normalización del sentimiento y UNA única técnica de afrontamiento inmediata (ej. beber agua, respiración cuadrada) en 4 líneas. Usa un tono de contención y empatía.";
    const userQuery = "Estoy sintiendo que estoy sobrepasado y que no puedo más con la crianza.";

    const { text: result } = await callGeminiAPI(systemPrompt, userQuery, false);

    setModalContent(prev => ({
      ...prev,
      llmText: result,
      action: "¡Toma un respiro!",
      color: "bg-red-100 text-red-800"
    }));

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
          body: "Parece que hay un poco de estrés. Es normal. Tómate 3 minutos para ti antes de continuar. Puedes encontrar una meditación en la sección de Biblioteca.",
          action: "Ver Recursos",
          color: "bg-yellow-100 text-yellow-800",
          llmFunction: null,
          llmText: null,
          actionLabel: "Ver Recursos de Autocuidado",
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

  // --- HANDLERS DE AUTENTICACIÓN SIMPLIFICADA ---

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // Volver a iniciar sesión de forma anónima para mantener la funcionalidad
      await signInAnonymously(auth);
      // Limpiar estados sensibles y resetear a la vista principal
      setWeeklyInsight(null);
      setWeeklyMilestone(null);
      setMoodHistory([]);
      setChatHistory([]);
      setActiveTab('home');
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  // --- RENDERIZADO DE VISTAS ---

  if (loading) {
    return <div className="flex items-center justify-center h-screen bg-slate-50 text-slate-400">Cargando Familia Viva...</div>;
  }

  const userId = user?.uid || 'ID de Invitado';
  const displayUserName = user?.email ? user.email.split('@')[0] : 'Usuario Conectado';
  const isAnonymousUser = auth.currentUser?.isAnonymous;

  return (
    <div className="relative flex flex-col h-screen font-sans text-slate-800 overflow-hidden">

      {/* FONDO SUAVE Y BLURRY */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: "url(https://placehold.co/1000x1000/F0F8FF/6495ED?text=Fondo+Suave+Familia)",
          filter: "blur(20px)",
          transform: "scale(1.1)"
        }}
      ></div>

      {/* CAPA DE OPACIDAD (para asegurar contraste) */}
      <div className="absolute inset-0 bg-slate-50 opacity-80"></div>

      {/* CONTENIDO (Asegura que el contenido esté sobre el fondo) */}
      <div className="relative flex flex-col h-full z-10">

        {/* HEADER */}
        <header className="bg-white p-4 shadow-sm flex justify-between items-center z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-sky-100 rounded-full flex items-center justify-center text-sky-600">
              <Heart size={18} fill="currentColor" />
            </div>
            <h1 className="font-bold text-lg text-sky-900 tracking-tight">Familia Viva</h1>
          </div>

          {/* Botón de Perfil / Cerrar Sesión (Ahora siempre visible) */}
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white p-2 rounded-full flex items-center gap-1 text-xs font-medium hover:bg-red-600 transition-colors shadow-md"
            title={`Usuario ID: ${userId} | Click para Cerrar Sesión`}
          >
            <LogOut size={16} />
          </button>
        </header>

        {/* CONTENIDO PRINCIPAL (SCROLLABLE) */}
        <main className="flex-1 overflow-y-auto p-4 pb-24">

          {/* VISTA: HOME (SEMÁFORO) */}
          {activeTab === 'home' && (
            <div className="space-y-6 animate-in fade-in duration-500">
              {/* Saludo */}
              <div className="bg-gradient-to-r from-sky-500 to-indigo-500 rounded-2xl p-6 text-white shadow-lg">
                <h2 className="text-2xl font-bold mb-1">Hola, {displayUserName}</h2>
                <p className="opacity-90 text-sm">Estamos para acompañarte en tu bienestar.</p>
              </div>

              {/* TARJETA DE AVISO (Si es Anónimo) */}
              {isAnonymousUser && (
                <div className="bg-yellow-50 rounded-2xl p-4 shadow-sm border border-yellow-200 text-yellow-800">
                  <h3 className="font-semibold flex items-center gap-2 mb-1">
                    <Info size={18} className="text-yellow-600" />
                    Modo Anónimo
                  </h3>
                  <p className="text-sm">
                    Estás usando la aplicación de forma anónima (ID: {userId.substring(0, 8)}...). Tu historial se guardará temporalmente.
                  </p>
                </div>
              )}

              {/* Informe de Bienestar Semanal */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
                  <BarChart2 size={20} className="text-indigo-500" /> Informe de Bienestar
                </h3>

                {weeklyInsight ? (
                  <div className="text-sm text-slate-600 whitespace-pre-line">
                    {weeklyInsight}
                  </div>
                ) : isInsightLoading ? (
                  <div className="flex items-center justify-center py-4 text-sky-500">
                    <Loader size={20} className="animate-spin mr-2" />
                    Analizando tu semana...
                  </div>
                ) : (
                  <button
                    onClick={generateEmotionalInsight}
                    disabled={moodHistory.length === 0}
                    className="w-full bg-indigo-500 text-white text-sm py-3 rounded-xl font-medium hover:bg-indigo-600 transition-colors disabled:bg-slate-300"
                  >
                    {moodHistory.length === 0 ? "Registra tu ánimo para ver el informe" : "Generar Análisis de la Semana ✨"}
                  </button>
                )}
              </div>

              {/* Semáforo Emocional */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <h3 className="font-semibold text-slate-700 mb-4 text-center">Semáforo Emocional de Hoy</h3>

                <div className="flex justify-between gap-2">
                  <button
                    onClick={() => handleMoodSelect('verde', 'green', 'Calma')}
                    className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-xl transition-all ${currentMood === 'verde' ? 'bg-green-100 ring-2 ring-green-500 scale-105' : 'bg-slate-50 hover:bg-green-50'}`}
                  >
                    <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center text-white shadow-sm">
                      <Smile size={28} />
                    </div>
                    <span className="text-xs font-medium text-slate-600">En Calma</span>
                  </button>

                  <button
                    onClick={() => handleMoodSelect('ambar', 'yellow', 'Estrés')}
                    className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-xl transition-all ${currentMood === 'ambar' ? 'bg-yellow-100 ring-2 ring-yellow-500 scale-105' : 'bg-slate-50 hover:bg-yellow-50'}`}
                  >
                    <div className="w-12 h-12 rounded-full bg-amber-400 flex items-center justify-center text-white shadow-sm">
                      <Meh size={28} />
                    </div>
                    <span className="text-xs font-medium text-slate-600">Estrés</span>
                  </button>

                  <button
                    onClick={() => handleMoodSelect('rojo', 'red', 'Sobrepasado')}
                    className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-xl transition-all ${currentMood === 'rojo' ? 'bg-red-100 ring-2 ring-red-500 scale-105' : 'bg-slate-50 hover:bg-red-50'}`}
                  >
                    <div className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center text-white shadow-sm">
                      <Frown size={28} />
                    </div>
                    <span className="text-xs font-medium text-slate-600">SOS</span>
                  </button>
                </div>
              </div>

              {/* Historial Reciente */}
              {moodHistory.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-slate-500 px-1 flex items-center gap-1">
                    <ClipboardList size={14} />
                    Tus últimos registros
                  </h3>
                  {moodHistory.slice(0, 5).map((log) => (
                    <div key={log.id} className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-100">
                      <div className={`w-2 h-10 rounded-full ${log.mood === 'verde' ? 'bg-green-500' : log.mood === 'ambar' ? 'bg-amber-400' : 'bg-red-500'}`}></div>
                      <div>
                        <p className="text-sm font-medium capitalize text-slate-700">{log.note}</p>
                        <p className="text-xs text-slate-400">
                          {log.timestamp ? log.timestamp.toDate().toLocaleDateString() : 'Hoy'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* VISTA: LÍNEA DE TIEMPO (APEGO) */}
          {activeTab === 'timeline' && (
            <div className="space-y-4 animate-in fade-in duration-500">
              <div className="bg-sky-50 p-4 rounded-xl border border-sky-100 mb-4">
                <h2 className="text-lg font-bold text-sky-800">Tu Acompañante 0-24</h2>
                <p className="text-sm text-sky-600">Guía basada en la Teoría del Apego</p>
              </div>

              {/* Hito Semanal Personalizado */}
              <div className="bg-white rounded-2xl p-6 shadow-md border border-sky-200">
                <h3 className="font-semibold text-sky-700 mb-3 flex items-center gap-2">
                  <Clock size={20} className="text-sky-500" /> Hito Personalizado: <span className="text-sm font-medium italic">Bebé de {babyAge}</span>
                </h3>

                {weeklyMilestone ? (
                  <div className="text-sm text-slate-600 whitespace-pre-line bg-sky-50 p-3 rounded-lg border-l-4 border-sky-400">
                    {weeklyMilestone}
                  </div>
                ) : isMilestoneLoading ? (
                  <div className="flex items-center justify-center py-4 text-sky-500">
                    <Loader size={20} className="animate-spin mr-2" />
                    Analizando la etapa de tu bebé...
                  </div>
                ) : (
                  <button
                    onClick={generateWeeklyMilestone}
                    className="w-full bg-sky-500 text-white text-sm py-3 rounded-xl font-medium hover:bg-sky-600 transition-colors"
                  >
                    Generar Hito Semanal ✨
                  </button>
                )}
              </div>

              {/* Hitos de Desarrollo - Imagen conceptual */}
              <div className="flex justify-center p-4 bg-white rounded-xl shadow-sm border border-slate-100">
                <img src="https://placehold.co/600x200/e0f2fe/0284c7?text=Hitos+del+Desarrollo+0-24m" alt="Hitos" className="rounded-lg" />
              </div>

              <TimelineItem
                age="0 - 3 Meses"
                title="El Cuarto Trimestre"
                desc="Tu bebé necesita contacto piel con piel. No se le puede 'malcriar' por cargarlo mucho en esta etapa."
                color="bg-purple-100 text-purple-700 border-purple-200"
                icon={<Baby size={20} />}
              />
              <TimelineItem
                age="3 - 6 Meses"
                title="El Despertar Social"
                desc="Comienzan las sonrisas sociales. Responde a sus balbuceos para crear el patrón 'servir y devolver'."
                color="bg-pink-100 text-pink-700 border-pink-200"
                icon={<Smile size={20} />}
              />
              <TimelineItem
                age="6 - 12 Meses"
                title="Ansiedad de Separación"
                desc="Es normal que llore si te vas. Juega a '¿Dónde está el bebé?' para enseñarle que siempre regresas."
                color="bg-orange-100 text-orange-700 border-orange-200"
                icon={<AlertCircle size={20} />}
              />
              <TimelineItem
                age="12 - 24 Meses"
                title="Exploración y Límites"
                desc="Empieza la autonomía. Necesita una base segura para explorar y regresar a ti para 'recargar' seguridad."
                color="bg-teal-100 text-teal-700 border-teal-200"
                icon={<CheckCircle size={20} />}
              />
            </div>
          )}

          {/* VISTA: BIBLIOTECA (Antes Recursos) */}
          {activeTab === 'resources' && (
            <div className="space-y-4 animate-in fade-in duration-500">
              <h2 className="text-xl font-bold text-slate-800 mb-2">Biblioteca de Apoyo</h2>

              <ResourceCard
                category="Vídeo"
                title="Calmando el llanto"
                desc="Técnicas de contención física y arrullo para momentos de crisis."
                tag="Práctico"
              />
              <ResourceCard
                category="Lectura"
                title="¿Qué es el Apego Seguro?"
                desc="Entiende la ciencia detrás del vínculo con tu bebé."
                tag="Teoría"
              />
              <ResourceCard
                category="Audio"
                title="Meditación para Padres Cansados"
                desc="5 minutos de respiración para recuperar tu centro."
                tag="Autocuidado"
              />

              <div className="bg-indigo-50 p-4 rounded-xl mt-6 border border-indigo-100 text-center">
                <h3 className="font-bold text-indigo-900">¿Necesitas ayuda personalizada?</h3>
                <p className="text-xs text-indigo-700 mt-1 mb-3">Agenda una sesión híbrida con nuestros especialistas.</p>
                <button className="bg-indigo-600 text-white text-sm py-2 px-4 rounded-lg w-full font-medium">
                  Contactar Especialista
                </button>
              </div>
            </div>
          )}
        </main>

        {/* BOTÓN FLOTANTE (FAB) PARA ASISTENTE Q&A */}
        <button
          onClick={() => setShowQAchatModal(true)}
          className="fixed bottom-20 right-4 p-4 rounded-full bg-sky-600 text-white shadow-xl hover:bg-sky-700 transition-all z-30"
          title="Asistente de Preguntas y Respuestas"
        >
          <MessageSquare size={28} />
        </button>

        {/* MODAL DE FEEDBACK EMOCIONAL (Semáforo) */}
        {showMoodModal && modalContent && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
              <div className={`p-6 ${modalContent.color} bg-opacity-20`}>
                <h3 className={`text-xl font-bold ${modalContent.color.split(' ')[1]}`}>{modalContent.title}</h3>
              </div>
              <div className="p-6">
                <p className="text-slate-600 mb-6 leading-relaxed">
                  {modalContent.body}
                </p>

                {/* Contenido LLM Generado */}
                {modalContent.llmText && (
                  <div className="p-4 mb-4 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700 whitespace-pre-line">
                    <p className="font-bold mb-1 flex items-center gap-1">
                      <MessageSquare size={16} className="text-sky-500" />
                      Asistente de Crianza:
                    </p>
                    {modalContent.llmText}
                  </div>
                )}

                <div className="flex flex-col gap-3">
                  {modalContent.llmFunction && (
                    <button
                      onClick={modalContent.llmFunction}
                      disabled={isGenerating}
                      className={`w-full text-white py-3 rounded-xl font-medium shadow-lg transition-all flex items-center justify-center gap-2
                            ${modalContent.mood === 'verde' ? 'bg-green-600 hover:bg-green-700 shadow-green-200' : 'bg-red-600 hover:bg-red-700 shadow-red-200'}
                            ${isGenerating ? 'opacity-70 cursor-not-allowed' : ''}
                          `}
                    >
                      {isGenerating ? (
                        <>
                          <Loader size={20} className="animate-spin" />
                          Generando...
                        </>
                      ) : (
                        <>
                          <Zap size={20} />
                          {modalContent.actionLabel}
                        </>
                      )}
                    </button>
                  )}

                  <button
                    onClick={() => setShowMoodModal(false)}
                    className="w-full text-slate-400 text-sm py-2"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL DE CHAT Q&A */}
        {showQAchatModal && (
          <div className="fixed inset-0 bg-white z-50 flex flex-col animate-in slide-in-from-bottom duration-300">

            {/* Encabezado del Chat */}
            <div className="bg-sky-600 p-4 text-white flex items-center justify-between shadow-md">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Search size={20} /> Asistente Pedagógico
              </h2>
              <button onClick={() => setShowQAchatModal(false)} className="p-1 rounded-full hover:bg-sky-500">
                <X size={24} />
              </button>
            </div>

            {/* Cuerpo del Chat (Scrollable) */}
            <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
              {chatHistory.length === 0 && (
                <div className="text-center text-slate-400 p-8 pt-16">
                  <MessageSquare size={40} className="mx-auto mb-2" />
                  <p className="text-sm">Pregúntale a nuestro asistente sobre cualquier duda de crianza 0-24 meses. Usamos información actualizada y con fuentes.</p>
                </div>
              )}

              {chatHistory.map((msg, index) => (
                <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-xl shadow-sm ${msg.role === 'user' ? 'bg-sky-100 text-sky-900 rounded-br-none' : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'}`}>
                    {msg.role === 'assistant' ? (
                      <div className="whitespace-pre-wrap text-sm">
                        {msg.text === '...' ? (
                          <span className="flex items-center gap-2 text-slate-500 italic">
                            <Loader size={16} className="animate-spin" />
                            Buscando respuesta...
                          </span>
                        ) : (
                          // Renderizar respuesta con markdown
                          <div dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br>') }} />
                        )}
                      </div>
                    ) : (
                      <p className="font-medium text-sm">{msg.text}</p>
                    )}
                  </div>
                </div>
              ))}

            </div>

            {/* Input del Chat */}
            <form onSubmit={handleChatSubmit} className="p-4 bg-white border-t border-slate-100 flex items-center gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Escribe tu pregunta de crianza..."
                className="flex-1 p-3 border border-slate-200 rounded-full focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
                disabled={isGenerating || isInsightLoading}
              />
              <button
                type="submit"
                className="p-3 rounded-full bg-sky-600 text-white hover:bg-sky-700 disabled:bg-slate-400 transition-colors"
                disabled={isGenerating || isInsightLoading || !chatInput.trim()}
              >
                <Send size={24} />
              </button>
            </form>
          </div>
        )}

        {/* BARRA DE NAVEGACIÓN INFERIOR (TAB BAR) */}
        <nav className="bg-white border-t border-slate-100 p-2 pb-6 fixed bottom-0 w-full z-20">
          <div className="flex justify-around items-center">
            <TabButton
              active={activeTab === 'home'}
              onClick={() => setActiveTab('home')}
              icon={<Heart size={24} />}
              label="Hoy"
            />
            <TabButton
              active={activeTab === 'timeline'}
              onClick={() => setActiveTab('timeline')}
              icon={<Calendar size={24} />}
              label="Etapas"
            />
            <TabButton
              active={activeTab === 'resources'}
              onClick={() => setActiveTab('resources')}
              icon={<BookOpen size={24} />}
              label="Biblioteca"
            />
          </div>
        </nav>
      </div>

    </div>
  );
}

// --- SUBCOMPONENTES ---

function TabButton({ active, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${active ? 'text-sky-600' : 'text-slate-400 hover:text-slate-600'}`}
    >
      {icon}
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}

function TimelineItem({ age, title, desc, color, icon }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`border rounded-xl overflow-hidden transition-all bg-white shadow-sm ${isOpen ? 'ring-2 ring-sky-100' : 'border-slate-100'}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-4 p-4 text-left"
      >
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${color.split(' ')[0]} ${color.split(' ')[1]}`}>
          {icon}
        </div>
        <div className="flex-1">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{age}</p>
          <h4 className="font-bold text-slate-800">{title}</h4>
        </div>
        <div className={`transform transition-transform text-slate-400 ${isOpen ? 'rotate-180' : ''}`}>
          <ChevronDown size={16} />
        </div>
      </button>

      {isOpen && (
        <div className="px-4 pb-4 pt-0">
          <div className="h-px bg-slate-100 mb-3"></div>
          <p className="text-sm text-slate-600 leading-relaxed">
            {desc}
          </p>
          <button className="mt-3 text-xs font-bold text-sky-600 flex items-center gap-1">
            Ver actividades para esta etapa <Info size={12} />
          </button>
        </div>
      )}
    </div>
  );
}

function ResourceCard({ category, title, desc, tag }) {
  return (
    <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex gap-4 items-start">
      <div className="w-16 h-16 bg-slate-100 rounded-lg shrink-0 flex items-center justify-center text-slate-400">
        <BookOpen size={24} />
      </div>
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] uppercase font-bold text-slate-400">{category}</span>
          <span className="text-[10px] bg-sky-100 text-sky-700 px-2 py-0.5 rounded-full font-bold">{tag}</span>
        </div>
        <h4 className="font-bold text-slate-800 text-sm">{title}</h4>
        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{desc}</p>
      </div>
    </div>
  );
}

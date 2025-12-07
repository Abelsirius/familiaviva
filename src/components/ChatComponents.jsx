import React, { useEffect, useRef } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Search, X, Loader, Send } from 'lucide-react';

export function ChatButton({ onClick }) {
    return (
        <Motion.button
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClick}
            className="fixed bottom-24 right-6 p-4 rounded-full bg-gradient-to-r from-sky-500 to-sky-600 text-white shadow-xl shadow-sky-300 hover:shadow-2xl transition-all z-30"
            title="Asistente de Preguntas y Respuestas"
        >
            <MessageSquare size={28} />
        </Motion.button>
    );
}

export function ChatModal({
    showQAchatModal,
    setShowQAchatModal,
    chatHistory,
    chatInput,
    setChatInput,
    handleChatSubmit,
    isGenerating,
    isInsightLoading
}) {
    const chatScrollRef = useRef(null);

    useEffect(() => {
        if (chatScrollRef.current) {
            chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
        }
    }, [chatHistory, showQAchatModal]);

    return (
        <AnimatePresence>
            {showQAchatModal && (
                <Motion.div
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="fixed inset-0 bg-white z-50 flex flex-col"
                >
                    {/* Encabezado del Chat */}
                    <div className="bg-sky-600 p-4 text-white flex items-center justify-between shadow-md">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Search size={20} /> Asistente Pedagógico
                        </h2>
                        <button onClick={() => setShowQAchatModal(false)} className="p-1 rounded-full hover:bg-sky-500 transition-colors">
                            <X size={24} />
                        </button>
                    </div>

                    {/* Cuerpo del Chat (Scrollable) */}
                    <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                        {chatHistory.length === 0 && (
                            <div className="text-center text-slate-400 p-8 pt-16 flex flex-col items-center">
                                <Motion.div
                                    animate={{ rotate: [0, 10, -10, 0] }}
                                    transition={{ repeat: Infinity, duration: 5, delay: 1 }}
                                >
                                    <MessageSquare size={48} className="mb-4 text-sky-200" />
                                </Motion.div>
                                <p className="text-sm max-w-xs leading-relaxed">
                                    Pregúntale a nuestro asistente sobre cualquier duda de crianza 0-24 meses. Usamos información actualizada y con fuentes.
                                </p>
                            </div>
                        )}

                        {chatHistory.map((msg, index) => (
                            <Motion.div
                                key={index}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`max-w-[85%] p-4 rounded-2xl shadow-sm leading-relaxed ${msg.role === 'user'
                                    ? 'bg-sky-100 text-sky-900 rounded-br-sm'
                                    : 'bg-white text-slate-800 rounded-tl-sm border border-slate-100'
                                    }`}>
                                    {msg.role === 'assistant' ? (
                                        <div className="whitespace-pre-wrap text-sm">
                                            {msg.text === '...' ? (
                                                <span className="flex items-center gap-2 text-slate-500 italic">
                                                    <Loader size={16} className="animate-spin" />
                                                    Buscando respuesta...
                                                </span>
                                            ) : (
                                                <div dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br>') }} />
                                            )}
                                        </div>
                                    ) : (
                                        <p className="font-medium text-sm">{msg.text}</p>
                                    )}
                                </div>
                            </Motion.div>
                        ))}
                    </div>

                    {/* Input del Chat */}
                    <form onSubmit={handleChatSubmit} className="p-4 bg-white border-t border-slate-100 flex items-center gap-2 safe-bottom">
                        <input
                            type="text"
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            placeholder="Escribe tu pregunta..."
                            className="flex-1 p-4 border border-slate-200 rounded-full focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none shadow-sm text-sm"
                            disabled={isGenerating || isInsightLoading}
                        />
                        <Motion.button
                            whileTap={{ scale: 0.9 }}
                            type="submit"
                            className="p-4 rounded-full bg-sky-600 text-white hover:bg-sky-700 disabled:bg-slate-300 transition-colors shadow-lg shadow-sky-200"
                            disabled={isGenerating || isInsightLoading || !chatInput.trim()}
                        >
                            <Send size={20} />
                        </Motion.button>
                    </form>
                </Motion.div>
            )}
        </AnimatePresence>
    );
}

import React from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Zap, Loader, X } from 'lucide-react';

export default function MoodModal({
    showMoodModal,
    setShowMoodModal,
    modalContent,
    isGenerating
}) {
    return (
        <AnimatePresence>
            {showMoodModal && modalContent && (
                <Motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                >
                    <Motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative"
                    >
                        <button
                            onClick={() => setShowMoodModal(false)}
                            className="absolute top-4 right-4 bg-white/50 hover:bg-white p-1 rounded-full text-slate-500 transition-colors z-10"
                        >
                            <X size={20} />
                        </button>

                        <div className={`p-8 ${modalContent.color} bg-opacity-20`}>
                            <h3 className={`text-2xl font-bold ${modalContent.color.split(' ')[1]}`}>{modalContent.title}</h3>
                        </div>

                        <div className="p-8">
                            <p className="text-slate-600 mb-6 leading-relaxed text-base font-medium">
                                {modalContent.body}
                            </p>

                            {/* Contenido LLM Generado */}
                            {modalContent.llmText && (
                                <Motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="p-4 mb-6 rounded-2xl bg-slate-50 border border-slate-100 text-sm text-slate-700 whitespace-pre-line shadow-inner"
                                >
                                    <p className="font-bold mb-2 flex items-center gap-2 text-indigo-600">
                                        <MessageSquare size={16} />
                                        Asistente de Crianza:
                                    </p>
                                    {modalContent.llmText}
                                </Motion.div>
                            )}

                            <div className="flex flex-col gap-3">
                                {modalContent.llmFunction && (
                                    <Motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={modalContent.llmFunction}
                                        disabled={isGenerating}
                                        className={`w-full text-white py-4 rounded-2xl font-bold shadow-lg transition-all flex items-center justify-center gap-2
                          ${modalContent.mood === 'verde' ? 'bg-green-600 hover:bg-green-700 shadow-green-200' : 'bg-red-600 hover:bg-red-700 shadow-red-200'}
                          ${isGenerating ? 'opacity-70 cursor-not-allowed' : ''}
                        `}
                                    >
                                        {isGenerating ? (
                                            <>
                                                <Loader size={20} className="animate-spin" />
                                                Generando recomendación...
                                            </>
                                        ) : (
                                            <>
                                                <Zap size={20} />
                                                {modalContent.actionLabel}
                                            </>
                                        )}
                                    </Motion.button>
                                )}

                                <button
                                    onClick={() => setShowMoodModal(false)}
                                    className="w-full text-slate-400 text-sm py-2 hover:text-slate-600 transition-colors"
                                >
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </Motion.div>
                </Motion.div>
            )}
        </AnimatePresence>
    );
}

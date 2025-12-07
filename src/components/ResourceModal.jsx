import React from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { X, Loader, Sparkles, BookOpen, Play, Headphones } from 'lucide-react';

export default function ResourceModal({
    showModal,
    onClose,
    content,
    isLoading
}) {
    return (
        <AnimatePresence>
            {showModal && (
                <Motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4"
                >
                    <Motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        className="bg-white rounded-3xl w-full max-w-lg max-h-[85vh] overflow-hidden shadow-2xl relative flex flex-col"
                    >
                        {/* Header */}
                        <div className={`p-6 ${getHeaderColor(content?.category)} text-white relative shrink-0`}>
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 p-2 rounded-full transition-colors backdrop-blur-sm"
                            >
                                <X size={20} />
                            </button>

                            <Motion.div
                                initial={{ x: -10, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.1 }}
                                className="flex items-center gap-3 mb-2"
                            >
                                <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                                    {getIcon(content?.category)}
                                </div>
                                <span className="font-bold uppercase tracking-wider text-xs opacity-90">{content?.category || 'Recurso'}</span>
                            </Motion.div>

                            <h2 className="text-2xl font-bold leading-tight pr-8">{content?.title || 'Cargando...'}</h2>
                        </div>

                        {/* Body */}
                        <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-4">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-indigo-100 rounded-full animate-ping opacity-75"></div>
                                        <div className="bg-white p-4 rounded-full shadow-md relative z-10">
                                            <Sparkles size={32} className="text-indigo-500 animate-pulse" />
                                        </div>
                                    </div>
                                    <p className="text-sm font-medium animate-pulse text-indigo-400">Creando tu guía personalizada con IA...</p>
                                </div>
                            ) : (
                                <Motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="prose prose-slate prose-sm max-w-none"
                                >
                                    <div className="whitespace-pre-line leading-relaxed text-slate-700">
                                        {/* Renderizado simple de markdown bold y headers */}
                                        <div dangerouslySetInnerHTML={{ __html: parseMarkdown(content?.text) }} />
                                    </div>
                                </Motion.div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-slate-100 bg-white shrink-0">
                            <button
                                onClick={onClose}
                                className="w-full py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-colors"
                            >
                                Cerrar
                            </button>
                        </div>

                    </Motion.div>
                </Motion.div>
            )}
        </AnimatePresence>
    );
}

// Helpers
function getHeaderColor(category) {
    switch (category) {
        case 'Vídeo': return 'bg-gradient-to-r from-sky-500 to-blue-600';
        case 'Lectura': return 'bg-gradient-to-r from-emerald-500 to-teal-600';
        case 'Audio': return 'bg-gradient-to-r from-purple-500 to-indigo-600';
        default: return 'bg-slate-700';
    }
}

function getIcon(category) {
    switch (category) {
        case 'Vídeo': return <Play size={20} />;
        case 'Lectura': return <BookOpen size={20} />;
        case 'Audio': return <Headphones size={20} />;
        default: return <Sparkles size={20} />;
    }
}

function parseMarkdown(text) {
    if (!text) return "";
    let html = text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
        .replace(/# (.*?)\n/g, '<h1 class="text-xl font-bold text-slate-800 mb-2 mt-4">$1</h1>')
        .replace(/## (.*?)\n/g, '<h2 class="text-lg font-bold text-slate-700 mb-2 mt-4">$1</h2>')
        .replace(/- (.*?)\n/g, '<li class="ml-4 list-disc">$1</li>')
        .replace(/\n\n/g, '<br/><br/>'); // Line breaks
    return html;
}

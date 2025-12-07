import React, { useState } from 'react';
import { motion as Motion } from 'framer-motion';
import { BookOpen, X, Sparkles, Loader, Feather } from 'lucide-react';

export default function StoryWidget({ isOpen, onClose, onGenerateStory }) {
    const [theme, setTheme] = useState('');
    const [character, setCharacter] = useState('');
    const [story, setStory] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleGenerate = async () => {
        if (!theme.trim()) return;
        setLoading(true);
        const result = await onGenerateStory(theme, character || 'Tu bebé');
        setStory(result);
        setLoading(false);
    };

    const reset = () => {
        setStory(null);
        setTheme('');
    };

    if (!isOpen) return null;

    return (
        <Motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-indigo-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4"
        >
            <Motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="bg-[#fff9f0] w-full max-w-md rounded-3xl overflow-hidden shadow-2xl relative flex flex-col max-h-[85vh] border-4 border-amber-900/5"
            >
                {/* Book Header */}
                <div className="bg-amber-100 p-6 flex items-center justify-between text-amber-900 shrink-0 border-b border-amber-200">
                    <div className="flex items-center gap-3">
                        <BookOpen size={24} />
                        <h2 className="font-serif font-bold text-xl">Cuentacuentos</h2>
                    </div>
                    <button onClick={onClose} className="hover:bg-amber-200/50 p-2 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    {!story ? (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-amber-900/70 mb-2 uppercase tracking-wider">Protagonista</label>
                                <input
                                    value={character}
                                    onChange={(e) => setCharacter(e.target.value)}
                                    placeholder="Ej: Un osito valiente, Mi bebé Leo..."
                                    className="w-full p-4 bg-white border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 text-amber-900 placeholder-amber-900/30"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-amber-900/70 mb-2 uppercase tracking-wider">¿Qué quieres enseñar?</label>
                                <input
                                    value={theme}
                                    onChange={(e) => setTheme(e.target.value)}
                                    placeholder="Ej: Dejar el chupete, Compartir, Dormir..."
                                    className="w-full p-4 bg-white border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 text-amber-900 placeholder-amber-900/30"
                                />
                            </div>

                            <button
                                onClick={handleGenerate}
                                disabled={!theme.trim() || loading}
                                className="w-full bg-amber-600 text-white font-serif font-bold py-4 rounded-xl shadow-lg shadow-amber-200 hover:bg-amber-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
                            >
                                {loading ? <><Loader className="animate-spin" /> Escribiendo...</> : <><Feather size={18} /> Crear Cuento</>}
                            </button>
                        </div>
                    ) : (
                        <Motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            <div className="prose prose-amber prose-p:font-serif prose-p:text-lg prose-p:leading-relaxed text-amber-900 mb-8">
                                <div dangerouslySetInnerHTML={{ __html: parseStory(story) }} />
                            </div>

                            <button
                                onClick={reset}
                                className="w-full py-3 text-amber-400 font-bold hover:text-amber-700 transition-colors uppercase tracking-widest text-xs"
                            >
                                Escribir otro
                            </button>
                        </Motion.div>
                    )}
                </div>
            </Motion.div>
        </Motion.div>
    );
}

function parseStory(text) {
    if (!text) return "";
    return text.replace(/\n\n/g, '<br/><br/>');
}

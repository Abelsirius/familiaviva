import React, { useState } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { Wand2, X, Sparkles, Loader, BookHeart } from 'lucide-react';

export default function MagicMemoryModal({ isOpen, onClose, onMagicify }) {
    const [input, setInput] = useState('');
    const [magicOutput, setMagicOutput] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleMagic = async () => {
        if (!input.trim()) return;
        setIsProcessing(true);
        const story = await onMagicify(input);
        setMagicOutput(story);
        setIsProcessing(false);
    };

    const reset = () => {
        setMagicOutput(null);
        setInput('');
    }

    if (!isOpen) return null;

    return (
        <Motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-fuchsia-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
        >
            <Motion.div
                initial={{ scale: 0.9, rotate: -2 }}
                animate={{ scale: 1, rotate: 0 }}
                className="bg-white w-full max-w-md rounded-3xl p-0 overflow-hidden relative shadow-2xl"
            >
                {/* Gradient Border/Header */}
                <div className="bg-gradient-to-r from-fuchsia-500 via-purple-500 to-indigo-500 p-1">
                    <div className="bg-white rounded-t-[20px] p-6 pb-2">
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-2 text-fuchsia-600">
                                <div className="bg-fuchsia-100 p-2 rounded-lg">
                                    <Wand2 size={24} />
                                </div>
                                <h2 className="font-bold text-xl">Diario Mágico</h2>
                            </div>
                            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                                <X size={24} />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="p-6 pt-2">
                    {!magicOutput ? (
                        <div className="space-y-4">
                            <p className="text-slate-500 text-sm">
                                Escribe un momento sencillo de hoy (ej. "Se rió con el perro"). La IA lo convertirá en un recuerdo eterno.
                            </p>
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Hoy mi bebé..."
                                className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-fuchsia-200 resize-none text-slate-700"
                            />
                            <button
                                onClick={handleMagic}
                                disabled={!input.trim() || isProcessing}
                                className="w-full bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-fuchsia-200 hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isProcessing ? <Loader className="animate-spin" /> : <><Sparkles size={18} /> Crear Magia</>}
                            </button>
                        </div>
                    ) : (
                        <Motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center"
                        >
                            <div className="bg-orange-50 p-6 rounded-xl border border-orange-100 mb-6 relative">
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white text-orange-400 px-3 py-1 rounded-full border border-orange-100 shadow-sm">
                                    <BookHeart size={16} />
                                </div>
                                <p className="font-serif italic text-slate-700 leading-relaxed text-lg">
                                    "{magicOutput}"
                                </p>
                            </div>
                            <button
                                onClick={reset}
                                className="text-sm font-bold text-slate-400 hover:text-fuchsia-600 transition-colors"
                            >
                                Capturar otro momento
                            </button>
                        </Motion.div>
                    )}
                </div>
            </Motion.div>
        </Motion.div>
    );
}

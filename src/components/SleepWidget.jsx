import React, { useState } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { Moon, Clock, Sun, X, Loader, Sparkles } from 'lucide-react';

export default function SleepWidget({ isOpen, onClose, onGetSleepTip }) {
    const [wakeTime, setWakeTime] = useState('');
    const [prediction, setPrediction] = useState(null);
    const [loading, setLoading] = useState(false);
    const [sleepTip, setSleepTip] = useState(null);

    const calculateNap = async () => {
        if (!wakeTime) return;

        // Simple logic: 8 months old -> ~2.5 to 3 hour wake window
        const [hours, minutes] = wakeTime.split(':').map(Number);
        const date = new Date();
        date.setHours(hours, minutes, 0);

        // Add 2.5 hours
        const startNap = new Date(date.getTime() + 2.5 * 60 * 60 * 1000);
        // Add 3 hours
        const endNap = new Date(date.getTime() + 3 * 60 * 60 * 1000);

        const formatTime = (d) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        setPrediction({
            start: formatTime(startNap),
            end: formatTime(endNap)
        });

        setLoading(true);
        const tip = await onGetSleepTip();
        setSleepTip(tip);
        setLoading(false);
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
                className="bg-indigo-900 w-full max-w-sm rounded-3xl p-8 text-white relative border border-indigo-700 shadow-2xl overflow-hidden"
            >
                <div className="absolute top-0 right-0 p-4 opacity-20">
                    <Moon size={120} />
                </div>

                <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors z-10">
                    <X size={20} />
                </button>

                <h2 className="text-2xl font-bold mb-1 flex items-center gap-2">
                    <Moon className="text-indigo-300" /> Gurú del Sueño
                </h2>
                <p className="text-indigo-200 text-sm mb-6">Calculadora de Ventanas de Sueño (8m)</p>

                {!prediction ? (
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-indigo-300 mb-2">¿A qué hora despertó?</label>
                            <input
                                type="time"
                                value={wakeTime}
                                onChange={(e) => setWakeTime(e.target.value)}
                                className="w-full bg-indigo-800 border border-indigo-600 rounded-xl p-4 text-2xl font-bold text-center focus:outline-none focus:ring-2 focus:ring-indigo-400 text-white placeholder-indigo-400/50"
                            />
                        </div>

                        <button
                            onClick={calculateNap}
                            disabled={!wakeTime}
                            className="w-full bg-indigo-400 text-indigo-950 font-bold py-4 rounded-xl hover:bg-indigo-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-900/50"
                        >
                            Calcular Próxima Siesta
                        </button>
                    </div>
                ) : (
                    <Motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-6"
                    >
                        <div className="bg-white/10 rounded-2xl p-6 text-center border border-indigo-500/30">
                            <p className="text-indigo-300 text-xs font-bold uppercase tracking-wider mb-2">Ventana Ideal de Sueño</p>
                            <div className="flex items-end justify-center gap-2">
                                <span className="text-4xl font-bold text-white">{prediction.start}</span>
                                <span className="text-xl text-indigo-400 mb-1">- {prediction.end}</span>
                            </div>
                            <p className="text-xs text-indigo-300 mt-2">Busca señales de sueño 15min antes.</p>
                        </div>

                        <div className="bg-indigo-950/50 p-4 rounded-xl border border-indigo-800">
                            <h4 className="flex items-center gap-2 font-bold text-sm text-indigo-300 mb-2">
                                <Sparkles size={14} /> Tip Inteligente
                            </h4>
                            {loading ? (
                                <div className="flex items-center gap-2 text-indigo-400 text-xs animate-pulse">
                                    <Loader size={14} className="animate-spin" />
                                    Generando rutina...
                                </div>
                            ) : (
                                <p className="text-sm text-indigo-100 leading-relaxed font-light">
                                    {sleepTip}
                                </p>
                            )}
                        </div>

                        <button
                            onClick={() => { setPrediction(null); setWakeTime(''); }}
                            className="w-full py-3 text-indigo-400 font-bold text-sm hover:text-white transition-colors"
                        >
                            Calcular otra vez
                        </button>
                    </Motion.div>
                )}
            </Motion.div>
        </Motion.div>
    );
}

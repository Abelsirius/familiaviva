import React, { useState, useEffect } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { Wind, X } from 'lucide-react';

export default function BreathingWidget({ onClose }) {
    const [phase, setPhase] = useState('Inhala'); // Inhala, Mantén, Exhala


    useEffect(() => {
        let interval;
        // Secuencia 4-7-8
        const runCycle = async () => {
            setPhase('Inhala');
            await new Promise(r => setTimeout(r, 4000));

            setPhase('Mantén');
            await new Promise(r => setTimeout(r, 7000));

            setPhase('Exhala');
            await new Promise(r => setTimeout(r, 8000));

            runCycle(); // Repetir
        };

        runCycle();

        return () => clearInterval(interval); // Limpieza básica, el promise loop seguirá una vez más but it's ok for effective unmount
    }, []);

    return (
        <Motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/80 dark:bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-6 flex-col"
        >
            <button onClick={onClose} className="absolute top-6 right-6 text-white/50 hover:text-white">
                <X size={32} />
            </button>

            <h2 className="text-white text-3xl font-bold mb-12 tracking-wider">{phase}</h2>

            <div className="relative flex items-center justify-center">
                {/* Círculo Guía */}
                <Motion.div
                    animate={{
                        scale: phase === 'Inhala' ? 2.5 : phase === 'Mantén' ? 2.5 : 1,
                        opacity: phase === 'Mantén' ? 0.8 : 1
                    }}
                    transition={{
                        duration: phase === 'Inhala' ? 4 : phase === 'Mantén' ? 0 : 8,
                        ease: "easeInOut"
                    }}
                    className={`w-32 h-32 rounded-full blur-xl absolute ${phase === 'Inhala' ? 'bg-sky-400' : phase === 'Exhala' ? 'bg-indigo-500' : 'bg-purple-400'
                        }`}
                />
                <Motion.div
                    animate={{
                        scale: phase === 'Inhala' ? 2 : phase === 'Mantén' ? 2 : 1,
                    }}
                    transition={{
                        duration: phase === 'Inhala' ? 4 : phase === 'Mantén' ? 0 : 8,
                        ease: "easeInOut"
                    }}
                    className="w-32 h-32 bg-white rounded-full flex items-center justify-center relative z-10 shadow-2xl"
                >
                    <Wind className={`text-indigo-600 ${phase === 'Mantén' ? 'animate-pulse' : ''}`} size={40} />
                </Motion.div>
            </div>

            <p className="text-white/60 mt-16 font-medium text-lg">Técnica 4-7-8 para calmar la ansiedad</p>
        </Motion.div>
    );
}

import React from 'react';
import { motion as Motion } from 'framer-motion';

export default function LoadingScreen() {
    return (
        <Motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 dark:from-indigo-900 dark:via-purple-900 dark:to-pink-900 flex flex-col items-center justify-center z-50"
        >
            {/* Logo con animación de pulso */}
            <Motion.div
                animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.8, 1, 0.8]
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                className="mb-8"
            >
                <img
                    src="/logo.png"
                    alt="Familia Viva"
                    className="w-32 h-32 drop-shadow-2xl"
                />
            </Motion.div>

            {/* Texto con animación */}
            <Motion.h1
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-4xl font-bold text-white mb-2 tracking-tight"
            >
                Familia Viva
            </Motion.h1>

            <Motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-white/80 text-lg font-medium mb-12"
            >
                Tu acompañante en la crianza
            </Motion.p>

            {/* Spinner de carga */}
            <Motion.div
                animate={{ rotate: 360 }}
                transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "linear"
                }}
                className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full"
            />

            {/* Puntos animados */}
            <div className="flex gap-2 mt-8">
                {[0, 1, 2].map((i) => (
                    <Motion.div
                        key={i}
                        animate={{
                            y: [0, -10, 0],
                            opacity: [0.5, 1, 0.5]
                        }}
                        transition={{
                            duration: 1,
                            repeat: Infinity,
                            delay: i * 0.2,
                            ease: "easeInOut"
                        }}
                        className="w-3 h-3 bg-white rounded-full"
                    />
                ))}
            </div>
        </Motion.div>
    );
}

import React from 'react';
import { Heart, LogOut } from 'lucide-react';
import { motion as Motion } from 'framer-motion';

export default function Navbar({ handleLogout, userId }) {
    return (
        <Motion.header
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md p-4 shadow-sm flex justify-between items-center z-20 sticky top-0 transition-colors"
        >
            <div className="flex items-center gap-2">
                <Motion.div
                    whileHover={{ scale: 1.1, rotate: 10 }}
                    whileTap={{ scale: 0.9 }}
                    className="w-8 h-8 bg-gradient-to-tr from-sky-400 to-indigo-500 rounded-full flex items-center justify-center text-white shadow-md"
                >
                    <Heart size={18} fill="currentColor" />
                </Motion.div>
                <span className="font-bold text-lg bg-clip-text text-transparent bg-gradient-to-r from-sky-600 to-indigo-600 dark:from-sky-400 dark:to-indigo-400 tracking-tight">
                    Familia Viva
                </span>
            </div>

            <Motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLogout}
                className="bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 p-2 rounded-full flex items-center gap-1 text-xs font-medium transition-colors border border-red-100 dark:border-red-800"
                title={`Usuario ID: ${userId} | Click para Cerrar Sesión`}
            >
                <LogOut size={16} />
            </Motion.button>
        </Motion.header>
    );
}

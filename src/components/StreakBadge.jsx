import React from 'react';
import { motion as Motion } from 'framer-motion';
import { Flame } from 'lucide-react';

export default function StreakBadge({ streak, onClick }) {
    if (streak === 0) return null;

    return (
        <Motion.button
            onClick={onClick}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="fixed top-20 right-4 bg-gradient-to-br from-orange-500 to-red-600 text-white rounded-full shadow-lg px-4 py-2 flex items-center gap-2 z-30 font-bold"
        >
            <Flame size={20} className="animate-pulse" />
            <span>{streak} días</span>
        </Motion.button>
    );
}

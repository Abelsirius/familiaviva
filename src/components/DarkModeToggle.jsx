import React, { useState, useEffect } from 'react';
import { motion as Motion } from 'framer-motion';
import { Moon, Sun } from 'lucide-react';

export default function DarkModeToggle() {
    const [isDark, setIsDark] = useState(() => {
        const saved = localStorage.getItem('darkMode');
        return saved === 'true';
    });

    // Sync with DOM on mount
    useEffect(() => {
        if (isDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDark]);

    const toggleDarkMode = () => {
        const newValue = !isDark;
        setIsDark(newValue);
        localStorage.setItem('darkMode', newValue.toString());
    };

    return (
        <Motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleDarkMode}
            className="fixed top-20 left-4 w-12 h-12 bg-white dark:bg-slate-800 rounded-full shadow-lg flex items-center justify-center z-30 transition-colors"
            title={isDark ? 'Modo Claro' : 'Modo Oscuro'}
        >
            {isDark ? (
                <Sun size={20} className="text-amber-500" />
            ) : (
                <Moon size={20} className="text-indigo-600" />
            )}
        </Motion.button>
    );
}

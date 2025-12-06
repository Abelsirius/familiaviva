import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Calendar, BookOpen } from 'lucide-react';

export default function TabNavigation({ activeTab, setActiveTab }) {
    return (
        <nav className="bg-white/90 backdrop-blur-lg border-t border-slate-100 p-2 pb-6 fixed bottom-0 w-full z-20 shadow-[0_-5px_20px_-10px_rgba(0,0,0,0.05)]">
            <div className="flex justify-around items-center max-w-md mx-auto">
                <TabButton
                    active={activeTab === 'home'}
                    onClick={() => setActiveTab('home')}
                    icon={<Heart size={24} />}
                    label="Hoy"
                />
                <TabButton
                    active={activeTab === 'timeline'}
                    onClick={() => setActiveTab('timeline')}
                    icon={<Calendar size={24} />}
                    label="Etapas"
                />
                <TabButton
                    active={activeTab === 'resources'}
                    onClick={() => setActiveTab('resources')}
                    icon={<BookOpen size={24} />}
                    label="Biblioteca"
                />
            </div>
        </nav>
    );
}

function TabButton({ active, onClick, icon, label }) {
    return (
        <button
            onClick={onClick}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all w-20 relative group`}
        >
            <motion.div
                animate={active ? { y: -5 } : { y: 0 }}
                className={`${active ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`}
            >
                {icon}
            </motion.div>

            <span className={`text-[10px] font-bold transition-colors ${active ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`}>
                {label}
            </span>

            {active && (
                <motion.div
                    layoutId="tab-indicator"
                    className="absolute -bottom-2 w-1 mx-auto h-1 rounded-full bg-indigo-600"
                />
            )}
        </button>
    );
}

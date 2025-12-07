import React from 'react';
import { motion as Motion } from 'framer-motion';
import { Home, Wrench, Activity, BookOpen } from 'lucide-react';

export default function TabNavigation({ activeTab, setActiveTab }) {
    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 p-2 pb-6 z-40">
            <div className="flex justify-around items-center max-w-md mx-auto">
                <TabButton
                    active={activeTab === 'home'}
                    onClick={() => setActiveTab('home')}
                    icon={<Home size={24} />}
                    label="Inicio"
                />
                <TabButton
                    active={activeTab === 'tools'}
                    onClick={() => setActiveTab('tools')}
                    icon={<Wrench size={24} />}
                    label="Herramientas"
                />
                <TabButton
                    active={activeTab === 'timeline'}
                    onClick={() => setActiveTab('timeline')}
                    icon={<Activity size={24} />}
                    label="Línea"
                />
                <TabButton
                    active={activeTab === 'resources'}
                    onClick={() => setActiveTab('resources')}
                    icon={<BookOpen size={24} />}
                    label="Recursos"
                />
            </div>
        </div>
    );
}

function TabButton({ active, onClick, icon, label }) {
    return (
        <button
            onClick={onClick}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all w-20 relative group`}
        >
            <Motion.div
                animate={active ? { y: -5 } : { y: 0 }}
                className={`${active ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`}
            >
                {icon}
            </Motion.div>

            <span className={`text-[10px] font-bold transition-colors ${active ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`}>
                {label}
            </span>

            {active && (
                <Motion.div
                    layoutId="tab-indicator"
                    className="absolute -bottom-2 w-1 mx-auto h-1 rounded-full bg-indigo-600"
                />
            )}
        </button>
    );
}

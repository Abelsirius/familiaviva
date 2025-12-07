import React from 'react';
import { motion as Motion } from 'framer-motion';
import { Wind, Activity, Moon, Wand2, ChefHat, BookOpen, Wrench, Sparkles } from 'lucide-react';

export default function Tools({ handleToolOpen }) {
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.05 }
        }
    };

    const itemVariants = {
        hidden: { scale: 0.9, opacity: 0 },
        visible: { scale: 1, opacity: 1 }
    };

    const tools = [
        { id: 'cry_decoder', label: 'Decodificador', sub: 'Análisis de llanto', icon: <Activity size={28} />, color: 'bg-rose-50 text-rose-600 border-rose-100' },
        { id: 'sleep_guru', label: 'Gurú del Sueño', sub: 'Ventanas de sueño', icon: <Moon size={28} />, color: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
        { id: 'chef', label: 'Chef Bebé', sub: 'Recetas IA', icon: <ChefHat size={28} />, color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
        { id: 'storyteller', label: 'Cuentacuentos', sub: 'Historias mágicas', icon: <BookOpen size={28} />, color: 'bg-amber-50 text-amber-600 border-amber-100' },
        { id: 'breathing', label: 'Respiración', sub: 'Calma 4-7-8', icon: <Wind size={28} />, color: 'bg-sky-50 text-sky-600 border-sky-100' },
        { id: 'magic_journal', label: 'Diario Mágico', sub: 'Recuerdos eternos', icon: <Wand2 size={28} />, color: 'bg-fuchsia-50 text-fuchsia-600 border-fuchsia-100' },
    ];

    return (
        <Motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6 pb-24"
        >
            <Motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="mb-6">
                <h2 className="text-2xl font-bold text-slate-800">Caja de Herramientas <Wrench className="inline text-slate-400 mb-1 ml-1" size={20} /></h2>
                <p className="text-slate-500">Utilidades inteligentes para el día a día</p>
            </Motion.div>

            <div className="grid grid-cols-2 gap-4">
                {tools.map(tool => (
                    <Motion.button
                        key={tool.id}
                        variants={itemVariants}
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleToolOpen(tool.id)}
                        className={`p-5 rounded-3xl flex flex-col items-start gap-3 border shadow-sm transition-all text-left ${tool.color} h-full`}
                    >
                        <div className="bg-white/60 p-3 rounded-2xl backdrop-blur-sm">
                            {tool.icon}
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800 text-lg leading-tight">{tool.label}</h3>
                            <p className="text-xs font-medium opacity-80 mt-1">{tool.sub}</p>
                        </div>
                        <Sparkles size={16} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-current" />
                    </Motion.button>
                ))}
            </div>
        </Motion.div>
    );
}

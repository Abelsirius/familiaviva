import React from 'react';
import { motion as Motion } from 'framer-motion';
import { Play, Book, Headphones, Users } from 'lucide-react';

export default function Resources() {
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { scale: 0.9, opacity: 0 },
        visible: { scale: 1, opacity: 1 }
    };

    return (
        <Motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6 pb-24"
        >
            <Motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="mb-6">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Biblioteca de Apoyo</h2>
                <p className="text-slate-500 dark:text-slate-400">Recursos curados para tu bienestar</p>
            </Motion.div>

            <div className="grid gap-4">
                <ResourceCard
                    category="Vídeo"
                    title="Calmando el llanto"
                    desc="Técnicas de contención física y arrullo para momentos de crisis."
                    tag="Práctico"
                    icon={<Play size={20} />}
                    color="bg-sky-100 text-sky-600"
                />
                <ResourceCard
                    category="Lectura"
                    title="¿Qué es el Apego Seguro?"
                    desc="Entiende la ciencia detrás del vínculo con tu bebé."
                    tag="Teoría"
                    icon={<Book size={20} />}
                    color="bg-emerald-100 text-emerald-600"
                />
                <ResourceCard
                    category="Audio"
                    title="Meditación para Padres"
                    desc="5 minutos de respiración para recuperar tu centro."
                    tag="Autocuidado"
                    icon={<Headphones size={20} />}
                    color="bg-purple-100 text-purple-600"
                />
            </div>

            <Motion.div
                variants={itemVariants}
                className="bg-gradient-to-r from-indigo-500 to-indigo-700 dark:from-indigo-600 dark:to-indigo-800 p-6 rounded-3xl mt-6 text-white text-center shadow-lg relative overflow-hidden"
            >
                <div className="absolute top-0 left-0 w-full h-full bg-white opacity-5 pattern-dots"></div>
                <Users className="mx-auto mb-3 opacity-80" size={32} />
                <h3 className="font-bold text-lg mb-2">¿Necesitas ayuda experta?</h3>
                <p className="text-sm opacity-90 mb-4 px-4">Agenda una sesión híbrida con nuestros psicólogos perinatales.</p>
                <Motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-white text-indigo-600 dark:text-indigo-700 text-sm py-3 px-6 rounded-xl font-bold shadow-md hover:bg-slate-50 dark:hover:bg-slate-100 transition-colors"
                >
                    Contactar Especialista
                </Motion.button>
            </Motion.div>
        </Motion.div>
    );
}

function ResourceCard({ category, title, desc, tag, icon, color }) {
    return (
        <Motion.div
            variants={{
                hidden: { y: 20, opacity: 0 },
                visible: { y: 0, opacity: 1 }
            }}
            whileHover={{ y: -3, shadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }}
            className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex gap-4 transition-shadow cursor-pointer group"
        >
            <div className={`w-12 h-12 rounded-xl ${color} dark:opacity-90 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                {icon}
            </div>
            <div className="flex-1">
                <div className="flex justify-between items-start mb-1">
                    <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{category}</span>
                    <span className="text-[10px] font-semibold bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full">{tag}</span>
                </div>
                <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{title}</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-snug">{desc}</p>
            </div>
        </Motion.div>
    )
}

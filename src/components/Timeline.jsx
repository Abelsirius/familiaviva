import React from 'react';
import { motion as Motion } from 'framer-motion';
import { Clock, Baby, Smile, AlertCircle, CheckCircle, Loader } from 'lucide-react';

export default function Timeline({
    babyAge,
    weeklyMilestone,
    isMilestoneLoading,
    generateWeeklyMilestone
}) {
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
    };

    const itemVariants = {
        hidden: { x: -30, opacity: 0 },
        visible: { x: 0, opacity: 1 }
    };

    return (
        <Motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6 pb-24"
        >
            <Motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-sky-50 dark:bg-sky-900/30 p-6 rounded-3xl border border-sky-100 dark:border-sky-800 mb-4 shadow-sm"
            >
                <h2 className="text-xl font-bold text-sky-900 dark:text-sky-100">Tu Acompañante 0-24</h2>
                <p className="text-sm text-sky-700 dark:text-sky-300 mt-1">Guía basada en la Teoría del Apego</p>
            </Motion.div>

            {/* Hito Semanal Personalizado */}
            <Motion.div
                variants={itemVariants}
                className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-md border border-sky-100 dark:border-slate-700 relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 w-24 h-24 bg-sky-100 dark:bg-sky-900/30 rounded-bl-full opacity-50 z-0"></div>
                <div className="relative z-10">
                    <h3 className="font-bold text-sky-800 dark:text-sky-200 mb-4 flex items-center gap-2 text-lg">
                        <Clock size={24} className="text-sky-500 dark:text-sky-400" />
                        <span>Hito Personalizado</span>
                        <span className="text-xs font-normal bg-sky-100 dark:bg-sky-900/50 text-sky-600 dark:text-sky-300 px-2 py-1 rounded-full">{babyAge}</span>
                    </h3>

                    {weeklyMilestone ? (
                        <Motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line bg-sky-50/80 dark:bg-sky-900/20 p-4 rounded-2xl border-l-4 border-sky-400 dark:border-sky-500 italic"
                        >
                            {weeklyMilestone}
                        </Motion.div>
                    ) : isMilestoneLoading ? (
                        <div className="flex flex-col items-center justify-center py-6 text-sky-500 dark:text-sky-400 gap-2">
                            <Loader size={24} className="animate-spin" />
                            <span className="text-sm">Consultando al especialista...</span>
                        </div>
                    ) : (
                        <Motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={generateWeeklyMilestone}
                            className="w-full bg-sky-500 dark:bg-sky-600 text-white text-sm py-4 rounded-2xl font-semibold hover:bg-sky-600 dark:hover:bg-sky-700 transition-colors shadow-lg shadow-sky-200 dark:shadow-sky-900/50"
                        >
                            Generar Hito Semanal ✨
                        </Motion.button>
                    )}
                </div>
            </Motion.div>

            {/* Hitos de Desarrollo Visuales */}
            <Motion.div variants={itemVariants} className="flex justify-center p-2 rounded-2xl overflow-hidden shadow-sm">
                <img src="https://placehold.co/600x200/e0f2fe/0284c7?text=Hitos+del+Desarrollo+0-24m" alt="Hitos" className="rounded-xl w-full object-cover" />
            </Motion.div>

            <div className="space-y-4 pt-2">
                <TimelineItem
                    age="0 - 3 Meses"
                    title="El Cuarto Trimestre"
                    desc="Tu bebé necesita contacto piel con piel. No se le puede 'malcriar' por cargarlo mucho en esta etapa."
                    color="bg-purple-100 text-purple-700 border-purple-200"
                    icon={<Baby size={20} />}
                    delay={0.1}
                />
                <TimelineItem
                    age="3 - 6 Meses"
                    title="El Despertar Social"
                    desc="Comienzan las sonrisas sociales. Responde a sus balbuceos para crear el patrón 'servir y devolver'."
                    color="bg-pink-100 text-pink-700 border-pink-200"
                    icon={<Smile size={20} />}
                    delay={0.2}
                />
                <TimelineItem
                    age="6 - 12 Meses"
                    title="Ansiedad de Separación"
                    desc="Es normal que llore si te vas. Juega a '¿Dónde está el bebé?' para enseñarle que siempre regresas."
                    color="bg-orange-100 text-orange-700 border-orange-200"
                    icon={<AlertCircle size={20} />}
                    delay={0.3}
                />
                <TimelineItem
                    age="12 - 24 Meses"
                    title="Exploración y Límites"
                    desc="Empieza la autonomía. Necesita una base segura para explorar y regresar a ti para 'recargar' seguridad."
                    color="bg-teal-100 text-teal-700 border-teal-200"
                    icon={<CheckCircle size={20} />}
                    delay={0.4}
                />
            </div>
        </Motion.div>
    );
}

function TimelineItem({ age, title, desc, color, icon, delay }) {
    return (
        <Motion.div
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay }}
            className={`p-5 rounded-2xl border ${color.replace('bg-', 'bg-opacity-40 bg-')} dark:bg-slate-700 dark:border-slate-600 flex gap-4 shadow-sm hover:shadow-md transition-shadow`}
        >
            <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center ${color} bg-white dark:bg-slate-800`}>
                {icon}
            </div>
            <div>
                <span className="text-xs font-bold uppercase opacity-70 dark:opacity-90 dark:text-slate-300 tracking-wide block mb-1">{age}</span>
                <h4 className="font-bold text-lg mb-1 dark:text-white">{title}</h4>
                <p className="text-sm opacity-90 dark:opacity-95 dark:text-slate-200 leading-relaxed">{desc}</p>
            </div>
        </Motion.div>
    );
}

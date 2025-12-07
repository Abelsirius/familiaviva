import React from 'react';
import { motion as Motion } from 'framer-motion';
import { Smile, Meh, Frown, Loader, Info, ClipboardList } from 'lucide-react';

export default function Dashboard({
    displayUserName,
    isAnonymousUser,
    userId,
    weeklyInsight,
    isInsightLoading,
    generateEmotionalInsight,
    moodHistory,
    currentMood,
    handleMoodSelect
}) {
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    return (
        <Motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6 pb-24"
        >
            {/* Saludo */}
            <Motion.div variants={itemVariants} className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <HeartPattern />
                </div>
                <h2 className="text-3xl font-bold mb-2">Hola, {displayUserName}</h2>
                <p className="opacity-90 text-base font-medium">¿Cómo te sientes hoy?</p>
            </Motion.div>

            {/* TARJETA DE AVISO (Si es Anónimo) */}
            {isAnonymousUser && (
                <Motion.div variants={itemVariants} className="bg-amber-50 rounded-2xl p-4 shadow-sm border border-amber-100 text-amber-800 flex items-start gap-3">
                    <Info size={20} className="text-amber-600 mt-0.5" />
                    <div>
                        <h3 className="font-semibold text-sm">Modo Invitado</h3>
                        <p className="text-xs mt-1">
                            Tu ID temporal es {userId.substring(0, 8)}... Los datos no se sincronizarán entre dispositivos.
                        </p>
                    </div>
                </Motion.div>
            )}

            {/* Semáforo Emocional INTERACTIVO */}
            <Motion.div variants={itemVariants} className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-sm rounded-3xl p-6 shadow-sm border border-white/50 dark:border-slate-700/50">
                <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-6 text-center text-lg">Tu Clima Emocional</h3>

                <div className="flex justify-between gap-4">
                    <MoodButton
                        mood="verde"
                        icon={<Smile size={32} />}
                        label="Calma"
                        colorClass="bg-green-500"
                        lightClass="bg-green-50"
                        isActive={currentMood === 'verde'}
                        onClick={() => handleMoodSelect('verde', 'green', 'Calma')}
                    />
                    <MoodButton
                        mood="ambar"
                        icon={<Meh size={32} />}
                        label="Estrés"
                        colorClass="bg-amber-400"
                        lightClass="bg-amber-50"
                        isActive={currentMood === 'ambar'}
                        onClick={() => handleMoodSelect('ambar', 'yellow', 'Estrés')}
                    />
                    <MoodButton
                        mood="rojo"
                        icon={<Frown size={32} />}
                        label="SOS"
                        colorClass="bg-red-500"
                        lightClass="bg-red-50"
                        isActive={currentMood === 'rojo'}
                        onClick={() => handleMoodSelect('rojo', 'red', 'Sobrepasado')}
                    />
                </div>
            </Motion.div>

            {/* Informe de Bienestar Semanal */}
            <Motion.div variants={itemVariants} className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">

                {/* TRIBE MODE PULSE */}
                <div className="flex items-center gap-2 mb-6 bg-indigo-50 dark:bg-indigo-900/30 p-3 rounded-xl border border-indigo-100 dark:border-indigo-800">
                    <div className="relative">
                        <div className="w-2 h-2 bg-indigo-500 dark:bg-indigo-400 rounded-full animate-ping absolute inset-0"></div>
                        <div className="w-2 h-2 bg-indigo-500 dark:bg-indigo-400 rounded-full relative z-10"></div>
                    </div>
                    <p className="text-xs font-medium text-indigo-800 dark:text-indigo-200 flex-1">
                        Asistente de Bienestar
                    </p>
                </div>

                {weeklyInsight ? (
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                        {weeklyInsight}
                    </div>
                ) : isInsightLoading ? (
                    <div className="flex flex-col items-center justify-center py-8 text-indigo-400 dark:text-indigo-300 gap-3">
                        <Loader size={24} className="animate-spin" />
                        <span className="text-sm font-medium animate-pulse">La IA está analizando tus datos...</span>
                    </div>
                ) : (
                    <Motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={generateEmotionalInsight}
                        disabled={moodHistory.length === 0}
                        className="w-full bg-slate-900 dark:bg-indigo-600 text-white text-sm py-4 rounded-2xl font-semibold hover:bg-slate-800 dark:hover:bg-indigo-700 transition-colors disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed shadow-lg shadow-slate-200 dark:shadow-slate-900"
                    >
                        {moodHistory.length === 0 ? "Registra tu ánimo para ver el informe" : "Generar Análisis con IA ✨"}
                    </Motion.button>
                )}
            </Motion.div>

            {/* Historial Reciente */}
            {moodHistory.length > 0 && (
                <Motion.div variants={itemVariants} className="space-y-3 px-2">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-2">
                        <ClipboardList size={14} />
                        Últimos Registros
                    </h3>
                    {moodHistory.slice(0, 5).map((log, index) => (
                        <Motion.div
                            key={log.id}
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: index * 0.05 }}
                            className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm"
                        >
                            <div className={`w-3 h-3 rounded-full ${log.mood === 'verde' ? 'bg-green-500' : log.mood === 'ambar' ? 'bg-amber-400' : 'bg-red-500'}`}></div>
                            <div>
                                <p className="text-sm font-semibold capitalize text-slate-700">{log.note}</p>
                                <p className="text-xs text-slate-400 font-medium">
                                    {log.timestamp ? log.timestamp.toDate().toLocaleDateString() : 'Hoy'}
                                </p>
                            </div>
                        </Motion.div>
                    ))}
                </Motion.div>
            )}
        </Motion.div>
    );
}

function MoodButton({ mood, icon, label, colorClass, lightClass, isActive, onClick }) {
    return (
        <Motion.button
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
            className={`flex-1 flex flex-col items-center gap-3 p-4 rounded-2xl transition-all duration-300 relative
                ${isActive ? `${lightClass} dark:bg-slate-700/50 ring-2 ring-offset-2 dark:ring-offset-slate-900 ring-${mood === 'verde' ? 'green' : mood === 'ambar' ? 'amber' : 'red'}-400 shadow-md` : 'hover:bg-slate-50 dark:hover:bg-slate-700/30'}
            `}
        >
            <div className={`w-14 h-14 rounded-full ${colorClass} flex items-center justify-center text-white shadow-lg shadow-${mood === 'verde' ? 'green' : mood === 'ambar' ? 'amber' : 'red'}-200 dark:shadow-none`}>
                {icon}
            </div>
            <span className={`text-xs font-bold ${isActive ? 'text-slate-800 dark:text-slate-200' : 'text-slate-500 dark:text-slate-400'}`}>{label}</span>

            {isActive && (
                <Motion.div
                    layoutId="active-dot"
                    className={`absolute -top-1 -right-1 w-4 h-4 rounded-full ${colorClass} border-2 border-white dark:border-slate-800`}
                />
            )}
        </Motion.button>
    );
}



function HeartPattern() {
    return (
        <svg width="100" height="100" viewBox="0 0 100 100" fill="currentColor">
            <path d="M50 80L10 40C-10 20 20 -10 50 20C80 -10 110 20 90 40L50 80Z" />
        </svg>
    )
}

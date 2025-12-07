import React from 'react';
import { motion as Motion } from 'framer-motion';
import { TrendingUp, Clock, AlertCircle, Sparkles, X } from 'lucide-react';

export default function InsightsCard({
    isOpen,
    onClose,
    patterns
}) {
    if (!isOpen || !patterns) return null;

    const { insights, stressHours, calmHours, moodCounts } = patterns;

    return (
        <Motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
            <Motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="bg-white rounded-3xl w-full max-w-md max-h-[85vh] overflow-hidden shadow-2xl flex flex-col"
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white shrink-0">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 p-2 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>

                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                            <TrendingUp size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">Tus Patrones</h2>
                            <p className="text-indigo-100 text-sm">Insights personalizados</p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {/* Mood Distribution */}
                    {moodCounts && (
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                            <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
                                <Sparkles size={16} />
                                Distribución de Ánimo
                            </h3>
                            <div className="space-y-2">
                                <MoodBar label="Calma" color="bg-green-500" count={moodCounts.verde || 0} total={Object.values(moodCounts).reduce((a, b) => a + b, 0)} />
                                <MoodBar label="Estrés" color="bg-amber-400" count={moodCounts.ambar || 0} total={Object.values(moodCounts).reduce((a, b) => a + b, 0)} />
                                <MoodBar label="SOS" color="bg-red-500" count={moodCounts.rojo || 0} total={Object.values(moodCounts).reduce((a, b) => a + b, 0)} />
                            </div>
                        </div>
                    )}

                    {/* Time Patterns */}
                    {(stressHours.length > 0 || calmHours.length > 0) && (
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                            <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
                                <Clock size={16} />
                                Patrones Horarios
                            </h3>
                            {stressHours.length > 0 && (
                                <div className="mb-2">
                                    <p className="text-sm text-slate-600">
                                        <span className="font-semibold text-amber-600">Horas de estrés:</span>{' '}
                                        {stressHours.map(h => `${h}:00`).join(', ')}
                                    </p>
                                </div>
                            )}
                            {calmHours.length > 0 && (
                                <div>
                                    <p className="text-sm text-slate-600">
                                        <span className="font-semibold text-green-600">Horas de calma:</span>{' '}
                                        {calmHours.map(h => `${h}:00`).join(', ')}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Insights */}
                    {insights && insights.length > 0 && (
                        <div className="space-y-3">
                            <h3 className="font-bold text-slate-700 flex items-center gap-2">
                                <AlertCircle size={16} />
                                Recomendaciones
                            </h3>
                            {insights.map((insight, index) => (
                                <Motion.div
                                    key={index}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className={`p-4 rounded-2xl border-2 ${insight.type === 'positive'
                                            ? 'bg-green-50 border-green-200'
                                            : insight.type === 'warning'
                                                ? 'bg-amber-50 border-amber-200'
                                                : 'bg-indigo-50 border-indigo-200'
                                        }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <span className="text-2xl">{insight.icon}</span>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-slate-800 mb-1">{insight.title}</h4>
                                            <p className="text-sm text-slate-600 leading-relaxed">{insight.description}</p>
                                        </div>
                                    </div>
                                </Motion.div>
                            ))}
                        </div>
                    )}

                    {insights.length === 0 && (
                        <div className="text-center py-8 text-slate-400">
                            <p className="text-sm">Registra más datos para ver patrones personalizados</p>
                        </div>
                    )}
                </div>
            </Motion.div>
        </Motion.div>
    );
}

function MoodBar({ label, color, count, total }) {
    const percentage = total > 0 ? (count / total) * 100 : 0;

    return (
        <div>
            <div className="flex justify-between text-xs text-slate-600 mb-1">
                <span className="font-medium">{label}</span>
                <span>{count} ({Math.round(percentage)}%)</span>
            </div>
            <div className="bg-slate-200 rounded-full h-2 overflow-hidden">
                <Motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className={`${color} h-full`}
                />
            </div>
        </div>
    );
}

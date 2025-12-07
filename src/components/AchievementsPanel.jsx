import React from 'react';
import { motion as Motion } from 'framer-motion';
import { Trophy, X, Lock } from 'lucide-react';
import { ACHIEVEMENTS, getAchievementProgress } from '../utils/achievementSystem';

export default function AchievementsPanel({
    isOpen,
    onClose,
    unlockedAchievements = [],
    userStats = {}
}) {
    if (!isOpen) return null;

    const achievementList = Object.values(ACHIEVEMENTS);
    const unlockedCount = unlockedAchievements.length;
    const totalCount = achievementList.length;

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
                <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-6 text-white shrink-0">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 p-2 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>

                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                            <Trophy size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">Logros</h2>
                            <p className="text-amber-100 text-sm">{unlockedCount} de {totalCount} desbloqueados</p>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="bg-white/20 rounded-full h-2 overflow-hidden">
                        <Motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(unlockedCount / totalCount) * 100}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="bg-white h-full"
                        />
                    </div>
                </div>

                {/* Achievement List */}
                <div className="flex-1 overflow-y-auto p-6 space-y-3">
                    {achievementList.map((achievement) => {
                        const isUnlocked = unlockedAchievements.includes(achievement.id);
                        const progress = getAchievementProgress(achievement.id, userStats);

                        return (
                            <Motion.div
                                key={achievement.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className={`p-4 rounded-2xl border-2 transition-all ${isUnlocked
                                        ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200'
                                        : 'bg-slate-50 border-slate-200'
                                    }`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className={`text-4xl ${!isUnlocked && 'grayscale opacity-50'}`}>
                                        {isUnlocked ? achievement.icon : <Lock size={32} className="text-slate-400" />}
                                    </div>

                                    <div className="flex-1">
                                        <h3 className={`font-bold ${isUnlocked ? 'text-amber-900' : 'text-slate-600'}`}>
                                            {achievement.title}
                                        </h3>
                                        <p className={`text-sm ${isUnlocked ? 'text-amber-700' : 'text-slate-500'}`}>
                                            {achievement.description}
                                        </p>

                                        {/* Progress Bar for locked achievements */}
                                        {!isUnlocked && progress.total > 0 && (
                                            <div className="mt-2">
                                                <div className="flex justify-between text-xs text-slate-500 mb-1">
                                                    <span>Progreso</span>
                                                    <span>{progress.current}/{progress.total}</span>
                                                </div>
                                                <div className="bg-slate-200 rounded-full h-1.5 overflow-hidden">
                                                    <div
                                                        style={{ width: `${progress.percentage}%` }}
                                                        className="bg-amber-500 h-full transition-all duration-500"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {isUnlocked && (
                                            <div className="mt-2 flex items-center gap-1 text-xs text-amber-600 font-bold">
                                                <Trophy size={12} />
                                                ¡Desbloqueado!
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Motion.div>
                        );
                    })}
                </div>
            </Motion.div>
        </Motion.div>
    );
}

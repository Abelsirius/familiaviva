// Achievement definitions and logic
export const ACHIEVEMENTS = {
    FIRST_WEEK: {
        id: 'first_week',
        title: 'Primera Semana',
        description: 'Registraste tu ánimo durante 7 días',
        icon: '🎯',
        requirement: { type: 'mood_count', value: 7 }
    },
    GREEN_STREAK_7: {
        id: 'green_streak_7',
        title: 'Semana en Calma',
        description: '7 días consecutivos en verde',
        icon: '💚',
        requirement: { type: 'green_streak', value: 7 }
    },
    BREATHING_5: {
        id: 'breathing_5',
        title: 'Maestro del Respiro',
        description: 'Usaste el respiro emocional 5 veces',
        icon: '🧘',
        requirement: { type: 'tool_usage', tool: 'breathing', value: 5 }
    },
    STORY_CREATOR: {
        id: 'story_creator',
        title: 'Cuentacuentos',
        description: 'Creaste tu primer cuento',
        icon: '📖',
        requirement: { type: 'tool_usage', tool: 'storyteller', value: 1 }
    },
    CHEF_3: {
        id: 'chef_3',
        title: 'Chef en Casa',
        description: 'Generaste 3 recetas',
        icon: '🍳',
        requirement: { type: 'tool_usage', tool: 'chef', value: 3 }
    },
    VOICE_PIONEER: {
        id: 'voice_pioneer',
        title: 'Pionero de Voz',
        description: 'Usaste el asistente de voz',
        icon: '🎤',
        requirement: { type: 'voice_usage', value: 1 }
    },
    MAGIC_MEMORIES: {
        id: 'magic_memories',
        title: 'Guardián de Recuerdos',
        description: 'Guardaste 5 recuerdos mágicos',
        icon: '✨',
        requirement: { type: 'tool_usage', tool: 'magic_journal', value: 5 }
    },
    SLEEP_GURU: {
        id: 'sleep_guru',
        title: 'Gurú del Sueño',
        description: 'Consultaste el gurú del sueño 3 veces',
        icon: '🌙',
        requirement: { type: 'tool_usage', tool: 'sleep_guru', value: 3 }
    }
};

// Check if achievement is unlocked
export function checkAchievement(achievementId, userStats) {
    const achievement = Object.values(ACHIEVEMENTS).find(a => a.id === achievementId);
    if (!achievement) return false;

    const { requirement } = achievement;

    switch (requirement.type) {
        case 'mood_count':
            return (userStats.totalMoodLogs || 0) >= requirement.value;

        case 'green_streak':
            return (userStats.currentGreenStreak || 0) >= requirement.value;

        case 'tool_usage': {
            const toolCount = userStats.toolUsage?.[requirement.tool] || 0;
            return toolCount >= requirement.value;
        }

        case 'voice_usage':
            return (userStats.voiceUsage || 0) >= requirement.value;

        default:
            return false;
    }
}

// Calculate user stats from data
export function calculateUserStats(moodHistory, toolUsageData, voiceUsageCount) {
    const stats = {
        totalMoodLogs: moodHistory.length,
        currentGreenStreak: 0,
        toolUsage: toolUsageData || {},
        voiceUsage: voiceUsageCount || 0
    };

    // Calculate green streak
    let streak = 0;
    for (let i = 0; i < moodHistory.length; i++) {
        if (moodHistory[i].mood === 'verde') {
            streak++;
        } else {
            break;
        }
    }
    stats.currentGreenStreak = streak;

    return stats;
}

// Get newly unlocked achievements
export function getNewlyUnlocked(userStats, unlockedAchievements) {
    const newlyUnlocked = [];

    Object.values(ACHIEVEMENTS).forEach(achievement => {
        const isUnlocked = checkAchievement(achievement.id, userStats);
        const wasUnlocked = unlockedAchievements.includes(achievement.id);

        if (isUnlocked && !wasUnlocked) {
            newlyUnlocked.push(achievement);
        }
    });

    return newlyUnlocked;
}

// Get progress for an achievement
export function getAchievementProgress(achievementId, userStats) {
    const achievement = Object.values(ACHIEVEMENTS).find(a => a.id === achievementId);
    if (!achievement) return { current: 0, total: 0, percentage: 0 };

    const { requirement } = achievement;
    let current = 0;

    switch (requirement.type) {
        case 'mood_count':
            current = userStats.totalMoodLogs || 0;
            break;
        case 'green_streak':
            current = userStats.currentGreenStreak || 0;
            break;
        case 'tool_usage':
            current = userStats.toolUsage?.[requirement.tool] || 0;
            break;
        case 'voice_usage':
            current = userStats.voiceUsage || 0;
            break;
    }

    return {
        current: Math.min(current, requirement.value),
        total: requirement.value,
        percentage: Math.min((current / requirement.value) * 100, 100)
    };
}

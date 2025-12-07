// Pattern analysis utilities for mood and behavior insights

export function analyzeMoodPatterns(moodHistory) {
    if (!moodHistory || moodHistory.length === 0) {
        return {
            mostCommonMood: null,
            stressHours: [],
            calmHours: [],
            weekdayTrends: {},
            moodCounts: { verde: 0, ambar: 0, rojo: 0 },
            insights: []
        };
    }

    const hourlyMoods = {};
    const weekdayMoods = {};
    const moodCounts = { verde: 0, ambar: 0, rojo: 0 };

    moodHistory.forEach(log => {
        if (!log.timestamp) return;

        const date = log.timestamp.toDate ? log.timestamp.toDate() : new Date(log.timestamp);
        const hour = date.getHours();
        const weekday = date.toLocaleDateString('es-ES', { weekday: 'long' });

        moodCounts[log.mood] = (moodCounts[log.mood] || 0) + 1;

        if (!hourlyMoods[hour]) hourlyMoods[hour] = [];
        hourlyMoods[hour].push(log.mood);

        if (!weekdayMoods[weekday]) weekdayMoods[weekday] = [];
        weekdayMoods[weekday].push(log.mood);
    });

    const mostCommonMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0][0];

    const stressHours = Object.entries(hourlyMoods)
        .filter(([, moods]) => moods.filter(m => m === 'rojo' || m === 'ambar').length / moods.length > 0.5)
        .map(([hour]) => parseInt(hour))
        .sort((a, b) => a - b);

    const calmHours = Object.entries(hourlyMoods)
        .filter(([, moods]) => moods.filter(m => m === 'verde').length / moods.length > 0.7)
        .map(([hour]) => parseInt(hour))
        .sort((a, b) => a - b);

    const insights = generateInsights({ mostCommonMood, stressHours, calmHours, weekdayMoods, moodCounts, totalLogs: moodHistory.length });

    return { mostCommonMood, stressHours, calmHours, weekdayTrends: weekdayMoods, moodCounts, insights };
}

function generateInsights(data) {
    const insights = [];

    if (data.stressHours.length > 0) {
        const timeRanges = groupConsecutiveHours(data.stressHours);
        insights.push({
            type: 'warning',
            icon: '⚠️',
            title: 'Momentos de Mayor Estrés',
            description: `Sueles sentir más estrés entre las ${formatTimeRange(timeRanges[0])}. Considera programar pausas de respiración en estos momentos.`
        });
    }

    if (data.calmHours.length > 0) {
        insights.push({
            type: 'positive',
            icon: '✨',
            title: 'Tu Mejor Momento',
            description: `Te sientes más tranquilo/a alrededor de las ${data.calmHours[0]}:00. Aprovecha este tiempo para actividades importantes.`
        });
    }

    const greenPercentage = (data.moodCounts.verde / data.totalLogs) * 100;
    if (greenPercentage > 60) {
        insights.push({
            type: 'positive',
            icon: '🎉',
            title: '¡Vas Muy Bien!',
            description: `${Math.round(greenPercentage)}% de tus registros son en calma. Estás manejando muy bien el estrés parental.`
        });
    } else if (data.moodCounts.rojo > data.totalLogs * 0.3) {
        insights.push({
            type: 'suggestion',
            icon: '💡',
            title: 'Necesitas Más Apoyo',
            description: 'Has registrado varios momentos SOS. Considera hablar con un especialista o usar más las herramientas de autocuidado.'
        });
    }

    return insights;
}

function groupConsecutiveHours(hours) {
    if (hours.length === 0) return [];
    const ranges = [];
    let start = hours[0];
    let end = hours[0];

    for (let i = 1; i < hours.length; i++) {
        if (hours[i] === end + 1) {
            end = hours[i];
        } else {
            ranges.push([start, end]);
            start = hours[i];
            end = hours[i];
        }
    }
    ranges.push([start, end]);
    return ranges;
}

function formatTimeRange(range) {
    const [start, end] = range;
    if (start === end) return `${start}:00`;
    return `${start}:00 - ${end}:00`;
}

export function predictNextMood(moodHistory) {
    if (moodHistory.length < 3) return null;

    const now = new Date();
    const currentHour = now.getHours();

    const similarTimeMoods = moodHistory
        .filter(log => {
            if (!log.timestamp) return false;
            const logDate = log.timestamp.toDate ? log.timestamp.toDate() : new Date(log.timestamp);
            const hourDiff = Math.abs(logDate.getHours() - currentHour);
            return hourDiff <= 1;
        })
        .map(log => log.mood);

    if (similarTimeMoods.length === 0) return null;

    const moodCounts = similarTimeMoods.reduce((acc, mood) => {
        acc[mood] = (acc[mood] || 0) + 1;
        return acc;
    }, {});

    const predicted = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0][0];
    return predicted;
}

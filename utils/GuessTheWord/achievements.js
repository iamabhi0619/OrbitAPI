function hasConsecutiveDays(stats, requiredDays) {
    const dates = stats.map(s => s.date.toISOString().slice(0, 10)).sort();
    let count = 1;
    for (let i = 1; i < dates.length; i++) {
        const prev = new Date(dates[i - 1]);
        const curr = new Date(dates[i]);
        const diff = (curr - prev) / (1000 * 60 * 60 * 24);
        if (diff === 1) count++;
        else count = 1;
        if (count >= requiredDays) return true;
    }
    return false;
}

const achievements = [
    { key: "EFFICIENCY_90", title: "Perfect Precision", subtitle: "Maintain 90%+ accuracy with 20+ solves!", priority: 100 },
    { key: "XP_1000", title: "XP Legend", subtitle: "Crossed the 1000 XP milestone!", priority: 98 },
    { key: "STREAK_50", title: "Unstoppable", subtitle: "Achieved a 50-win streak!", priority: 97 },
    { key: "SOLVE_500", title: "Word Slayer", subtitle: "Crushed 500 words!", priority: 95 },
    { key: "HINTLESS_20", title: "No Help Needed", subtitle: "Guessed 20 words with zero hints!", priority: 94 },
    { key: "LEVEL_6_UNLOCKED", title: "Final Frontier", subtitle: "Unlocked level 6—master zone!", priority: 50 },

    // Solving
    { key: "SOLVE_250", title: "Word Dominator", subtitle: "250 words? You're on fire!", priority: 80 },
    { key: "SOLVE_100", title: "Century Solver", subtitle: "You've solved 100 words!", priority: 70 },
    { key: "SOLVE_50", title: "Word Buster", subtitle: "50 solved. You’re heating up!", priority: 60 },
    { key: "SOLVE_10", title: "Rookie Riser", subtitle: "10 solved. You're warming up!", priority: 40 },
    { key: "FIRST_SOLVE", title: "First Blood", subtitle: "You solved your first word!", priority: 30 },

    // Streaks
    { key: "STREAK_25", title: "Hot Hand", subtitle: "25-word streak—wow!", priority: 68 },
    { key: "STREAK_10", title: "On a Roll", subtitle: "10-word streak going strong!", priority: 55 },
    { key: "STREAK_5", title: "Warming Up", subtitle: "5 in a row! Nice!", priority: 35 },

    // 🎯 Efficiency Skills
    { key: "EFFICIENCY_75", title: "Sharpshooter", subtitle: "75%+ accuracy across 20+ words!", priority: 65 },
    { key: "EFFICIENCY_50", title: "Getting Sharp", subtitle: "50%+ efficiency with 20+ solves!", priority: 50 },

    // Hint use / no hint
    { key: "HINTLESS_5", title: "Solo Solver", subtitle: "5 words solved without help!", priority: 45 },
    { key: "HINTLESS_10", title: "Hintless Hero", subtitle: "10 words solved without hints!", priority: 55 },

    { key: "HINT_USER_50", title: "Strategist", subtitle: "Used 50 hints wisely!", priority: 25 },
    { key: "HINT_USER_10", title: "Learning Mode", subtitle: "10 hints used along the way!", priority: 20 },


    // XP
    { key: "XP_500", title: "XP Hunter", subtitle: "500 XP earned. Solid grind!", priority: 42 },
    { key: "XP_250", title: "XP Collector", subtitle: "250 XP collected!", priority: 38 },
    { key: "XP_100", title: "XP Beginner", subtitle: "First 100 XP milestone!", priority: 28 },


    // Score
    { key: "SCORE_1000", title: "High Scorer", subtitle: "Cracked 1000 score!", priority: 41 },
    { key: "SCORE_500", title: "Pro Points", subtitle: "500 score achieved!", priority: 30 },
    { key: "SCORE_100", title: "Getting Points", subtitle: "First 100 score!", priority: 20 },


    // Level Unlocks
    { key: "LEVEL_4_UNLOCKED", title: "Climbing Fast", subtitle: "Level 4 reached!", priority: 35 },
    { key: "LEVEL_2_UNLOCKED", title: "First Step Up", subtitle: "Unlocked level 2!", priority: 20 },


    // Daily Activity
    { key: "DAILY_15_DAYS", title: "Habit Hero", subtitle: "Played 15 days in a row!", priority: 60 },
    { key: "DAILY_7_DAYS", title: "Week Warrior", subtitle: "7-day streak playing!", priority: 40 },
    { key: "DAILY_3_DAYS", title: "Coming Back", subtitle: "3 days of non-stop play!", priority: 25 },
];

exports.checkAchievements = (scorecard) => {
    const unlocked = [];
    const has = (key) => scorecard.achievements.some(a => a.key === key);

    // Use the static achievements array for meta, and check conditions here:
    for (const ach of achievements) {
        let condition = false;
        switch (ach.key) {
            case "EFFICIENCY_90":
                condition = scorecard.efficiency >= 90 && scorecard.totalQuestionsSolved >= 20;
                break;
            case "XP_1000":
                condition = scorecard.xp >= 1000;
                break;
            case "STREAK_50":
                condition = scorecard.streak.best >= 50;
                break;
            case "SOLVE_500":
                condition = scorecard.totalQuestionsSolved >= 500;
                break;
            case "HINTLESS_20":
                condition = scorecard.correctGuesses >= 20 && scorecard.totalHintsUsed === 0;
                break;
            case "LEVEL_6_UNLOCKED":
                condition = scorecard.unlockedLevels.includes(6);
                break;
            case "SOLVE_250":
                condition = scorecard.totalQuestionsSolved >= 250;
                break;
            case "SOLVE_100":
                condition = scorecard.totalQuestionsSolved >= 100;
                break;
            case "SOLVE_50":
                condition = scorecard.totalQuestionsSolved >= 50;
                break;
            case "SOLVE_10":
                condition = scorecard.totalQuestionsSolved >= 10;
                break;
            case "FIRST_SOLVE":
                condition = scorecard.totalQuestionsSolved >= 1;
                break;
            case "STREAK_25":
                condition = scorecard.streak.best >= 25;
                break;
            case "STREAK_10":
                condition = scorecard.streak.best >= 10;
                break;
            case "STREAK_5":
                condition = scorecard.streak.best >= 5;
                break;
            case "EFFICIENCY_75":
                condition = scorecard.efficiency >= 75 && scorecard.totalQuestionsSolved >= 20;
                break;
            case "EFFICIENCY_50":
                condition = scorecard.efficiency >= 50 && scorecard.totalQuestionsSolved >= 20;
                break;
            case "HINTLESS_5":
                condition = scorecard.correctGuesses >= 5 && scorecard.totalHintsUsed === 0;
                break;
            case "HINTLESS_10":
                condition = scorecard.correctGuesses >= 10 && scorecard.totalHintsUsed === 0;
                break;
            case "HINT_USER_50":
                condition = scorecard.totalHintsUsed >= 50;
                break;
            case "HINT_USER_10":
                condition = scorecard.totalHintsUsed >= 10;
                break;
            case "XP_500":
                condition = scorecard.xp >= 500;
                break;
            case "XP_250":
                condition = scorecard.xp >= 250;
                break;
            case "XP_100":
                condition = scorecard.xp >= 100;
                break;
            case "SCORE_1000":
                condition = scorecard.score >= 1000;
                break;
            case "SCORE_500":
                condition = scorecard.score >= 500;
                break;
            case "SCORE_100":
                condition = scorecard.score >= 100;
                break;
            case "LEVEL_4_UNLOCKED":
                condition = scorecard.unlockedLevels.includes(4);
                break;
            case "LEVEL_2_UNLOCKED":
                condition = scorecard.unlockedLevels.includes(2);
                break;
            case "DAILY_15_DAYS":
                condition = hasConsecutiveDays(scorecard.dailyStats, 15);
                break;
            case "DAILY_7_DAYS":
                condition = hasConsecutiveDays(scorecard.dailyStats, 7);
                break;
            case "DAILY_3_DAYS":
                condition = hasConsecutiveDays(scorecard.dailyStats, 3);
                break;
            // etc.
        }
        if (!has(ach.key) && condition) {
            unlocked.push({
                key: ach.key,
                title: ach.title,
                subtitle: ach.subtitle
            });
        }
    }
    return unlocked;
};



exports.determineCurrentLevel = (levelProgress) => {
    const thresholds = [30, 40, 40, 40, 40]; // Total 30 for level 1, then +40 each level

    let currentLevel = 1;

    for (let i = 0; i < thresholds.length; i++) {
        const level = (i + 1).toString();
        const progress = levelProgress.get(level);
        const solved = progress?.questionsSolved || 0;

        if (solved >= thresholds[i]) {
            currentLevel++;
        } else {
            break;
        }
    }

    return currentLevel > 6 ? 6 : currentLevel;
};


// utils/rewardCalculator.js
const REWARD_MATRIX = {
    1: { correct: { score: 10, xp: 5, points: 2 }, withHint: { score: 6, xp: 3, points: 1 } },
    2: { correct: { score: 15, xp: 8, points: 3 }, withHint: { score: 10, xp: 5, points: 2 } },
    3: { correct: { score: 20, xp: 10, points: 4 }, withHint: { score: 14, xp: 7, points: 2 } },
    4: { correct: { score: 25, xp: 12, points: 5 }, withHint: { score: 18, xp: 8, points: 3 } },
    5: { correct: { score: 30, xp: 15, points: 6 }, withHint: { score: 20, xp: 10, points: 3 } },
    6: { correct: { score: 35, xp: 18, points: 8 }, withHint: { score: 24, xp: 12, points: 4 } },
};

exports.calculateReward = (level, usedHint = false) => {
    const base = REWARD_MATRIX[level] || REWARD_MATRIX[1];
    return usedHint ? base.withHint : base.correct;
};


exports.achievements = achievements;

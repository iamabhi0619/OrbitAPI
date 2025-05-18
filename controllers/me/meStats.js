const axios = require('axios');
const ApiError = require("../../utils/ApiError");
const logger = require("../../config/logger");
const config = require('../../config');
const GITHUB_API_URL = 'https://api.github.com/graphql';
const GITHUB_TOKEN = config.GITHUB_TOKEN;


const formatData = (data) => {
    const user = data.matchedUser;
    const calendar = JSON.parse(user.submissionCalendar || '{}');

    const submissionDates = Object.keys(calendar)
        .map(ts => new Date(parseInt(ts) * 1000))
        .sort((a, b) => a - b)
        .map(date => date.toISOString().split('T')[0]);

    const diffDays = (d1, d2) =>
        Math.floor((new Date(d2) - new Date(d1)) / (1000 * 60 * 60 * 24));

    let longestStreak = 0;
    let currentStreak = 0;

    if (submissionDates.length > 0) {
        let streak = 1;
        longestStreak = 1;

        for (let i = 1; i < submissionDates.length; i++) {
            if (diffDays(submissionDates[i - 1], submissionDates[i]) === 1) {
                streak++;
            } else {
                streak = 1;
            }
            if (streak > longestStreak) longestStreak = streak;
        }

        const today = new Date().toISOString().split('T')[0];
        let idx = submissionDates.length - 1;
        if (submissionDates[idx] !== today) idx--;

        let streakCount = 1;
        for (let i = idx; i > 0; i--) {
            if (diffDays(submissionDates[i - 1], submissionDates[i]) === 1) {
                streakCount++;
            } else break;
        }
        currentStreak = streakCount;
    }

    const totalSubmissions = Object.values(calendar).reduce((a, b) => a + b, 0);
    const firstSubmission = submissionDates[0];
    const lastSubmission = submissionDates[submissionDates.length - 1];
    const totalDays = diffDays(firstSubmission, lastSubmission) + 1;
    const avgSubmissionsPerDay = (totalSubmissions / totalDays).toFixed(2);
    const consistency = ((submissionDates.length / totalDays) * 100).toFixed(2);

    const calendarData = Object.entries(calendar).map(([ts, count]) => ({
        date: new Date(parseInt(ts) * 1000).toISOString().split('T')[0],
        count,
    }));

    return {
        profile: {
            avatar: user.profile.userAvatar,
            aboutMe: user.profile.aboutMe,
            reputation: user.profile.reputation,
            ranking: user.profile.ranking,
            contributionPoints: user.contributions.points,
            badges: user.badges,
        },
        stats: {
            totalSolved: user.submitStats.acSubmissionNum[0].count,
            easySolved: user.submitStats.acSubmissionNum[1].count,
            mediumSolved: user.submitStats.acSubmissionNum[2].count,
            hardSolved: user.submitStats.acSubmissionNum[3].count,
            totalSubmissions: user.submitStats.totalSubmissionNum,
            totalQuestions: data.allQuestionsCount,
        },
        activityStats: {
            currentStreak,
            longestStreak,
            activeDays: submissionDates.length,
            firstSubmission,
            lastSubmission,
            totalSubmissions,
            avgSubmissionsPerDay,
            consistencyPercent: consistency,
        },
        languageStats: user.languageProblemCount || [],
        skillStats: user.tagProblemCounts || {},
        submissionCalendar: calendarData,
        recentSubmissions: data.recentSubmissionList,
        globalStats: data.matchedUserStats.submitStats,
    };
};

exports.getGitHubUserInfo = async (req, res) => {
    const { username } = req.params;
    const query = `
    query getUserInfo($username: String!) {
      user(login: $username) {
        name
        login
        avatarUrl
        bio
        location
        websiteUrl
        followers { totalCount }
        following { totalCount }
        repositories(privacy: PUBLIC, first: 50, orderBy: {field: STARGAZERS, direction: DESC}) {
          totalCount
          nodes {
            name
            description
            url
            stargazerCount
            forkCount
            updatedAt
            primaryLanguage {
              name
              color
            }
          }
        }
        contributionsCollection {
          totalCommitContributions
          totalIssueContributions
          totalPullRequestContributions
          totalPullRequestReviewContributions
          contributionCalendar {
            totalContributions
            weeks {
              contributionDays {
                date
                contributionCount
                color
              }
            }
          }
        }
      }
    }
  `;

    try {
        const { data } = await axios.post(
            GITHUB_API_URL,
            { query, variables: { username } },
            {
                headers: {
                    Authorization: `Bearer ${GITHUB_TOKEN}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        if (data.errors) {
            return res.status(404).json({ error: data.errors[0].message });
        }

        const user = data.data.user;

        // Calculate language stats
        const languageStats = {};
        user.repositories.nodes.forEach(repo => {
            if (repo.primaryLanguage && repo.primaryLanguage.name) {
                const lang = repo.primaryLanguage.name;
                if (!languageStats[lang]) {
                    languageStats[lang] = {
                        count: 0,
                        color: repo.primaryLanguage.color || null
                    };
                }
                languageStats[lang].count += 1;
            }
        });

        // Find the most used language
        let mostUsedLanguage = null;
        let maxCount = 0;
        Object.entries(languageStats).forEach(([lang, stat]) => {
            if (stat.count > maxCount) {
                maxCount = stat.count;
                mostUsedLanguage = { name: lang, ...stat };
            }
        });

        // Format the response neatly
        const formattedResponse = {
            name: user.name || user.login,
            username: user.login,
            avatarUrl: user.avatarUrl,
            bio: user.bio,
            location: user.location,
            websiteUrl: user.websiteUrl,
            followersCount: user.followers.totalCount,
            followingCount: user.following.totalCount,
            totalPublicRepos: user.repositories.totalCount,
            topRepositories: user.repositories.nodes.map(repo => ({
                name: repo.name,
                description: repo.description,
                url: repo.url,
                stars: repo.stargazerCount,
                forks: repo.forkCount,
                lastUpdated: repo.updatedAt,
                primaryLanguage: repo.primaryLanguage ? {
                    name: repo.primaryLanguage.name,
                    color: repo.primaryLanguage.color,
                } : null,
            })),
            contributions: {
                totalCommits: user.contributionsCollection.totalCommitContributions,
                totalIssues: user.contributionsCollection.totalIssueContributions,
                totalPullRequests: user.contributionsCollection.totalPullRequestContributions,
                totalPRReviews: user.contributionsCollection.totalPullRequestReviewContributions,
                totalContributions: user.contributionsCollection.contributionCalendar.totalContributions,
            },
            languageStats: {
                all: languageStats,
                mostUsed: mostUsedLanguage
            }
        };

        return res.json(formattedResponse);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

exports.leetcodeProfile = async (req, res, next) => {
    const username = req.params.username || 'iamabhi0619';


    const query = `
  query getUserProfile($username: String!) {
    allQuestionsCount {
      difficulty
      count
    }
    matchedUser(username: $username) {
      contributions { points }
      profile {
        reputation
        ranking
        userAvatar
        aboutMe
      }
      badges {
        id
        displayName
        icon
      }
      submissionCalendar
      languageProblemCount {
        languageName
        problemsSolved
      }
      tagProblemCounts {
        fundamental {
          tagName
          tagSlug
          problemsSolved
        }
        intermediate {
          tagName
          tagSlug
          problemsSolved
        }
        advanced {
          tagName
          tagSlug
          problemsSolved
        }
      }
      submitStats {
        acSubmissionNum {
          difficulty
          count
          submissions
        }
        totalSubmissionNum {
          difficulty
          count
          submissions
        }
      }
    }
    recentSubmissionList(username: $username) {
      title
      titleSlug
      timestamp
      statusDisplay
      lang
    }
    matchedUserStats: matchedUser(username: $username) {
      submitStats: submitStatsGlobal {
        acSubmissionNum {
          difficulty
          count
          submissions
        }
        totalSubmissionNum {
          difficulty
          count
          submissions
        }
      }
    }
  }
`;

    try {
        const response = await axios.post(
            'https://leetcode.com/graphql',
            {
                query,
                variables: { username },
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    Referer: 'https://leetcode.com',
                },
            }
        );
        const result = response.data;
        if (result.errors && result.errors.some(
            (err) =>
                err.message &&
                err.message.toLowerCase().includes("user does not exist")
        )) {
            return next(new ApiError(404, "User does not exist on LeetCode.", "USER_NOT_FOUND", "Not able to find user with provide username."));
        }
        if (result.errors) {
            logger.warn(`LeetCode GraphQL errors: ${JSON.stringify(result.errors)}`);
            return next(new ApiError(400, "Bad Request", "LEETCODE_GRAPHQL_ERROR", "Error occurred during data fetch from leetcode"));
        }
        // Format and return data
        const formattedData = formatData(result.data);
        res.status(200).json({
            success: true,
            message: "LeetCode data fetched successfully.",
            stats: formattedData,
        });
    } catch (err) {
        console.log(err.response.data);
        logger.error('Error fetching LeetCode profile: ' + err.message);
        next(
            new ApiError(
                500,
                "Failed to fetch LeetCode profile",
                "LEETCODE_PROFILE_ERROR",
                err.message
            )
        );
    }
};

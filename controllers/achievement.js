const { default: axios } = require("axios");
const logger = require("../service/logging");
const config = require("../config");

const calculateRates = (data) => {
  return data.matchedUserStats.acSubmissionNum.map((item, index) => {
    const totalAttempts = data.matchedUserStats.totalSubmissionNum[index].submissions;
    const totalSolved = data.matchedUserStats.totalSubmissionNum[index].count;

    const acceptanceRate = (item.count / totalSolved) * 100;
    const accuracy = (item.submissions / totalAttempts) * 100;

    return {
      difficulty: item.difficulty,
      totalSolved: totalSolved,
      totalSubmissions: totalAttempts,
      acceptanceRate: acceptanceRate.toFixed(2) + "%",
      accuracy: accuracy.toFixed(2) + "%",
    };
  });
};

exports.leetCode = async (req, res) => {
  try {
    const response = await axios.get(`https://leetcode-api-faisalshohag.vercel.app/iamabhi0619`);
    const submissionCalendar = response.data.submissionCalendar;
    // Convert timestamps to dates
    const submissionDates = Object.keys(submissionCalendar)
      .map((ts) => new Date(parseInt(ts) * 1000).toISOString().split("T")[0])
      .sort((a, b) => new Date(b) - new Date(a));
    // Calculate current streak
    let streak = 1;
    for (let i = 1; i < submissionDates.length; i++) {
      const prevDate = new Date(submissionDates[i - 1]);
      const currDate = new Date(submissionDates[i]);
      if (prevDate - currDate === 86400000) {
        // 86400000 ms = 1 day
        streak++;
      } else {
        break;
      }
    }
    // Adding streak to the response data
    const recentSubmissions = response.data.recentSubmissions[0];
    delete response.data.submissionCalendar;
    delete response.data.recentSubmissions;
    delete response.data.matchedUserStats;
    response.data.currentStreak = streak;
    response.data.recentSubmissions = recentSubmissions;
    // console.log(response.data);
    res.json(response.data);
  } catch (error) {
    logger.error(`Error in fetching data ${error}`);
    res.status(500).json({ error: "Failed to fetch data" });
  }
};

exports.github = async (req, res) => {
  const GITHUB_TOKEN = config.GITHUB_TOKEN;
  const GITHUB_API_URL = "https://api.github.com/users/iamabhi0619";
  const headers = {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
  };
  try {
    const response = await axios.get(GITHUB_API_URL, { headers });
    const data = {
      name: response.data.name,
      username: response.data.login,
      avatar: response.data.avatar_url,
      followers: response.data.followers,
      following: response.data.following,
      profileUrl: response.data.html_url,
      location: response.data.location,
      repos: response.data.public_repos,
      totalStars: response.data.starred_url,
    };
    res.status(200).json(data);
  } catch (error) {
    console.log(error);
    logger.error("Error fetching data from GitHub API", error);
    res.status(500).json({ error: "Failed to fetch data from GitHub" });
  }
};

exports.leetProfile = async (req, res) => {
  try {
    const { id } = req.params;
    let skillStats = null;
    let langCount = null;
    let badges = null;

    const responseApi = await axios.get(`https://leetcode-api-faisalshohag.vercel.app/${id}`);

    // Check if user is not found
    if (responseApi.data?.data?.matchedUser === null) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    try {
      const rskillStats = await axios.get(
        `https://alfa-leetcode-api.onrender.com/skillStats/${id}`
      );
      skillStats = rskillStats.data?.data?.matchedUser?.tagProblemCounts || null;
    } catch (error) {
      logger.error("Error fetching skillStats:", error);
    }

    try {
      const rlangCount = await axios.get(
        `https://alfa-leetcode-api.onrender.com/languageStats?username=${id}`
      );
      langCount = rlangCount.data?.matchedUser?.languageProblemCount || null;
    } catch (error) {
      logger.error("Error fetching languageStats:", error);
    }

    try {
      const rbadges = await axios.get(`https://alfa-leetcode-api.onrender.com/${id}/badges`);
      badges = rbadges.data?.activeBadge || null;
    } catch (error) {
      logger.error("Error fetching badges:", error);
    }

    const submissionCalendar = responseApi.data?.submissionCalendar || null;
    const levelStats = [
      responseApi.data?.easySolved,
      responseApi.data?.mediumSolved,
      responseApi.data?.hardSolved,
    ];
    const rates = calculateRates(responseApi.data);

    res.json({
      success: true,
      data: {
        levelStats,
        rates,
        langCount,
        skillStats,
        submissionCalendar,
        badges,
      },
    });
  } catch (error) {
    console.error("Error fetching leetProfile:", error.message);
    res.status(500).json({ success: false, error: "Failed to fetch data" });
  }
};

exports.githubProfile = async (req, res) => {
  const { username } = req.params;
  const GITHUB_API_URL = "https://api.github.com/users";
  const headers = {
    Authorization: `Bearer ${config.GITHUB_TOKEN}`,
  };
  try {
    // Fetch user profile data
    const userResponse = await axios.get(`${GITHUB_API_URL}/${username}`, { headers });
    const user = userResponse.data;

    // Fetch repositories (GitHub API does NOT sort correctly, so we fetch and sort manually)
    const reposResponse = await axios.get(`${GITHUB_API_URL}/${username}/repos?per_page=100`, {
      headers
    });
    const repos = reposResponse.data;

    // Sort repos manually by stars (descending order)
    repos.sort((a, b) => b.stargazers_count - a.stargazers_count);

    // Get top 8 repositories
    const topRepos = repos.slice(0, 8).map((repo) => ({
      name: repo.name,
      stars: repo.stargazers_count,
      discription: repo.description,
      html_url: repo.html_url,
      fork: repo.fork,
      language: repo.language,
      forks: repo.forks_count,
      language: repo.language || "Unknown",
      url: repo.html_url,
    }));

    // Get top 5 most-starred repositories
    const mostStarred = repos.slice(0, 5).map((repo) => ({
      name: repo.name,
      stars: repo.stargazers_count,
    }));

    // Count language usage
    const languageStats = {};
    repos.forEach((repo) => {
      if (repo.language) {
        languageStats[repo.language] = (languageStats[repo.language] || 0) + 1;
      }
    });

    // Response JSON
    res.json({
      profile: {
        username: user.login,
        avatar: user.avatar_url,
        name: user.name,
        bio: user.bio,
        html_url: user.html_url,
        location: user.location,
        followers: user.followers,
        following: user.following,
        public_repos: user.public_repos,
        created_at: user.created_at,
      },
      topRepos,
      mostStarred,
      languageStats,
    });
  } catch (error) {
    console.error("Error fetching GitHub data:", error);
    if (error.response && error.response.status === 404) {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(500).json({ error: "Failed to fetch GitHub data" });
  }
};

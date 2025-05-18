const express = require('express');
const { leetCode, getLeetCodeStats, leetcodeProfile, getGitHubUserInfo } = require('../../controllers/me/meStats');
const router = express.Router();

router.get('/leetcode/:username', leetcodeProfile);
router.get('/github/:username', getGitHubUserInfo);

module.exports = router;
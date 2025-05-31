const express = require('express');
const { leetcodeProfile, getGitHubUserInfo, myStats } = require('../../controllers/me/meStats');
const router = express.Router();

router.get('/leetcode/:username', leetcodeProfile);
router.get('/github/:username', getGitHubUserInfo);
router.get('/myStats', myStats);

module.exports = router;
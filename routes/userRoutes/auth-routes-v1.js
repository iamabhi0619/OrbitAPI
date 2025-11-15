const express = require("express");
const AuthV1Controller = require('../../controllers/user/user-auth-v1')
const GoogleOAuthV1Controller = require('../../controllers/user/oAuth-v1');


const router = express.Router();

router.post('/register', AuthV1Controller.register);
router.post('/resend-verification', AuthV1Controller.resendVerification);
router.post('/verify-email', AuthV1Controller.verifyEmail);
router.post('/login', AuthV1Controller.login);
router.get('/refresh-token', AuthV1Controller.refreshToken);

router.get('/google', GoogleOAuthV1Controller.GoogleOAuthV1);
router.get('/google/callback', GoogleOAuthV1Controller.GoogleOAuthCallbackV1);


module.exports = router;
module.exports = {
    WELCOME: {
        template: "welcome.hbs",
        context: ["name"],
    },
    PASSWORD_RESET: {
        template: "passwordReset.hbs",
        context: ["name", "url"],
    },
    EMAIL_VERIFICATION: {
        template: "emailVerification.hbs",
        context: ["name", "verificationLink"],
    },
    ACCOUNT_VERIFIED: {
        template: "accountVerified.hbs",
        context: ["name"],
    },
    ACCOUNT_DELETE: {
        template: "accountDelete.hbs",
        context: ["name", "deleteDate"],
    },
    CONTACT_FORM_CONFIRMATION: {
        template: "contactFormConfirmation.hbs",
        context: ["name", "phone", "message"],
    },
    CONTACT_FORM_REPLY: {
        template: "contactFormReply.hbs",
        context: ["name", "reply", "message"],
    },
};

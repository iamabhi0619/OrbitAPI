const cors = require("cors");
const config = require(".");
const logger = require("./logger");

const useCors = cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);

        const rawDomain = (config.DOMAIN || "localhost").replace(/^\./, "");
        const allowedHosts = ["localhost", "127.0.0.1"];

        const domainRegex = new RegExp(`(^|\\.)${rawDomain.replace(/\./g, "\\.")}$`);

        try {
            const hostname = new URL(origin).hostname;

            if (domainRegex.test(hostname) || allowedHosts.includes(hostname)) {
                return callback(null, true);
            }

            logger.warn("CORS origin denied:", origin);
            return callback(new Error("Not allowed by CORS"));
        } catch (err) {
            logger.error("Invalid origin format:", origin, err.message);
            return callback(new Error("Invalid origin format"));
        }
    },
    credentials: true,
});
module.exports = useCors;

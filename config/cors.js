const cors = require("cors");
const config = require(".");
const logger = require("./logger");

const useCors = cors({
    origin: (origin, callback) => {

        if (config.NODE_ENV === "development") {
            return callback(null, true);
        }

        if (!origin) return callback(null, true);

        const domain = (config.DOMAIN || "localhost").replace(/^\./, "");
        const allowedHosts = ["localhost", "127.0.0.1"];

        try {
            const hostname = new URL(origin).hostname;

            if (
                hostname === domain ||
                hostname.endsWith(`.${domain}`) ||
                allowedHosts.includes(hostname)
            ) {
                return callback(null, true);
            }

            logger.warn("CORS origin denied:", origin);
            callback(new Error("Not allowed by CORS"));

        } catch (err) {
            logger.error("Invalid origin:", origin);
            callback(new Error("Invalid origin format"));
        }
    },
    credentials: true,
});

module.exports = useCors;
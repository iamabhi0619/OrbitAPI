const { URL } = require('url');
const config = require('../../config');

const isValidRedirect = (redirectUrl, domain) => {
    try {
        const url = new URL(redirectUrl);
        const hostname = url.hostname;

        if (config.NODE_ENV === "development") {
            if (hostname === "localhost" || hostname === "127.0.0.1" || hostname.startsWith("localhost:") || hostname.startsWith("127.0.0.1:")) {
                return true;
            }
        }

        if (hostname === domain || hostname.endsWith(`.${domain}`)) {
            return true;
        }

        return false;
    } catch (error) {
        return false;
    }
}

module.exports = { isValidRedirect };
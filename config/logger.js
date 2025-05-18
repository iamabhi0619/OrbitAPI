const winston = require("winston");
const TelegramLogger = require("winston-telegram");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const config = require(".");

const levels = {
    levels: {
        info: 0,
        header: 1,
        warn: 2,
        error: 3,
    },
    colors: {
        info: 'green',
        header: 'cyan bold',
        warn: 'yellow',
        error: 'red bold',
    },
};

winston.addColors(levels.colors);

// Common formatting base
const baseFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format((info) => {
        info.id = uuidv4(); // Unique ID for each log
        return info;
    })()
);

// Console format (colorized and readable)
const consoleFormat = winston.format.combine(
    winston.format.colorize({ all: true }),
    winston.format.label({ label: "OrbitAPI" }),
    baseFormat,
    winston.format.printf((info) => {
        return `[${info.timestamp}] [${info.label}] [${info.level}] ${info.message} ${info.stack || ''}`;
    })
);

// JSON format for file and Telegram
const jsonFormat = winston.format.combine(
    baseFormat,
    winston.format.json()
);

// Telegram logger transport
const telegramTransport = new TelegramLogger({
    token: config.TELEGRAM_TOKEN,
    chatId: config.TELEGRAM_CHAT_ID,
    level: "error",
    unique: true,
    template:
        `🚨 *{level.toUpperCase()} Error!*\n` +
        `*ID:* {meta.id}\n` +
        `*Time:* {timestamp}\n` +
        `*Message:* {message}\n` +
        `*Stack:* {meta.stack}`,
    parse_mode: 'Markdown',
});

// 🚫 Fix MaxListenersExceededWarning
telegramTransport.setMaxListeners(50);

const logger = winston.createLogger({
    levels: levels.levels,
    level: 'info',
    transports: [
        new winston.transports.Console({
            format: consoleFormat,
        }),

        new winston.transports.File({
            filename: path.join(__dirname, "../logs/app.log"),
            level: "info",
            format: jsonFormat,
        }),

        telegramTransport,
    ],
});

module.exports = logger;

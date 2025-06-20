const winston = require("winston");
const DailyRotateFile = require("winston-daily-rotate-file");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const config = require("."); // your config file
let TelegramLogger;

try {
    TelegramLogger = require("winston-telegram");
} catch (err) {
    console.warn("⚠️ winston-telegram not installed. Telegram logs will be skipped.");
}

// Custom log levels
const levels = {
    levels: {
        error: 0,
        warn: 1,
        info: 2,
        header: 3,
    },
    colors: {
        error: "red bold",
        warn: "yellow",
        info: "green",
        header: "cyan",
    },
};

winston.addColors(levels.colors);

// Add common meta info (ID, stack, timestamp)
const enrichMeta = winston.format((info) => {
    const meta = {
        id: uuidv4(),
        stack: info.stack || "",
        timestamp: info.timestamp || new Date().toISOString(),
    };
    info.meta = { ...info.meta, ...meta };
    return info;
});

// Console output formatting
const consoleFormat = winston.format.combine(
    winston.format.colorize({ all: true }),
    winston.format.label({ label: "OrbitAPI" }),
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.errors({ stack: true }),
    enrichMeta(),
    winston.format.printf((info) => {
        return `[${info.timestamp}] [${info.label}] [${info.level}]: ${info.message} ${info.stack || ""}`;
    })
);

// JSON format for files & Telegram
const jsonFormat = winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.errors({ stack: true }),
    enrichMeta(),
    winston.format.json()
);

// Daily rotating file transport
const fileTransport = new DailyRotateFile({
    filename: path.join(__dirname, "../logs/app-%DATE%.log"),
    datePattern: "YYYY-MM-DD",
    maxSize: "10m",
    maxFiles: "14d",
    level: "info",
    format: jsonFormat,
});

// Optional Telegram transport
let telegramTransport = null;

if (TelegramLogger && config.TELEGRAM_TOKEN && config.TELEGRAM_CHAT_ID) {
    try {
        telegramTransport = new TelegramLogger({
            token: config.TELEGRAM_TOKEN,
            chatId: config.TELEGRAM_CHAT_ID,
            level: "error",
            unique: true,
            format: jsonFormat,
            template:
                `🚨 {level} Alert!\n` +
                `ID: {id}\n` +
                `Time: {timestamp}\n\n` +
                `Message:\n{message}\n\n` +
                `Stack:\n{meta.stack}`,
            parse_mode: "MarkdownV2",
        });

        telegramTransport.setMaxListeners(50);
    } catch (err) {
        console.error("❌ Failed to initialize Telegram logger:", err);
    }
}

// Final Winston logger instance
const logger = winston.createLogger({
    levels: levels.levels,
    level: "info",
    transports: [
        new winston.transports.Console({
            format: consoleFormat,
        }),
        fileTransport,
        ...(telegramTransport ? [telegramTransport] : []),
    ],
    exitOnError: false,
});

module.exports = logger;

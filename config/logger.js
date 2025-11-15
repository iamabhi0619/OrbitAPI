const winston = require("winston");
const DailyRotateFile = require("winston-daily-rotate-file");
const { v4: uuidv4 } = require("uuid");
const path = require("path");

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

// Final Winston logger instance
const logger = winston.createLogger({
    levels: levels.levels,
    level: "info",
    transports: [
        new winston.transports.Console({
            format: consoleFormat,
        }),
        fileTransport
    ],
    exitOnError: false,
});

module.exports = logger;

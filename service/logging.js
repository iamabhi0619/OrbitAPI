const winston = require("winston");
const TelegramLogger = require("winston-telegram");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const config = require("../config");

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format((info) => {
      info.id = uuidv4();
      return info;
    })(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: path.join(__dirname, "app.log"),
      level: "info",
    }),
    new winston.transports.Console({
      level: "info",
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(
          ({ timestamp, level, message }) =>
            `${timestamp} [${level.toUpperCase()}]: ${message}`
        )
      ),
    }),
    new TelegramLogger({
      token: config.TELEGRAM_TOKEN,
      chatId: config.TELEGRAM_CHAT_ID,
      level: "error",
      unique: true,
    }),
  ],
});

module.exports = logger;
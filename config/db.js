const mongoose = require('mongoose');
const config = require('./index');
const logger = require('./logger');

const connectDB = async () => {
    mongoose
        .connect(config.DB_URL)
        .then(() => {
            logger.info("Database connected successfully");
        })
        .catch((err) => {
            logger.error(`Database connection error: ${err.message}`);
        });
};

module.exports = connectDB;
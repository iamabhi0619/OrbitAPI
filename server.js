const express = require('express');
const path = require('path');
const config = require('./config');
const connectDB = require('./config/db');
const logger = require('./config/logger');
const { apiLimiter } = require('./config/rate-limiter');
const errorHandler = require('./middlewares/errorHandler');
const cors = require("cors");
const useCors = require('./config/cors');
const cookieParser = require("cookie-parser");


const app = express();

// Trust proxy - required when behind a reverse proxy (nginx, Heroku, Render, etc.)
app.set('trust proxy', 1);

// Middleware
app.use(express.json());
app.use(useCors);
// app.use(cors());
app.use(apiLimiter);
app.use(cookieParser());



// Serve index.html on the root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


app.use('/', require('./routes/router-v1'));

const PORT = config.PORT;



app.use(errorHandler)
app.listen(PORT, '0.0.0.0', async () => {
    try {
        //Pre setup
        await connectDB();
        logger.info(`Server started at port ${PORT} in ${config.NODE_ENV}`)
    } catch (error) {

        logger.error(error);
    }
});
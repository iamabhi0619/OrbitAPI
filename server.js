const express = require('express');
const path = require('path');
const config = require('./config');
const connectDB = require('./config/db');
const logger = require('./config/logger');
const cors = require('cors');
const { apiLimiter } = require('./config/rate-limiter');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(apiLimiter);




//Pre setup
connectDB();




// Serve index.html on the root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


app.use('/', require('./routes/router-v1'));

const PORT = config.PORT;



app.use(errorHandler)
app.listen(PORT, '0.0.0.0', () => {
    logger.info(`Server started at port ${PORT}`)
});
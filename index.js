require("dotenv").config();   // <-- IMPORTANT for .env

const express = require('express');
const app = express();
const studentRoutes = require('./routes/students.routes')
const connectDB = require('./config/database.js')
const auth = require('./middleware/auth.js')
const userRoutes = require('./routes/users.routes.js')
const { MulterError } = require('multer')
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit')
const helmet = require('helmet');

connectDB()

const PORT  = process.env.PORT || 3000;

const limiter = rateLimit({
    windowMs: 1000 * 60 * 15,  // <- 15 minutes
    max:5000,
    message: "Too many request from this IP, please try again later"
})


// parse application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: false }))

// parse application/json
app.use(express.json())

app.use('/uploads',express.static(path.join(__dirname,'uploads')))

app.use(cors())

app.use(helmet())

app.use(limiter)

app.use('/api/users', userRoutes)
app.use(auth)
app.use('/api/students', studentRoutes)

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
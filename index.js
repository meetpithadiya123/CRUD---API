require("dotenv").config();   // Load .env FIRST

const express = require('express');
const app = express();
const studentRoutes = require('./routes/students.routes');
const connectDB = require('./config/database.js');
const auth = require('./middleware/auth.js');
const userRoutes = require('./routes/users.routes.js');
const { MulterError } = require('multer');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

// ---------------------------------------------
// CONNECT DATABASE
// ---------------------------------------------
(async () => {
    try {
        await connectDB();
        console.log("✅ MongoDB Connected");
    } catch (error) {
        console.error("❌ Database connection failed:", error.message);
        process.exit(1);
    }
})();

// ---------------------------------------------
// CONFIG
// ---------------------------------------------
const PORT = process.env.PORT || 3000;

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5000,
    message: "Too many requests from this IP, try again later.",
});

// ---------------------------------------------
// MIDDLEWARE ORDER
// ---------------------------------------------
app.use(helmet());           // Security
app.use(limiter);            // Rate limiting
app.use(cors());             // CORS
app.use(express.json());     // JSON parser
app.use(express.urlencoded({ extended: false })); // Form data parser

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ---------------------------------------------
// ROUTES
// ---------------------------------------------
app.use('/api/users', userRoutes);  // No auth required
app.use(auth);                      // Protect all routes below
app.use('/api/students', studentRoutes);

// ---------------------------------------------
// GLOBAL MULTER ERROR HANDLING
// ---------------------------------------------
app.use((err, req, res, next) => {
    if (err instanceof MulterError) {
        return res.status(400).json({ success: false, message: err.message });
    }
    next(err);
});

// ---------------------------------------------
// START SERVER
// ---------------------------------------------
app.listen(PORT, () => {
    console.log(` Server running on port ${PORT}`);
});

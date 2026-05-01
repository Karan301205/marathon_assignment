const express = require('express');
const cors = require('cors');
const sequelize = require('./config/db');
const transactionRoutes = require('./routes/transactionRoutes');
const authRoutes = require('./routes/authRoutes');
const authMiddleware = require('./middleware/auth');

const app = express();

// 1. GLOBAL MIDDLEWARE (Must come first)
app.use(cors());
app.use(express.json()); // This fixes the 403/Body issue!

// 2. PUBLIC ROUTES
app.use('/api/auth', authRoutes); 

// 3. PROTECTED ROUTES
app.use('/api/transactions', authMiddleware, transactionRoutes);

const PORT = process.env.PORT || 5001;

sequelize.sync({ alter: true }).then(() => {
  console.log('Database Synced');
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
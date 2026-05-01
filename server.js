const express = require('express');
const cors = require('cors');
const sequelize = require('./config/db');
const transactionRoutes = require('./routes/transactionRoutes');
const authRoutes = require('./routes/authRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const budgetRoutes = require('./routes/budgetRoutes');
const authMiddleware = require('./middleware/auth');

const app = express();

const path = require('path');

// 1. GLOBAL MIDDLEWARE (Must come first)
app.use(cors());
app.use(express.json()); // This fixes the 403/Body issue!
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 2. PUBLIC ROUTES
app.use('/api/auth', authRoutes); 

// 3. PROTECTED ROUTES
app.use('/api/transactions', authMiddleware, transactionRoutes);
app.use('/api/categories', authMiddleware, categoryRoutes);
app.use('/api/budgets', authMiddleware, budgetRoutes);

const Transaction = require('./models/Transaction');
const Category = require('./models/Category');
const Budget = require('./models/Budget');

// Define Associations
Transaction.belongsTo(Category, { foreignKey: 'categoryId' });
Category.hasMany(Transaction, { foreignKey: 'categoryId' });
Budget.belongsTo(Category, { foreignKey: 'categoryId' });
Category.hasMany(Budget, { foreignKey: 'categoryId' });

const PORT = process.env.PORT || 5001;

sequelize.sync({ alter: true }).then(() => {
  console.log('Database Synced');
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
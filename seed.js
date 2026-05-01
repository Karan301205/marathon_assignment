const Category = require('./models/Category');
const sequelize = require('./config/db');

const seed = async () => {
  await sequelize.sync();
  const defaultCategories = [
    { name: 'Salary', type: 'income', userId: 1 },
    { name: 'Freelance', type: 'income', userId: 1 },
    { name: 'Food & Dining', type: 'expense', userId: 1 },
    { name: 'Rent', type: 'expense', userId: 1 },
    { name: 'Entertainment', type: 'expense', userId: 1 }
  ];

  await Category.bulkCreate(defaultCategories);
  console.log('Categories Seeded!');
  process.exit();
};

seed();
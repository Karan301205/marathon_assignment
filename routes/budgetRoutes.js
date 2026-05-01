const express = require('express');
const router = express.Router();
const Budget = require('../models/Budget');

// 1. GET ALL BUDGETS
router.get('/', async (req, res) => {
  try {
    const budgets = await Budget.findAll({
      where: { userId: req.user.id }
    });
    res.json(budgets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. SET/UPDATE BUDGET
router.post('/', async (req, res) => {
  try {
    const { amount, month, year, categoryId } = req.body;
    
    // Check if budget exists for this month/year/category
    let budget = await Budget.findOne({
      where: { userId: req.user.id, categoryId, month, year }
    });
    
    if (budget) {
      budget.amount = amount;
      await budget.save();
    } else {
      budget = await Budget.create({ amount, month, year, categoryId, userId: req.user.id });
    }
    
    res.status(201).json(budget);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;

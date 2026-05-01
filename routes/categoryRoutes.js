const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const Transaction = require('../models/Transaction');

// 1. GET ALL CATEGORIES
router.get('/', async (req, res) => {
  try {
    const categories = await Category.findAll({
      where: { userId: req.user.id }
    });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. ADD CATEGORY
router.post('/', async (req, res) => {
  try {
    const { name, type } = req.body;
    const category = await Category.create({ name, type, userId: req.user.id });
    res.status(201).json(category);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 3. DELETE CATEGORY WITH SAFETY CHECK
router.delete('/:id', async (req, res) => {
  try {
    // Check if category has transactions
    const hasTransactions = await Transaction.findOne({ where: { categoryId: req.params.id } });
    if (hasTransactions) {
      return res.status(400).json({ error: "Cannot delete category with existing transactions." });
    }

    const result = await Category.destroy({ where: { id: req.params.id, userId: req.user.id } });
    res.json({ message: result ? "Deleted successfully" : "Not found" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

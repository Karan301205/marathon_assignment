const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const Category = require('../models/Category');

// 1. ADD TRANSACTION
router.post('/', async (req, res) => {
  try {
    const { amount, description, date, categoryId } = req.body;
    
    // Logic: Handle Decimal Precision & ensure user ownership
    const transaction = await Transaction.create({
      amount, // Sequelize DECIMAL(12,2) handles the precision
      description,
      date,
      categoryId,
      userId: req.user.id // From authMiddleware
    });
    
    res.status(201).json(transaction);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 2. GET ALL TRANSACTIONS (With Category Details)
router.get('/', async (req, res) => {
  try {
    const transactions = await Transaction.findAll({
      where: { userId: req.user.id },
      include: [{ model: Category, attributes: ['name', 'type'] }],
      order: [['date', 'DESC']]
    });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. EDIT TRANSACTION
router.put('/:id', async (req, res) => {
  try {
    const transaction = await Transaction.findOne({ 
      where: { id: req.params.id, userId: req.user.id } 
    });
    
    if (!transaction) return res.status(404).json({ error: "Transaction not found" });
    
    await transaction.update(req.body);
    res.json(transaction);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 4. DELETE TRANSACTION
router.delete('/:id', async (req, res) => {
  try {
    const result = await Transaction.destroy({ 
      where: { id: req.params.id, userId: req.user.id } 
    });
    res.json({ message: result ? "Deleted successfully" : "Not found" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
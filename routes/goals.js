import express from 'express';
import Goal from '../models/Goal.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// Get all goals
router.get('/', async (req, res) => {
  try {
    const goals = await Goal.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(goals);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single goal
router.get('/:id', async (req, res) => {
  try {
    const goal = await Goal.findOne({ _id: req.params.id, user: req.user._id });
    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }
    res.json(goal);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create goal
router.post('/', async (req, res) => {
  try {
    const { title, description, type, target, period, deadline } = req.body;

    if (!title || !type || !target || !period || !deadline) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const goal = await Goal.create({
      user: req.user._id,
      title,
      description,
      type,
      target,
      period,
      deadline,
      current: 0,
      status: 'pending'
    });

    res.status(201).json(goal);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update goal
router.put('/:id', async (req, res) => {
  try {
    const goal = await Goal.findOne({ _id: req.params.id, user: req.user._id });
    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    const { title, description, type, target, current, period, deadline, status } = req.body;

    if (title) goal.title = title;
    if (description !== undefined) goal.description = description;
    if (type) goal.type = type;
    if (target) goal.target = target;
    if (current !== undefined) goal.current = current;
    if (period) goal.period = period;
    if (deadline) goal.deadline = deadline;
    if (status) goal.status = status;

    goal.updateStatus();
    await goal.save();

    res.json(goal);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete goal
router.delete('/:id', async (req, res) => {
  try {
    const goal = await Goal.findOne({ _id: req.params.id, user: req.user._id });
    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    await Goal.deleteOne({ _id: req.params.id });
    res.json({ message: 'Goal deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;

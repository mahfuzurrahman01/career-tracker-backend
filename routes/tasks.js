import express from 'express';
import Task from '../models/Task.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// Get all tasks
router.get('/', async (req, res) => {
  try {
    const { completed, priority } = req.query;
    const query = { user: req.user._id };
    
    if (completed !== undefined) {
      query.completed = completed === 'true';
    }
    if (priority) {
      query.priority = priority;
    }

    const tasks = await Task.find(query).sort({ 
      priority: -1, 
      dueDate: 1, 
      createdAt: -1 
    });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single task
router.get('/:id', async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user._id });
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create task
router.post('/', async (req, res) => {
  try {
    const { title, description, type, priority, dueDate } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Please provide a task title' });
    }

    const task = await Task.create({
      user: req.user._id,
      title,
      description,
      type: type || 'other',
      priority: priority || 'medium',
      dueDate,
      completed: false
    });

    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update task
router.put('/:id', async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user._id });
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const { title, description, type, priority, dueDate, completed } = req.body;

    if (title) task.title = title;
    if (description !== undefined) task.description = description;
    if (type) task.type = type;
    if (priority) task.priority = priority;
    if (dueDate !== undefined) task.dueDate = dueDate;
    if (completed !== undefined) {
      task.completed = completed;
      task.completedAt = completed ? new Date() : null;
    }

    await task.save();
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete task
router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user._id });
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    await Task.deleteOne({ _id: req.params.id });
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;

import express from 'express';
import JobApplication from '../models/JobApplication.js';
import Goal from '../models/Goal.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// Get all job applications
router.get('/', async (req, res) => {
  try {
    const applications = await JobApplication.find({ user: req.user._id })
      .sort({ dateApplied: -1 });
    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single job application
router.get('/:id', async (req, res) => {
  try {
    const application = await JobApplication.findOne({ 
      _id: req.params.id, 
      user: req.user._id 
    });
    if (!application) {
      return res.status(404).json({ message: 'Job application not found' });
    }
    res.json(application);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create job application
router.post('/', async (req, res) => {
  try {
    const { companyName, role, techStack, applicationLink, dateApplied, status, notes } = req.body;

    if (!companyName || !role) {
      return res.status(400).json({ message: 'Please provide company name and role' });
    }

    const application = await JobApplication.create({
      user: req.user._id,
      companyName,
      role,
      techStack: techStack || [],
      applicationLink,
      dateApplied: dateApplied || new Date(),
      status: status || 'applied',
      notes
    });

    // Update job application goals
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Update daily goals
    await Goal.updateMany(
      {
        user: req.user._id,
        type: 'job_application',
        period: 'daily',
        deadline: { $gte: today, $lt: tomorrow },
        status: { $ne: 'completed' }
      },
      { $inc: { current: 1 } }
    );

    // Update weekly goals
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    await Goal.updateMany(
      {
        user: req.user._id,
        type: 'job_application',
        period: 'weekly',
        deadline: { $gte: weekStart, $lt: weekEnd },
        status: { $ne: 'completed' }
      },
      { $inc: { current: 1 } }
    );

    // Update monthly goals
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 1);

    await Goal.updateMany(
      {
        user: req.user._id,
        type: 'job_application',
        period: 'monthly',
        deadline: { $gte: monthStart, $lt: monthEnd },
        status: { $ne: 'completed' }
      },
      { $inc: { current: 1 } }
    );

    // Update custom goals that are still active
    await Goal.updateMany(
      {
        user: req.user._id,
        type: 'job_application',
        period: 'custom',
        deadline: { $gte: today },
        status: { $ne: 'completed' }
      },
      { $inc: { current: 1 } }
    );

    // Update status for all affected goals
    const updatedGoals = await Goal.find({
      user: req.user._id,
      type: 'job_application',
      status: { $ne: 'completed' }
    });

    for (const goal of updatedGoals) {
      goal.updateStatus();
      await goal.save();
    }

    res.status(201).json(application);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update job application
router.put('/:id', async (req, res) => {
  try {
    const application = await JobApplication.findOne({ 
      _id: req.params.id, 
      user: req.user._id 
    });
    if (!application) {
      return res.status(404).json({ message: 'Job application not found' });
    }

    const { companyName, role, techStack, applicationLink, dateApplied, status, notes } = req.body;

    if (companyName) application.companyName = companyName;
    if (role) application.role = role;
    if (techStack !== undefined) application.techStack = techStack;
    if (applicationLink !== undefined) application.applicationLink = applicationLink;
    if (dateApplied) application.dateApplied = dateApplied;
    if (status) application.status = status;
    if (notes !== undefined) application.notes = notes;

    await application.save();
    res.json(application);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete job application
router.delete('/:id', async (req, res) => {
  try {
    const application = await JobApplication.findOne({ 
      _id: req.params.id, 
      user: req.user._id 
    });
    if (!application) {
      return res.status(404).json({ message: 'Job application not found' });
    }

    await JobApplication.deleteOne({ _id: req.params.id });
    res.json({ message: 'Job application deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;

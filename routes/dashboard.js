import express from 'express';
import JobApplication from '../models/JobApplication.js';
import Goal from '../models/Goal.js';
import Task from '../models/Task.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// Get dashboard stats
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user._id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Total jobs applied
    const totalJobsApplied = await JobApplication.countDocuments({ user: userId });

    // Today's applications
    const todayApplications = await JobApplication.countDocuments({
      user: userId,
      dateApplied: { $gte: today, $lt: tomorrow }
    });

    // Get today's daily goal
    const todayGoal = await Goal.findOne({
      user: userId,
      type: 'job_application',
      period: 'daily',
      deadline: { $gte: today, $lt: tomorrow }
    });

    const todayTarget = todayGoal ? todayGoal.target : 0;
    const todayAchieved = todayApplications;
    const remainingToday = Math.max(0, todayTarget - todayAchieved);

    // Calculate streak (consecutive days goals met)
    let streak = 0;
    const dailyGoals = await Goal.find({
      user: userId,
      type: 'job_application',
      period: 'daily',
      status: 'completed'
    }).sort({ deadline: -1 });

    // Simple streak calculation - check last completed goals
    for (let i = 0; i < dailyGoals.length; i++) {
      const goalDate = new Date(dailyGoals[i].deadline);
      goalDate.setHours(0, 0, 0, 0);
      const expectedDate = new Date(today);
      expectedDate.setDate(today.getDate() - i);
      expectedDate.setHours(0, 0, 0, 0);

      if (goalDate.getTime() === expectedDate.getTime()) {
        streak++;
      } else {
        break;
      }
    }

    // Overall progress percentage (based on active goals)
    const activeGoals = await Goal.find({
      user: userId,
      status: { $ne: 'completed' }
    });

    let totalProgress = 0;
    if (activeGoals.length > 0) {
      activeGoals.forEach(goal => {
        const progress = Math.min(100, (goal.current / goal.target) * 100);
        totalProgress += progress;
      });
      totalProgress = Math.round(totalProgress / activeGoals.length);
    }

    // Get next best action (highest priority incomplete task)
    const nextTask = await Task.findOne({
      user: userId,
      completed: false
    }).sort({ priority: -1, dueDate: 1 });

    // Get active goals count
    const activeGoalsCount = activeGoals.length;
    const completedGoalsCount = await Goal.countDocuments({
      user: userId,
      status: 'completed'
    });

    // Get applications by status
    const applicationsByStatus = await JobApplication.aggregate([
      { $match: { user: userId } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    res.json({
      totalJobsApplied,
      todayTarget,
      todayAchieved,
      remainingToday,
      streak,
      overallProgress: totalProgress,
      activeGoalsCount,
      completedGoalsCount,
      nextTask: nextTask || null,
      applicationsByStatus: applicationsByStatus.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {})
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get progress over time (for charts)
router.get('/progress', async (req, res) => {
  try {
    const userId = req.user._id;
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Get applications grouped by date
    const applicationsByDate = await JobApplication.aggregate([
      {
        $match: {
          user: userId,
          dateApplied: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$dateApplied' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json(applicationsByDate);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;

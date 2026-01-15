import express from 'express';
import Skill from '../models/Skill.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// Get all skills
router.get('/', async (req, res) => {
  try {
    const skills = await Skill.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(skills);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single skill
router.get('/:id', async (req, res) => {
  try {
    const skill = await Skill.findOne({ _id: req.params.id, user: req.user._id });
    if (!skill) {
      return res.status(404).json({ message: 'Skill not found' });
    }
    res.json(skill);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create skill
router.post('/', async (req, res) => {
  try {
    const { name, category, proficiency, isLearning, notes } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Please provide a skill name' });
    }

    const skill = await Skill.create({
      user: req.user._id,
      name,
      category: category || 'other',
      proficiency: proficiency || 'Beginner',
      isLearning: isLearning || false,
      notes
    });

    res.status(201).json(skill);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update skill
router.put('/:id', async (req, res) => {
  try {
    const skill = await Skill.findOne({ _id: req.params.id, user: req.user._id });
    if (!skill) {
      return res.status(404).json({ message: 'Skill not found' });
    }

    const { name, category, proficiency, isLearning, notes } = req.body;

    if (name) skill.name = name;
    if (category) skill.category = category;
    if (proficiency) skill.proficiency = proficiency;
    if (isLearning !== undefined) skill.isLearning = isLearning;
    if (notes !== undefined) skill.notes = notes;

    await skill.save();
    res.json(skill);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete skill
router.delete('/:id', async (req, res) => {
  try {
    const skill = await Skill.findOne({ _id: req.params.id, user: req.user._id });
    if (!skill) {
      return res.status(404).json({ message: 'Skill not found' });
    }

    await Skill.deleteOne({ _id: req.params.id });
    res.json({ message: 'Skill deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;

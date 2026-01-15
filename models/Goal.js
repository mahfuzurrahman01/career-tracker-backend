import mongoose from 'mongoose';

const goalSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Please provide a goal title'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    enum: ['job_application', 'learning', 'skill', 'other'],
    required: true
  },
  target: {
    type: Number,
    required: true,
    min: 1
  },
  current: {
    type: Number,
    default: 0,
    min: 0
  },
  period: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'custom'],
    required: true
  },
  deadline: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed'],
    default: 'pending'
  },
  completedAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Calculate progress percentage
goalSchema.virtual('progressPercentage').get(function() {
  return Math.min(100, Math.round((this.current / this.target) * 100));
});

// Include virtuals in JSON
goalSchema.set('toJSON', { virtuals: true });

// Auto-update status based on progress
goalSchema.methods.updateStatus = function() {
  if (this.current >= this.target) {
    this.status = 'completed';
    if (!this.completedAt) {
      this.completedAt = new Date();
    }
  } else if (this.current > 0) {
    this.status = 'in_progress';
  }
  return this;
};

export default mongoose.model('Goal', goalSchema);

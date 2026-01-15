import mongoose from 'mongoose';

const jobApplicationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  companyName: {
    type: String,
    required: [true, 'Please provide a company name'],
    trim: true
  },
  role: {
    type: String,
    required: [true, 'Please provide a role'],
    trim: true
  },
  techStack: [{
    type: String,
    trim: true
  }],
  applicationLink: {
    type: String,
    trim: true
  },
  dateApplied: {
    type: Date,
    required: true,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['applied', 'interview', 'rejected', 'offer'],
    default: 'applied'
  },
  notes: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('JobApplication', jobApplicationSchema);

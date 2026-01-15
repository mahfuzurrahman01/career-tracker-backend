import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/career-tracker');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    process.exit(1);
  }
};

// Fix database indexes
const fixDatabase = async () => {
  try {
    await connectDB();
    
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    
    // Get all indexes
    const indexes = await usersCollection.indexes();
    console.log('Current indexes:', indexes);
    
    // Drop the old userName index if it exists
    try {
      await usersCollection.dropIndex('userName_1');
      console.log('✓ Dropped old userName_1 index');
    } catch (err) {
      if (err.code === 27) {
        console.log('✓ userName_1 index does not exist (already cleaned)');
      } else {
        console.log('Error dropping userName_1 index:', err.message);
      }
    }
    
    // Ensure email index exists
    try {
      await usersCollection.createIndex({ email: 1 }, { unique: true });
      console.log('✓ Created email unique index');
    } catch (err) {
      console.log('Email index already exists or error:', err.message);
    }
    
    console.log('\n✓ Database indexes fixed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error fixing database:', error);
    process.exit(1);
  }
};

fixDatabase();

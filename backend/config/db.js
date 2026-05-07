const mongoose = require('mongoose');

const connectDb = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/comp5347_a2_quiz_game';

  mongoose.set('strictQuery', true);
  await mongoose.connect(uri);
  console.log('MongoDB connected');
};

module.exports = connectDb;

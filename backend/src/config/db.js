// Subsystem D - Integration, Robustness & Documentation (Tom Tian):
// MongoDB connection setup used by the server startup path.
const mongoose = require('mongoose');

const DEFAULT_MONGODB_URI = 'mongodb://localhost:27017/comp5347_quiz';

async function connectDB(uri = process.env.MONGODB_URI || DEFAULT_MONGODB_URI) {
  mongoose.set('strictQuery', true);

  try {
    const connection = await mongoose.connect(uri);
    console.log(`MongoDB connected: ${connection.connection.host}`);
    return connection;
  } catch (error) {
    console.error(`MongoDB connection failed: ${error.message}`);
    throw error;
  }
}

async function disconnectDB() {
  await mongoose.disconnect();
}

module.exports = connectDB;
module.exports.connectDB = connectDB;
module.exports.disconnectDB = disconnectDB;
module.exports.DEFAULT_MONGODB_URI = DEFAULT_MONGODB_URI;

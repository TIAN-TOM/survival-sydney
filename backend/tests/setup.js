const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongo;

const startTestDb = async () => {
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
  process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '2h';
  process.env.BCRYPT_ROUNDS = '4';
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
};

const stopTestDb = async () => {
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
};

const clearTestDb = async () => {
  for (const key of Object.keys(mongoose.connection.collections)) {
    await mongoose.connection.collections[key].deleteMany({});
  }
};

module.exports = { startTestDb, stopTestDb, clearTestDb };

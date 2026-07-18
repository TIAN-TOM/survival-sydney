// Subsystem D - Integration, Robustness & Documentation (Tom Tian):
// MongoDB connection setup used by the server startup path.
import mongoose from 'mongoose';

const DEFAULT_MONGODB_URI = 'mongodb://localhost:27017/survival_sydney';

async function connectDB(
  uri: string = process.env.MONGODB_URI || DEFAULT_MONGODB_URI
): Promise<typeof mongoose> {
  if (!process.env.MONGODB_URI) {
    console.warn(
      `MONGODB_URI is not set; falling back to ${DEFAULT_MONGODB_URI}. Set it explicitly in production.`
    );
  }

  mongoose.set('strictQuery', true);

  try {
    const connection = await mongoose.connect(uri);
    console.log(`MongoDB connected: ${connection.connection.host}`);
    return connection;
  } catch (error) {
    console.error(`MongoDB connection failed: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
}

export default connectDB;
export { connectDB, disconnectDB, DEFAULT_MONGODB_URI };

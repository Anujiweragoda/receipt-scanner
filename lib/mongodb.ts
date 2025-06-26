
import mongoose from 'mongoose';


const MONGODB_URI = process.env.MONGODB_URI as string; 

if (!MONGODB_URI) {
  
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local or .env');
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents creating new connections every time HMR updates.
 */
interface CachedMongoose {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

let cached = global as typeof global & {
  mongoose?: CachedMongoose;
};


async function dbConnect() {
  if (!cached.mongoose) {
    cached.mongoose = { conn: null, promise: null };
  }

  const mongooseCache = cached.mongoose;


  if (mongooseCache.conn) {
    return mongooseCache.conn;
  }

  if (!mongooseCache.promise) {
    const opts = {
      bufferCommands: false,
    };

    
    mongooseCache.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log('MongoDB Connected!');
      return mongoose;
    });
  }
  mongooseCache.conn = await mongooseCache.promise;
  return mongooseCache.conn;
}

export default dbConnect;
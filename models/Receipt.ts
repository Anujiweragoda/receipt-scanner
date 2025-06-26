// models/Receipt.ts
import mongoose, { Document, Model, Schema } from 'mongoose';

// Define the interface for the Receipt document
export interface IReceipt extends Document {
  vendor: string;
  date: Date;
  total: number;
  rawText: string;
  imageUrl?: string; // Optional: stores the Base64 string of the image (NOT ideal for production)
  createdAt: Date;
}

// Define the Mongoose Schema
const ReceiptSchema: Schema<IReceipt> = new Schema({
  vendor: { type: String, required: true },
  date: { type: Date, required: true },
  total: { type: Number, required: true },
  rawText: { type: String, required: true },
  imageUrl: { type: String }, // Storing Base64 here for demo
  createdAt: {
    type: Date,
    default: Date.now, // Automatically set creation timestamp
  },
});

// Create and export the Mongoose Model.
// Use `mongoose.models.Receipt` to prevent re-compilation of the model in Next.js dev mode.
const Receipt: Model<IReceipt> = mongoose.models.Receipt || mongoose.model<IReceipt>('Receipt', ReceiptSchema);

export default Receipt;
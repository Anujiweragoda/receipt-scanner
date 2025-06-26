// models/Expense.ts
import mongoose, { Document, Model, Schema } from 'mongoose';

// Define expense categories
export enum ExpenseCategory {
  FOOD_DINING = 'Food & Dining',
  GROCERIES = 'Groceries',
  TRANSPORTATION = 'Transportation',
  UTILITIES = 'Utilities',
  ENTERTAINMENT = 'Entertainment',
  HEALTHCARE = 'Healthcare',
  SHOPPING = 'Shopping',
  TRAVEL = 'Travel',
  EDUCATION = 'Education',
  BUSINESS = 'Business',
  HOME_MAINTENANCE = 'Home & Maintenance',
  SUBSCRIPTIONS = 'Subscriptions',
  INSURANCE = 'Insurance',
  TAXES = 'Taxes',
  GIFTS_DONATIONS = 'Gifts & Donations',
  PERSONAL_CARE = 'Personal Care',
  OTHER = 'Other'
}

// Define payment methods
export enum PaymentMethod {
  CASH = 'Cash',
  CREDIT_CARD = 'Credit Card',
  DEBIT_CARD = 'Debit Card',
  BANK_TRANSFER = 'Bank Transfer',
  DIGITAL_WALLET = 'Digital Wallet',
  CHECK = 'Check',
  OTHER = 'Other'
}

// Define expense types
export enum ExpenseType {
  PERSONAL = 'Personal',
  BUSINESS = 'Business',
  TAX_DEDUCTIBLE = 'Tax Deductible'
}

// Interface for individual line items
export interface ILineItem {
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  category?: string;
}

// Define the interface for the Expense document
export interface IExpense extends Document {
  // Basic receipt information
  vendor: string;
  vendorAddress?: string;
  vendorPhone?: string;
  date: Date;
  receiptNumber?: string;
  
  // Financial details
  subtotal: number;
  tax: number;
  tip?: number;
  discount?: number;
  total: number;
  currency: string;
  
  // Categorization
  category: ExpenseCategory;
  subcategory?: string;
  paymentMethod: PaymentMethod;
  expenseType: ExpenseType;
  
  // Line items (detailed breakdown)
  lineItems: ILineItem[];
  
  // Additional metadata
  description?: string;
  notes?: string;
  tags: string[];
  isRecurring: boolean;
  recurringFrequency?: string; // 'monthly', 'weekly', 'yearly'
  
  // Receipt data
  rawText: string;
  imageUrl?: string;
  confidence: number; // OCR confidence score (0-1)
  
  // Business/Tax related
  isBusinessExpense: boolean;
  isTaxDeductible: boolean;
  projectId?: string; // For business expense tracking
  clientId?: string;
  
  // System fields
  source: 'scan' | 'manual';
  createdAt: Date;
  updatedAt: Date;
}

// Define the Mongoose Schema
const LineItemSchema = new Schema({
  name: { type: String, required: true },
  quantity: { type: Number, required: true, default: 1 },
  unitPrice: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
  category: { type: String }
}, { _id: false });

const ExpenseSchema: Schema<IExpense> = new Schema({
  // Basic receipt information
  vendor: { type: String, required: true },
  vendorAddress: { type: String },
  vendorPhone: { type: String },
  date: { type: Date, required: true },
  receiptNumber: { type: String },
  
  // Financial details
  subtotal: { type: Number, required: true, min: 0 },
  tax: { type: Number, required: true, min: 0, default: 0 },
  tip: { type: Number, min: 0 },
  discount: { type: Number, min: 0 },
  total: { type: Number, required: true, min: 0 },
  currency: { type: String, required: true, default: 'USD' },
  
  // Categorization
  category: { 
    type: String, 
    enum: Object.values(ExpenseCategory),
    required: true,
    default: ExpenseCategory.OTHER
  },
  subcategory: { type: String },
  paymentMethod: { 
    type: String, 
    enum: Object.values(PaymentMethod),
    required: true,
    default: PaymentMethod.OTHER
  },
  expenseType: { 
    type: String, 
    enum: Object.values(ExpenseType),
    required: true,
    default: ExpenseType.PERSONAL
  },
  
  // Line items
  lineItems: [LineItemSchema],
  
  // Additional metadata
  description: { type: String },
  notes: { type: String },
  tags: [{ type: String }],
  isRecurring: { type: Boolean, default: false },
  recurringFrequency: { type: String },
  
  // Receipt data
  rawText: { type: String, required: true },
  imageUrl: { type: String },
  confidence: { type: Number, min: 0, max: 1, default: 0 },
  
  // Business/Tax related
  isBusinessExpense: { type: Boolean, default: false },
  isTaxDeductible: { type: Boolean, default: false },
  projectId: { type: String },
  clientId: { type: String },
  
  // System fields
  source: { type: String, enum: ['scan', 'manual'], required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Add indexes for better query performance
ExpenseSchema.index({ date: -1 });
ExpenseSchema.index({ category: 1 });
ExpenseSchema.index({ vendor: 1 });
ExpenseSchema.index({ isBusinessExpense: 1 });
ExpenseSchema.index({ isTaxDeductible: 1 });

// Update the updatedAt field before saving
ExpenseSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Create and export the Mongoose Model
const Expense: Model<IExpense> = mongoose.models.Expense || mongoose.model<IExpense>('Expense', ExpenseSchema);

export default Expense;
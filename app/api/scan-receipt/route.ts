import { NextResponse } from 'next/server';
import dbConnect from '../../../lib/mongodb';
import Expense, { ExpenseCategory, PaymentMethod, ExpenseType, ILineItem } from '../../../models/Expense';

// --- Next.js API Route Configuration ---
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '4mb',
    },
  },
};

/**
 * Handles GET requests to fetch all expenses
 */
export async function GET() {
  try {
    await dbConnect();
    
    // Fetch all expenses, sorted by date (most recent first)
    const expenses = await Expense.find({})
      .sort({ date: -1 })
      .lean(); // Use lean() for better performance when just reading data

    return NextResponse.json(expenses, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching expenses:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch expenses.' },
      { status: 500 }
    );
  }
}

/**
 * Enhanced Gemini analysis for comprehensive expense data extraction
 */
async function analyzeReceiptWithGemini(base64ImageData: string): Promise<{
  vendor: string;
  vendorAddress?: string;
  vendorPhone?: string;
  date: string;
  receiptNumber?: string;
  subtotal: number;
  tax: number;
  tip?: number;
  discount?: number;
  total: number;
  currency: string;
  category: ExpenseCategory;
  paymentMethod: PaymentMethod;
  lineItems: ILineItem[];
  rawText: string;
  confidence: number;
}> {
  const geminiApiKey = process.env.GEMINI_API_KEY;

  if (!geminiApiKey) {
    throw new Error('GEMINI_API_KEY is not defined');
  }

  const prompt = `
    Analyze this receipt image and extract comprehensive information. Return the data in this exact JSON format:

    {
      "vendor": "[store/restaurant name]",
      "vendorAddress": "[address if visible]",
      "vendorPhone": "[phone if visible]",
      "date": "[YYYY-MM-DD format]",
      "receiptNumber": "[receipt/transaction number if visible]",
      "subtotal": [subtotal amount as number],
      "tax": [tax amount as number],
      "tip": [tip amount as number or null],
      "discount": [discount amount as number or null],
      "total": [total amount as number],
      "currency": "[currency code, default USD]",
      "category": "[categorize as one of: Food & Dining, Groceries, Transportation, Utilities, Entertainment, Healthcare, Shopping, Travel, Education, Business, Home & Maintenance, Subscriptions, Insurance, Taxes, Gifts & Donations, Personal Care, Other]",
      "paymentMethod": "[Credit Card, Debit Card, Cash, Bank Transfer, Digital Wallet, Check, or Other]",
      "lineItems": [
        {
          "name": "[item name]",
          "quantity": [quantity as number],
          "unitPrice": [price per unit as number],
          "totalPrice": [total for this item as number]
        }
      ],
      "rawText": "[all visible text from receipt]",
      "confidence": [confidence score 0.0-1.0 for OCR accuracy]
    }
  `;

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [
          { text: prompt },
          { inline_data: { mime_type: 'image/jpeg', data: base64ImageData } }
        ]
      }]
    })
  });

  if (!response.ok) {
    throw new Error(`Gemini API request failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

  try {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsedData = JSON.parse(jsonMatch[0]);
      
      return {
        vendor: parsedData.vendor || 'Unknown Vendor',
        vendorAddress: parsedData.vendorAddress || undefined,
        vendorPhone: parsedData.vendorPhone || undefined,
        date: parsedData.date || new Date().toISOString().split('T')[0],
        receiptNumber: parsedData.receiptNumber || undefined,
        subtotal: parseFloat(parsedData.subtotal) || 0,
        tax: parseFloat(parsedData.tax) || 0,
        tip: parsedData.tip ? parseFloat(parsedData.tip) : undefined,
        discount: parsedData.discount ? parseFloat(parsedData.discount) : undefined,
        total: parseFloat(parsedData.total) || 0,
        currency: parsedData.currency || 'USD',
        category: Object.values(ExpenseCategory).includes(parsedData.category)
          ? parsedData.category
          : ExpenseCategory.OTHER,
        paymentMethod: Object.values(PaymentMethod).includes(parsedData.paymentMethod)
          ? parsedData.paymentMethod
          : PaymentMethod.OTHER,
        lineItems: Array.isArray(parsedData.lineItems) ? parsedData.lineItems.map((item: any) => ({
          name: item.name || 'Unknown Item',
          quantity: parseFloat(item.quantity) || 1,
          unitPrice: parseFloat(item.unitPrice) || 0,
          totalPrice: parseFloat(item.totalPrice) || 0
        })) : [],
        rawText: parsedData.rawText || responseText,
        confidence: Math.min(Math.max(parseFloat(parsedData.confidence) || 0.5, 0), 1)
      };
    }
  } catch (parseError) {
    console.warn('Failed to parse JSON response, using fallback parsing');
  }

  const vendorMatch = responseText.match(/(?:vendor|store):\s*(.+)/i);
  const dateMatch = responseText.match(/date:\s*(.+)/i);
  const totalMatch = responseText.match(/total:\s*([0-9.]+)/i);

  return {
    vendor: vendorMatch ? vendorMatch[1].trim() : 'Unknown Vendor',
    date: dateMatch ? dateMatch[1].trim() : new Date().toISOString().split('T')[0],
    subtotal: 0,
    tax: 0,
    total: totalMatch ? parseFloat(totalMatch[1]) : 0,
    currency: 'USD',
    category: ExpenseCategory.OTHER,
    paymentMethod: PaymentMethod.OTHER,
    lineItems: [],
    rawText: responseText,
    confidence: 0.3
  };
}

/**
 * Handles POST requests to the /api/scan-receipt endpoint.
 */
export async function POST(request: Request) {
  await dbConnect();
  const body = await request.json();

  const isManual = body.manual === true;

  if (isManual) {
    // Manual expense saving
    try {
      const newExpense = await Expense.create({
        vendor: body.vendor || 'Manual Entry',
        vendorAddress: body.vendorAddress || '',
        vendorPhone: body.vendorPhone || '',
        date: new Date(body.date),
        receiptNumber: body.receiptNumber || '',
        subtotal: parseFloat(body.subtotal) || 0,
        tax: parseFloat(body.tax) || 0,
        tip: parseFloat(body.tip) || 0,
        discount: parseFloat(body.discount) || 0,
        total: parseFloat(body.total) || 0,
        currency: body.currency || 'USD',
        category: body.category || ExpenseCategory.OTHER,
        paymentMethod: body.paymentMethod || PaymentMethod.OTHER,
        expenseType: ExpenseType.PERSONAL,
        lineItems: body.lineItems || [],
        notes: body.notes || '',
        description: body.description || '',
        tags: body.tags || [],
        isRecurring: body.isRecurring || false,
        recurringFrequency: body.recurringFrequency || '',
        rawText: body.rawText || '',
        imageUrl: body.imageUrl || '',
        confidence: 1,
        isBusinessExpense: body.isBusinessExpense || false,
        isTaxDeductible: body.isTaxDeductible || false,
        projectId: body.projectId || '',
        clientId: body.clientId || '',
        source: 'manual',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      return NextResponse.json({ success: true, data: newExpense }, { status: 201 });

    } catch (err) {
      console.error('Manual save error:', err);
      return NextResponse.json({ success: false, message: 'Failed to save manual entry.' }, { status: 500 });
    }
  }

  // --- SCANNED RECEIPT FLOW ---
  const { imageUrl } = body;
  if (!imageUrl) {
    return NextResponse.json({ success: false, message: 'No image data provided.' }, { status: 400 });
  }

  const base64ImageData = imageUrl.split(',')[1];

  try {
    const extractedData = await analyzeReceiptWithGemini(base64ImageData);

    const newExpense = await Expense.create({
      vendor: extractedData.vendor,
      vendorAddress: extractedData.vendorAddress,
      vendorPhone: extractedData.vendorPhone,
      date: new Date(extractedData.date),
      receiptNumber: extractedData.receiptNumber,
      subtotal: extractedData.subtotal,
      tax: extractedData.tax,
      tip: extractedData.tip,
      discount: extractedData.discount,
      total: extractedData.total,
      currency: extractedData.currency,
      category: extractedData.category,
      paymentMethod: extractedData.paymentMethod,
      expenseType: ExpenseType.PERSONAL,
      lineItems: extractedData.lineItems,
      tags: [],
      isRecurring: false,
      rawText: extractedData.rawText,
      imageUrl: imageUrl,
      confidence: extractedData.confidence,
      isBusinessExpense: false,
      isTaxDeductible: false,
      source: 'scan',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return NextResponse.json({ success: true, data: newExpense }, { status: 201 });

  } catch (error: any) {
    console.error('Scan processing error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to process receipt.' },
      { status: 500 }
    );
  }
}
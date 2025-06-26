

import { NextResponse } from 'next/server';
import dbConnect from '../../../lib/mongodb';
import Receipt from '../../../models/Receipt';

// --- Next.js API Route Configuration ---
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '4mb',
    },
  },
};

/**
 * Call Gemini API for image analysis and text extraction
 */
async function analyzeReceiptWithGemini(base64ImageData: string): Promise<{ vendor: string; date: string; total: number; rawText: string }> {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  
  if (!geminiApiKey) {
    throw new Error('GEMINI_API_KEY is not defined');
  }

  const prompt = `
    Analyze this receipt image and extract the following information:
    1. Vendor/Store name
    2. Date of purchase (format as YYYY-MM-DD)
    3. Total amount (as a number)

    Return the information in this exact format:
    VENDOR: [store name]
    DATE: [YYYY-MM-DD]
    TOTAL: [amount as number]
    RAWTEXT: [all text you can see in the image]

    If you cannot find specific information, use:
    - VENDOR: Unknown Vendor
    - DATE: ${new Date().getFullYear()}-01-01
    - TOTAL: 0.00
  `;

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [
          {
            text: prompt
          },
          {
            inline_data: {
              mime_type: "image/jpeg",
              data: base64ImageData
            }
          }
        ]
      }]
    })
  });

  if (!response.ok) {
    throw new Error(`Gemini API request failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

  // Parse the structured response
  const vendorMatch = responseText.match(/VENDOR:\s*(.+)/);
  const dateMatch = responseText.match(/DATE:\s*(.+)/);
  const totalMatch = responseText.match(/TOTAL:\s*(.+)/);
  const rawTextMatch = responseText.match(/RAWTEXT:\s*([\s\S]*)/);

  const vendor = vendorMatch ? vendorMatch[1].trim() : 'Unknown Vendor';
  const dateStr = dateMatch ? dateMatch[1].trim() : `${new Date().getFullYear()}-01-01`;
  const totalStr = totalMatch ? totalMatch[1].trim() : '0.00';
  const rawText = rawTextMatch ? rawTextMatch[1].trim() : responseText;

  return {
    vendor,
    date: dateStr,
    total: parseFloat(totalStr) || 0.00,
    rawText
  };
}

/**
 * Handles POST requests to the /api/scan-receipt endpoint.
 */
export async function POST(request: Request) {
  // Ensure database connection is established
  await dbConnect();

  // Extract imageUrl (Base64 string) from the request body
  const { imageUrl } = await request.json();

  if (!imageUrl) {
    return NextResponse.json({ success: false, message: 'No image data provided.' }, { status: 400 });
  }

  // Check for Gemini API key
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { success: false, message: 'Gemini API key is not configured.' },
      { status: 500 }
    );
  }

  // Extract Base64 data without the data URL prefix
  const base64ImageData = imageUrl.split(',')[1];

  try {
    // Analyze receipt with Gemini
    const extractedData = await analyzeReceiptWithGemini(base64ImageData);
    
    console.log('Extracted data:', extractedData);

    // Save to MongoDB
    const newReceipt = await Receipt.create({
      vendor: extractedData.vendor,
      date: new Date(extractedData.date),
      total: extractedData.total,
      rawText: extractedData.rawText,
      imageUrl: imageUrl, // Store the full data URL
      createdAt: new Date(),
    });

    // Return success response
    return NextResponse.json({ 
      success: true, 
      data: newReceipt 
    }, { status: 201 });

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to process receipt. Please try again.' },
      { status: 500 }
    );
  }
}
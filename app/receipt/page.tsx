// app/page.tsx
'use client';

import { useState } from 'react';
import Image from 'next/image';

// Define types matching the Expense model
interface LineItem {
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  category?: string;
}

interface ExpenseData {
  _id: string;
  // Basic receipt information
  vendor: string;
  vendorAddress?: string;
  vendorPhone?: string;
  date: string;
  receiptNumber?: string;
  
  // Financial details
  subtotal: number;
  tax: number;
  tip?: number;
  discount?: number;
  total: number;
  currency: string;
  
  // Categorization
  category: string;
  subcategory?: string;
  paymentMethod: string;
  expenseType: string;
  
  // Line items
  lineItems: LineItem[];
  
  // Additional metadata
  description?: string;
  notes?: string;
  tags: string[];
  isRecurring: boolean;
  recurringFrequency?: string;
  
  // Receipt data
  rawText: string;
  imageUrl?: string;
  confidence: number;
  
  // Business/Tax related
  isBusinessExpense: boolean;
  isTaxDeductible: boolean;
  projectId?: string;
  clientId?: string;
  
  // System fields
  source: string;
  createdAt: string;
  updatedAt: string;
}

export default function Home() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [scanResult, setScanResult] = useState<ExpenseData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setImageFile(event.target.files[0]);
      setScanResult(null);
      setError(null);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!imageFile) {
      alert('Please select an image file first.');
      return;
    }

    setLoading(true);
    setError(null);

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Image = reader.result as string;

      try {
        const response = await fetch('/api/scan-receipt', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ imageUrl: base64Image }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          setScanResult(data.data);
        } else {
          setError(data.message || 'Failed to scan receipt.');
        }
      } catch (err: any) {
        console.error('Frontend Fetch Error:', err);
        setError('Network error or server unavailable.');
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(imageFile);
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceText = (confidence: number) => {
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.6) return 'Medium';
    return 'Low';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-600 to-teal-500 flex flex-col items-center justify-center p-4">
      <h1 className="text-6xl font-extrabold text-white mb-12 drop-shadow-2xl text-center">
        Smart Expense Scanner
      </h1>

      <form
        onSubmit={handleSubmit}
        className="bg-white/95 backdrop-blur-sm p-10 rounded-3xl shadow-2xl max-w-lg w-full transform transition-all duration-300 hover:scale-105 border border-white/20"
      >
        <div className="mb-8">
          <label htmlFor="receiptImage" className="block text-gray-800 text-xl font-bold mb-4">
            Upload Receipt Image:
          </label>
          <input
            type="file"
            id="receiptImage"
            accept="image/*"
            onChange={handleFileChange}
            className="block w-full text-gray-700
              file:mr-4 file:py-3 file:px-6
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-gradient-to-r file:from-blue-50 file:to-purple-50
              file:text-purple-700 hover:file:from-blue-100 hover:file:to-purple-100
              file:transition-all file:duration-200 file:cursor-pointer"
          />
          {imageFile && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
              <strong>Selected:</strong> {imageFile.name} ({(imageFile.size / 1024).toFixed(2)} KB)
            </div>
          )}
        </div>
        <button
          type="submit"
          className={`w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 
            text-white font-bold py-4 px-8 rounded-full transition-all duration-300 
            focus:outline-none focus:ring-4 focus:ring-purple-300 transform hover:scale-105
            ${loading ? 'opacity-70 cursor-not-allowed scale-100' : 'shadow-xl'}`}
          disabled={loading}
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
              Analyzing Receipt...
            </div>
          ) : (
            'Scan & Analyze Receipt'
          )}
        </button>
      </form>

      {error && (
        <div className="mt-8 bg-red-100/90 backdrop-blur-sm border border-red-400 text-red-700 px-6 py-4 rounded-2xl max-w-lg w-full shadow-lg">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline ml-2">{error}</span>
        </div>
      )}

      {scanResult && (
        <div className="mt-8 bg-white/95 backdrop-blur-sm p-8 rounded-3xl shadow-2xl max-w-4xl w-full border border-white/20">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-4xl font-bold text-gray-800">Expense Analysis</h2>
            <div className="text-right">
              <div className={`text-sm font-medium ${getConfidenceColor(scanResult.confidence)}`}>
                Confidence: {getConfidenceText(scanResult.confidence)} ({(scanResult.confidence * 100).toFixed(0)}%)
              </div>
              <div className="text-xs text-gray-500 mt-1">Source: {scanResult.source}</div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Left Column - Basic Info */}
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-2xl">
                <h3 className="text-2xl font-bold text-gray-800 mb-4">Vendor Information</h3>
                <div className="space-y-2">
                  <p className="text-gray-700">
                    <strong>Name:</strong> {scanResult.vendor}
                  </p>
                  {scanResult.vendorAddress && (
                    <p className="text-gray-700">
                      <strong>Address:</strong> {scanResult.vendorAddress}
                    </p>
                  )}
                  {scanResult.vendorPhone && (
                    <p className="text-gray-700">
                      <strong>Phone:</strong> {scanResult.vendorPhone}
                    </p>
                  )}
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-teal-50 p-6 rounded-2xl">
                <h3 className="text-2xl font-bold text-gray-800 mb-4">Transaction Details</h3>
                <div className="space-y-2">
                  <p className="text-gray-700">
                    <strong>Date:</strong> {new Date(scanResult.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                  {scanResult.receiptNumber && (
                    <p className="text-gray-700">
                      <strong>Receipt #:</strong> {scanResult.receiptNumber}
                    </p>
                  )}
                  <p className="text-gray-700">
                    <strong>Category:</strong> {scanResult.category}
                  </p>
                  <p className="text-gray-700">
                    <strong>Payment Method:</strong> {scanResult.paymentMethod}
                  </p>
                  <p className="text-gray-700">
                    <strong>Type:</strong> {scanResult.expenseType}
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column - Financial Details */}
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-2xl">
                <h3 className="text-2xl font-bold text-gray-800 mb-4">Financial Breakdown</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Subtotal:</span>
                    <span className="font-semibold">{formatCurrency(scanResult.subtotal, scanResult.currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Tax:</span>
                    <span className="font-semibold">{formatCurrency(scanResult.tax, scanResult.currency)}</span>
                  </div>
                  {scanResult.tip && scanResult.tip > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-700">Tip:</span>
                      <span className="font-semibold">{formatCurrency(scanResult.tip, scanResult.currency)}</span>
                    </div>
                  )}
                  {scanResult.discount && scanResult.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount:</span>
                      <span className="font-semibold">-{formatCurrency(scanResult.discount, scanResult.currency)}</span>
                    </div>
                  )}
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between text-lg font-bold">
                      <span className="text-gray-800">Total:</span>
                      <span className="text-blue-600">{formatCurrency(scanResult.total, scanResult.currency)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Line Items */}
              {scanResult.lineItems && scanResult.lineItems.length > 0 && (
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-2xl">
                  <h3 className="text-2xl font-bold text-gray-800 mb-4">Items Purchased</h3>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {scanResult.lineItems.map((item, index) => (
                      <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                        <div>
                          <div className="font-medium text-gray-800">{item.name}</div>
                          <div className="text-sm text-gray-600">
                            {item.quantity} × {formatCurrency(item.unitPrice, scanResult.currency)}
                          </div>
                        </div>
                        <div className="font-semibold text-gray-800">
                          {formatCurrency(item.totalPrice, scanResult.currency)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Raw Text Section */}
          <div className="mt-8 bg-gray-50 p-6 rounded-2xl">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Raw OCR Text</h3>
            <pre className="whitespace-pre-wrap text-sm text-gray-600 font-mono max-h-40 overflow-y-auto bg-white p-4 rounded-lg border">
              {scanResult.rawText}
            </pre>
          </div>

          {/* Image Preview */}
          {scanResult.imageUrl && (
            <div className="mt-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Receipt Image</h3>
              <div className="rounded-2xl overflow-hidden shadow-lg bg-white p-4">
                {scanResult.imageUrl.length < 1000000 ? (
                  <Image
                    src={scanResult.imageUrl}
                    alt="Scanned Receipt"
                    width={600}
                    height={400}
                    layout="responsive"
                    objectFit="contain"
                    className="rounded-lg"
                  />
                ) : (
                  <img
                    src={scanResult.imageUrl}
                    alt="Scanned Receipt"
                    className="w-full h-auto rounded-lg object-contain max-h-96"
                  />
                )}
              </div>
            </div>
          )}

          {/* System Information */}
          <div className="mt-6 text-sm text-gray-500 text-center">
            <p>Created: {new Date(scanResult.createdAt).toLocaleString()}</p>
            <p>ID: {scanResult._id}</p>
          </div>
        </div>
      )}
    </div>
  );
}
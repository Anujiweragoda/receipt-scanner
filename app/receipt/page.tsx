// app/page.tsx
'use client';

import { useState } from 'react';
import Image from 'next/image';

interface ReceiptData {
  _id: string; 
  vendor: string;
  date: string; 
  total: number;
  rawText: string;
  imageUrl?: string;
  createdAt: string;
}

export default function Home() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [scanResult, setScanResult] = useState<ReceiptData | null>(null);
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

  return (
    <div className="min-h-screen bg-gradient-to-r from-teal-500 to-green-600 flex flex-col items-center justify-center p-4">
      <h1 className="text-5xl font-extrabold text-white mb-10 drop-shadow-lg">
      Receipt Scanner
      </h1>

      <form
        onSubmit={handleSubmit}
        className="bg-white p-10 rounded-2xl shadow-xl max-w-lg w-full transform transition-all duration-300 hover:scale-105"
      >
        <div className="mb-6">
          <label htmlFor="receiptImage" className="block text-gray-800 text-lg font-semibold mb-3">
            Upload Receipt Image:
          </label>
          <input
            type="file"
            id="receiptImage"
            accept="image/*"
            onChange={handleFileChange}
            className="block w-full text-gray-700
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-green-50 file:text-green-700
              hover:file:bg-green-100"
          />
          {imageFile && (
            <div className="mt-4 text-sm text-gray-600">
              Selected: {imageFile.name} ({(imageFile.size / 1024).toFixed(2)} KB)
            </div>
          )}
        </div>
        <button
          type="submit"
          className={`w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-6 rounded-full
            transition-colors duration-300 focus:outline-none focus:ring-4 focus:ring-teal-300
            ${loading ? 'opacity-70 cursor-not-allowed' : 'shadow-lg'}`}
          disabled={loading}
        >
          {loading ? 'Scanning...' : 'Scan Receipt'}
        </button>
      </form>

      {error && (
        <div
          className="mt-8 bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg
          max-w-lg w-full shadow-md transition-opacity duration-300 opacity-100"
          role="alert"
        >
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline ml-2">{error}</span>
        </div>
      )}

      {scanResult && (
        <div
          className="mt-8 bg-white p-10 rounded-2xl shadow-xl max-w-lg w-full
          transform transition-all duration-300 opacity-100 scale-100"
        >
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Scan Result</h2>
          <p className="text-gray-700 mb-2">
            <strong className="font-semibold">ID:</strong> {scanResult._id}
          </p>
          <p className="text-gray-700 mb-2">
            <strong className="font-semibold">Vendor:</strong> {scanResult.vendor}
          </p>
          <p className="text-gray-700 mb-2">
            <strong className="font-semibold">Date:</strong>{' '}
            {new Date(scanResult.date).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
          <p className="text-gray-700 mb-4">
            <strong className="font-semibold">Total:</strong> ${scanResult.total.toFixed(2)}
          </p>
          <p className="text-gray-700 mb-4">
            <strong className="font-semibold">Scanned At:</strong>{' '}
            {new Date(scanResult.createdAt).toLocaleString()}
          </p>
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Raw OCR Text:</h3>
            <pre className="whitespace-pre-wrap text-sm text-gray-600 font-mono">
              {scanResult.rawText}
            </pre>
          </div>
          {scanResult.imageUrl && (
            <div className="mt-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Uploaded Image Preview:</h3>
              {scanResult.imageUrl.length < 1000000 ? (
                <Image
                  src={scanResult.imageUrl}
                  alt="Scanned Receipt"
                  width={400}
                  height={400}
                  layout="responsive"
                  objectFit="contain"
                  className="rounded-lg border border-gray-200 shadow-sm"
                />
              ) : (
                <img
                  src={scanResult.imageUrl}
                  alt="Scanned Receipt"
                  className="w-full h-auto rounded-lg border border-gray-200 shadow-sm object-contain"
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
// app/finance-tracking/page.tsx
'use client';

import { useEffect, useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface Expense {
  _id: string;
  date: string;
  category: string;
  total: number;
  currency: string;
  vendor: string;
}

export default function FinanceTracking() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchExpenses = async () => {
      setLoading(true);
      try {
        // Fetch expenses using GET method
        const res = await fetch('/api/scan-receipt', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const data = await res.json();
        setExpenses(data);
      } catch (error) {
        console.error('Error fetching expenses:', error);
        setError('Failed to load expenses.');
      } finally {
        setLoading(false);
      }
    };
    fetchExpenses();
  }, []);

  const totalSpent = expenses.reduce((sum, e) => sum + e.total, 0);

  const categoryData = Object.values(
    expenses.reduce((acc: Record<string, { name: string; value: number }>, e) => {
      if (!acc[e.category]) {
        acc[e.category] = { name: e.category, value: 0 };
      }
      acc[e.category].value += e.total;
      return acc;
    }, {})
  );

  const COLORS = ['#4F46E5', '#14B8A6', '#F59E0B', '#EC4899', '#10B981', '#6366F1'];

  const formatCurrency = (amount: number, currency: string = 'USD') =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-600 to-teal-500 p-6">
      <h1 className="text-5xl font-extrabold text-white mb-10 text-center drop-shadow-xl">
        Finance Tracking Dashboard
      </h1>

      {loading && (
        <div className="text-center text-white text-lg">Loading expenses...</div>
      )}

      {error && (
        <div className="bg-red-100/90 p-4 rounded-xl text-red-700 max-w-lg mx-auto">
          {error}
        </div>
      )}

      {!loading && !error && expenses.length > 0 && (
        <div className="grid md:grid-cols-3 gap-6">
          {/* Summary Card */}
          <div className="bg-white/90 p-6 rounded-3xl shadow-xl">
            <h2 className="text-xl font-bold text-gray-800 mb-2">Total Spent</h2>
            <p className="text-3xl font-extrabold text-blue-600">
              {formatCurrency(totalSpent, expenses[0]?.currency)}
            </p>
          </div>

          {/* Chart Card */}
          <div className="bg-white/90 p-6 rounded-3xl shadow-xl col-span-2">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Spending by Category</h2>
            <div className="w-full h-64">
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label
                  >
                    {categoryData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value, expenses[0]?.currency)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Recent Expenses List */}
      {!loading && !error && expenses.length > 0 && (
        <div className="mt-10 bg-white/90 p-6 rounded-3xl shadow-xl">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Expenses</h2>
          <div className="space-y-3">
            {expenses.slice(0, 8).map((exp) => (
              <div
                key={exp._id}
                className="flex justify-between items-center p-3 bg-gray-50 rounded-xl"
              >
                <div>
                  <p className="font-semibold text-gray-800">{exp.vendor}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(exp.date).toLocaleDateString()} - {exp.category}
                  </p>
                </div>
                <p className="font-bold text-blue-600">
                  {formatCurrency(exp.total, exp.currency)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No data message */}
      {!loading && !error && expenses.length === 0 && (
        <div className="text-center text-white text-lg mt-10">
          No expenses found. Start by scanning some receipts!
        </div>
      )}
    </div>
  );
}
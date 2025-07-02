'use client';

import { useEffect, useState } from 'react';
import { PlusCircleIcon, TrashIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import BackButton from '@/components/BackButton';

interface WaterBillExpense {
  id: number;
  date: number[]; // API returns date as [year, month, day]
  amount: number;
  description: string;
}

export default function WaterBillsPage() {
  const [expenses, setExpenses] = useState<WaterBillExpense[]>([]);
  const [newExpense, setNewExpense] = useState({ date: '', amount: '', description: '' });
  const [editingId, setEditingId] = useState<number | null>(null);

  const API_URL = 'https://idmsbackend-production.up.railway.app/api/water-bills';

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error('Fetch failed');
      setExpenses(await res.json());
    } catch (err) {
      console.error('Fetch error:', err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewExpense({ ...newExpense, [name]: value });
  };

  const handleAddExpense = async () => {
    if (!newExpense.date || !newExpense.amount || !newExpense.description) return;
    try {
      const [year, month, day] = newExpense.date.split('-').map(Number);
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ date: [year, month, day], amount: +newExpense.amount, description: newExpense.description })
      });
      if (!res.ok) throw new Error('Add failed');
      fetchExpenses();
      setNewExpense({ date: '', amount: '', description: '' });
    } catch (err) {
      console.error('Add error:', err);
    }
  };

  const handleDeleteExpense = async (id: number) => {
    try {
      const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      fetchExpenses();
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const handleEditClick = (expense: WaterBillExpense) => {
    setEditingId(expense.id);
    const dateStr = `${expense.date[0]}-${String(expense.date[1]).padStart(2, '0')}-${String(expense.date[2]).padStart(2, '0')}`;
    setNewExpense({ date: dateStr, amount: expense.amount.toString(), description: expense.description });
  };

  const handleUpdateExpense = async () => {
    if (!newExpense.date || !newExpense.amount || !newExpense.description || editingId === null) return;
    try {
      const [year, month, day] = newExpense.date.split('-').map(Number);
      const res = await fetch(`${API_URL}/${editingId}`, {
        method: 'PUT',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ date: [year, month, day], amount: +newExpense.amount, description: newExpense.description })
      });
      if (!res.ok) throw new Error('Update failed');
      fetchExpenses();
      setNewExpense({ date: '', amount: '', description: '' });
      setEditingId(null);
    } catch (err) {
      console.error('Update error:', err);
    }
  };

  const handleCancelEdit = () => {
    setNewExpense({ date: '', amount: '', description: '' });
    setEditingId(null);
  };

  return (
    <div className="container mx-auto py-8">
      <BackButton href="/finance-manager/dashboard" label="Back to Dashboard" />
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Water Bills</h1>

      {/* Input Form */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-4">
          {editingId ? 'Edit Water Bill' : 'Add New Water Bill'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <input type="date" name="date" value={newExpense.date} onChange={handleInputChange} 
                 className="p-2 border rounded-md dark:bg-gray-700 dark:text-white" />
          <input type="number" name="amount" placeholder="Amount" value={newExpense.amount} onChange={handleInputChange} 
                 className="p-2 border rounded-md dark:bg-gray-700 dark:text-white" />
          <input type="text" name="description" placeholder="Description" value={newExpense.description} onChange={handleInputChange} 
                 className="p-2 border rounded-md dark:bg-gray-700 dark:text-white" />
        </div>
        <div className="flex space-x-4">
          {editingId ? (
            <>
              <button onClick={handleUpdateExpense} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                <PencilSquareIcon className="h-5 w-5 mr-2" /> Update
              </button>
              <button onClick={handleCancelEdit} className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400">
                Cancel
              </button>
            </>
          ) : (
            <button onClick={handleAddExpense} className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
              <PlusCircleIcon className="h-5 w-5 mr-2" /> Add
            </button>
          )}
        </div>
      </div>

      {/* Expense List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold mb-4">Expense List</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {expenses.map(e => (
                <tr key={e.id}>
                  <td className="px-6 py-4">{new Date(e.date[0], e.date[1] - 1, e.date[2]).toLocaleDateString()}</td>
                  <td className="px-6 py-4">${e.amount.toFixed(2)}</td>
                  <td className="px-6 py-4">{e.description}</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => handleEditClick(e)} className="text-blue-600 mr-4 hover:text-blue-900">
                      <PencilSquareIcon className="h-5 w-5 inline" />
                    </button>
                    <button onClick={() => handleDeleteExpense(e.id)} className="text-red-600 hover:text-red-900">
                      <TrashIcon className="h-5 w-5 inline" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

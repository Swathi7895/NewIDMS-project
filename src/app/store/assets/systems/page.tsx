'use client';

import { useState, useEffect } from 'react';
import ItemManagement from '@/app/components/ItemManagement';
import BackButton from '@/app/components/BackButton';
import type { Item } from '@/app/components/ItemManagement';

interface System {
  id: string;
  name: string;
  quantity: number;
  category: string;
  location: string;
  lastUpdated: Date;
  condition: 'new' | 'good' | 'fair' | 'poor';
  purchaseDate?: Date;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  itemCondition?: string; // For API compatibility
}

interface ApiSystem {
  id: string;
  name: string;
  quantity: number;
  category: string;
  location: string;
  lastUpdated: string;
  itemCondition?: string;
  condition?: string;
  purchaseDate?: string;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
}

// API service functions
const API_BASE_URL = 'https://idmsbackend-production.up.railway.app/store/assets/systems';

const systemsAPI = {
  // GET - Fetch all system items
  getAll: async (): Promise<System[]> => {
    try {
      const response = await fetch(API_BASE_URL);
      if (!response.ok) throw new Error('Failed to fetch systems');
      const data = await response.json();
      
      // Transform API response to match our interface
      return data.map((item: ApiSystem) => ({
        ...item,
        condition: item.itemCondition || item.condition || 'good',
        lastUpdated: item.lastUpdated ? new Date(item.lastUpdated) : new Date(),
        purchaseDate: item.purchaseDate ? new Date(item.purchaseDate) : undefined,
      }));
    } catch (error: Error | unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      console.error('Error fetching systems:', errorMessage);
      return [];
    }
  },

  // POST - Create new system item
  create: async (item: Omit<System, 'id' | 'lastUpdated'>): Promise<System | null> => {
    try {
      const payload = {
        name: item.name,
        category: item.category,
        quantity: item.quantity,
        location: item.location,
        itemCondition: item.condition,
        lastUpdated: new Date().toISOString().split('T')[0], // Format: YYYY-MM-DD
        ...(item.manufacturer && { manufacturer: item.manufacturer }),
        ...(item.model && { model: item.model }),
        ...(item.serialNumber && { serialNumber: item.serialNumber }),
        ...(item.purchaseDate && { purchaseDate: item.purchaseDate.toISOString().split('T')[0] }),
      };

      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Failed to create system');
      const data = await response.json();
      
      return {
        ...data,
        condition: data.itemCondition || data.condition || 'good',
        lastUpdated: new Date(),
        purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : item.purchaseDate,
      };
    } catch (error: Error | unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      console.error('Error creating system:', errorMessage);
      return null;
    }
  },

  // PUT - Update system item
  update: async (id: string, updates: Partial<System>): Promise<System | null> => {
    try {
      const payload = {
        ...(updates.name && { name: updates.name }),
        ...(updates.category && { category: updates.category }),
        ...(updates.quantity !== undefined && { quantity: updates.quantity }),
        ...(updates.location && { location: updates.location }),
        ...(updates.condition && { itemCondition: updates.condition }),
        lastUpdated: new Date().toISOString().split('T')[0],
        ...(updates.manufacturer && { manufacturer: updates.manufacturer }),
        ...(updates.model && { model: updates.model }),
        ...(updates.serialNumber && { serialNumber: updates.serialNumber }),
        ...(updates.purchaseDate && { purchaseDate: updates.purchaseDate.toISOString().split('T')[0] }),
      };

      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Failed to update system');
      const data = await response.json();
      
      return {
        ...data,
        condition: data.itemCondition || data.condition || 'good',
        lastUpdated: new Date(),
        purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : undefined,
      };
    } catch (error: Error | unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      console.error('Error updating system:', errorMessage);
      return null;
    }
  },

  // DELETE - Remove system item
  delete: async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'DELETE',
      });

      return response.ok;
    } catch (error: Error | unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      console.error('Error deleting system:', errorMessage);
      return false;
    }
  },
};

// Helper to convert System to Item for ItemManagement
const systemToItem = (s: System): Item => ({
  ...s,
  itemCondition: (s.condition as Item['itemCondition']) || 'new',
  purchaseDate: s.purchaseDate,
  calibrationDate: undefined,
  status: undefined,
  manufacturer: s.manufacturer,
  partNumber: undefined,
  expiryDate: undefined,
  supplier: undefined,
  model: s.model,
  serialNumber: s.serialNumber,
  lastMaintenance: undefined,
});

export default function SystemsPage() {
  const [items, setItems] = useState<System[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const categories = ['Computers', 'Portable', 'Servers', 'Networking', 'Other'];

  // Load system items on component mount
  useEffect(() => {
    loadSystems();
  }, []);

  const loadSystems = async () => {
    setLoading(true);
    setError(null);
    try {
      const systemItems = await systemsAPI.getAll();
      setItems(systemItems);
    } catch (err: Error | unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(`Failed to load system items: ${errorMessage}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (newItem: Omit<Item, 'id' | 'lastUpdated'>) => {
    const system: Omit<System, 'id' | 'lastUpdated'> = {
      ...newItem,
      condition: newItem.itemCondition as System['condition'],
      purchaseDate: newItem.purchaseDate,
      manufacturer: newItem.manufacturer,
      model: newItem.model,
      serialNumber: newItem.serialNumber,
    };
    try {
      const createdItem = await systemsAPI.create(system);
      if (createdItem) {
        setItems(prevItems => [...prevItems, createdItem]);
      } else {
        setError('Failed to create system item');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(`Failed to create system item: ${errorMessage}`);
      console.error(err);
    }
  };

  const handleEdit = async (id: string, updatedItem: Partial<Item>) => {
    const system: Partial<System> = {
      ...updatedItem,
      condition: updatedItem.itemCondition as System['condition'],
      purchaseDate: updatedItem.purchaseDate,
      manufacturer: updatedItem.manufacturer,
      model: updatedItem.model,
      serialNumber: updatedItem.serialNumber,
    };
    try {
      const updated = await systemsAPI.update(id, system);
      if (updated) {
        setItems(prevItems =>
          prevItems.map(item =>
            item.id === id ? { ...item, ...updated } : item
          )
        );
      } else {
        setError('Failed to update system item');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(`Failed to update system item: ${errorMessage}`);
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const success = await systemsAPI.delete(id);
      if (success) {
        setItems(prevItems => prevItems.filter(item => item.id !== id));
      } else {
        setError('Failed to delete system item');
      }
    } catch (err: Error | unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(`Failed to delete system item: ${errorMessage}`);
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BackButton />
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading system items...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <BackButton />
      
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
          <button 
            onClick={() => setError(null)}
            className="ml-2 text-red-500 hover:text-red-700"
          >
            ×
          </button>
        </div>
      )}

      <ItemManagement
        title="Office Systems"
        items={items.map(systemToItem)}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        categories={categories}
      />
    </div>
  );
}
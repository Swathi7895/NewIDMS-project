'use client';

import { useState, useEffect } from 'react';
import { Plus,  Download, Search,  Eye, Edit, Trash2 } from 'lucide-react';
import DataForm, { FormField } from '../components/DataForm';
import DataView, { ViewField } from '../components/DataView';
import { APIURL } from '@/constants/api';

interface BankDocument {
  id: number;
  documentType: string;
  bankName: string;
  accountNumber: string;
  date: string;
  status: 'Valid' | 'Expired' | 'Pending';
}

// Type-safe wrapper for DataView
function BankDataView({ isOpen, onClose, data, fields, title }: {
  isOpen: boolean;
  onClose: () => void;
  data: BankDocument;
  fields: ViewField[];
  title: string;
}) {
  const viewData = {
    ...data,
    id: data.id.toString(),
    status: data.status
  };

  return (
    <DataView
      isOpen={isOpen}
      onClose={onClose}
      data={viewData}
      fields={fields}
      title={title}
    />
  );
}

const formFields: FormField[] = [
  { name: 'documentType', label: 'Document Type', type: 'select', options: ['Bank Statement', 'Bank Guarantee', 'Bank Certificate'], required: true },
  { name: 'bankName', label: 'Bank Name', type: 'text', required: true },
  { name: 'accountNumber', label: 'Account Number', type: 'text', required: true },
  { name: 'date', label: 'Date', type: 'date', required: true },
  { name: 'status', label: 'Status', type: 'select', options: ['Valid', 'Expired', 'Pending'], required: true }
];

const viewFields: ViewField[] = [
  { name: 'documentType', label: 'Document Type', type: 'text' },
  { name: 'bankName', label: 'Bank Name', type: 'text' },
  { name: 'accountNumber', label: 'Account Number', type: 'text' },
  { name: 'date', label: 'Date', type: 'date' },
  { name: 'status', label: 'Status', type: 'status' }
];

export default function BankDocumentsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilter, ] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<BankDocument | null>(null);
  const [data, setData] = useState<BankDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_URL = APIURL +'/api/bankdocuments';

  // --- Data Fetching (GET) ---
  const fetchBankDocuments = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(API_URL);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      function isBankDocument(item: unknown): item is BankDocument {
        return (
          typeof item === 'object' && item !== null &&
          'id' in item && 'documentType' in item && 'bankName' in item && 'accountNumber' in item && 'date' in item && 'status' in item
        );
      }
      const mapped = result.map((item: unknown) => {
        if (isBankDocument(item)) {
          return {
            ...item,
            date: Array.isArray(item.date)
              ? `${item.date[0]}-${String(item.date[1]).padStart(2, '0')}-${String(item.date[2]).padStart(2, '0')}`
              : item.date
          };
        }
        return null;
      }).filter(Boolean) as BankDocument[];
      setData(mapped);
    } catch (e: Error | unknown) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred';
      setError(`Failed to fetch documents: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBankDocuments();
  }, []);

  const handleAddNew = () => {
    setSelectedDocument(null);
    setIsFormOpen(true);
  };



  const handleExport = () => {
    const csvContent = "data:text/csv;charset=utf-8,"
      + "Document Type,Bank Name,Account Number,Date,Status\n"
      + data.map(item => [
        item.documentType,
        item.bankName,
        item.accountNumber,
        item.date,
        item.status
      ].join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "bank_documents.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleView = (item: BankDocument) => {
    setSelectedDocument(item);
    setIsViewOpen(true);
  };

  const handleEdit = (item: BankDocument) => {
    setSelectedDocument(item);
    setIsFormOpen(true);
  };

  // --- Data Deletion (DELETE) ---
  const handleDelete = async (item: BankDocument) => {
    if (confirm(`Are you sure you want to delete ${item.documentType} for ${item.bankName}?`)) {
      try {
        const response = await fetch(`${API_URL}/${item.id}`, {
          method: 'DELETE',
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        setData(prev => prev.filter(i => i.id !== item.id));
        alert('Document deleted successfully!');
      } catch (e: Error | unknown) {
        const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred';
        alert(`Failed to delete document: ${errorMessage}`);
      }
    }
  };

  // --- Form Submission (POST/PUT) ---
  const handleFormSubmit = async (formData: Omit<BankDocument, 'id'>) => {
    try {
      if (selectedDocument) {
        // Edit existing item (PUT)
        const response = await fetch(`${API_URL}/${selectedDocument.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const updatedDocument = await response.json();
        setData(prev => prev.map(item =>
          item.id === selectedDocument.id ? updatedDocument : item
        ));
        alert('Document updated successfully!');
      } else {
        // Add new item (POST)
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const newDocument = await response.json();
        setData(prev => [...prev, newDocument]);
        alert('Document added successfully!');
      }
      setIsFormOpen(false);
      setSelectedDocument(null); // Clear selected document after submission
    } catch (e: Error | unknown) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred';
      alert(`Failed to save document: ${errorMessage}`);
    }
  };

  const filteredData = data.filter(item =>
    (item.documentType?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (item.bankName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (item.accountNumber?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Bank Documents</h2>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleAddNew}
            className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New
          </button>
        
          <button
            onClick={handleExport}
            className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mt-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by document type, bank name, or account number..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
      
      </div>

      {showFilter && (
        <div className="mt-4 bg-white p-4 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Filter Options</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Date Range</label>
              <input type="date" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select className="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                <option>All</option>
                <option>Valid</option>
                <option>Pending</option>
                <option>Expired</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Document Type</label>
              <select className="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                <option>All</option>
                <option>Bank Statement</option>
                <option>Bank Guarantee</option>
                <option>Bank Certificate</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8 text-gray-600">Loading bank documents...</div>
      ) : error ? (
        <div className="text-center py-8 text-red-600">{error}</div>
      ) : (
        <div className="mt-6 bg-white rounded-lg shadow-md overflow-hidden mb-4">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Document Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bank Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">No bank documents found.</td>
                </tr>
              ) : (
                filteredData.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.documentType}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.bankName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.accountNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(item.date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        item.status === 'Valid' ? 'bg-green-100 text-green-800' :
                        item.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleView(item)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(item)}
                          className="text-green-600 hover:text-green-900"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <DataForm<BankDocument>
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedDocument(null);
        }}
        onSubmit={handleFormSubmit}
        title={selectedDocument ? 'Edit Bank Document' : 'Add Bank Document'}
        fields={formFields}
        initialData={selectedDocument}
      />

      {isViewOpen && selectedDocument && (
        <BankDataView
          isOpen={isViewOpen}
          onClose={() => {
            setIsViewOpen(false);
            setSelectedDocument(null);
          }}
          data={selectedDocument}
          fields={viewFields}
          title="Bank Document Details"
        />
      )}
    </div>
  );
}
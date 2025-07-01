'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

interface RegisterFormData {
  username: string;
  password: string;
  fullName: string;
  email: string;
  roles: string[];
}

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<RegisterFormData>({
    username: '',
    password: '',
    fullName: '',
    email: '',
    roles: [] // Remove default role
  });
  const [loading, setLoading] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

  const availableRoles = [
    'ADMIN',
    'STORE',
    'FINANCE',
    'HR',
    'DATA_MANAGER',
    
  ];

  const handleRoleChange = (role: string) => {
    setFormData((prev) => ({
      ...prev,
      roles: prev.roles.includes(role)
        ? prev.roles.filter((r) => r !== role)
        : [...prev.roles, role]
    }));
  };

  const validatePassword = (password: string) => {
    const errors: string[] = [];
    
    // Check minimum length
    if (password.length < 8) {
      errors.push('At least 8 characters long');
    }
    
    // Check for uppercase letter
    if (!/[A-Z]/.test(password)) {
      errors.push('One uppercase letter');
    }
    
    // Check for lowercase letter
    if (!/[a-z]/.test(password)) {
      errors.push('One lowercase letter');
    }
    
    // Check for number
    if (!/\d/.test(password)) {
      errors.push('One number');
    }
    
    // Check for special character
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('One special character (!@#$%^&*(),.?":{}|<>)');
    }

    return errors;
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setFormData({ ...formData, password: newPassword });
    setPasswordErrors(validatePassword(newPassword));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate password before submission
    const passwordValidationErrors = validatePassword(formData.password);
    if (passwordValidationErrors.length > 0) {
      toast.error('Please fix all password requirements');
      return;
    }

    // Validate that at least one role is selected
    if (formData.roles.length === 0) {
      toast.error('Please select at least one role');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('https://idmsbackend-production.up.railway.app/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        // Handle non-JSON response (like HTML error pages)
        if (response.status === 400) {
          toast.error('Invalid registration data. Please check your information.');
        } else if (response.status === 409) {
          toast.error('User already exists. Please use a different username or email.');
        } else if (response.status >= 500) {
          toast.error('Server error. Please try again later.');
        } else {
          toast.error('Registration failed. Please try again.');
        }
        return;
      }

      const data = await response.json();

      if (response.ok) {
        toast.success('Account created successfully! Please log in.');
        router.push('/login'); // Redirect to login after success
      } else {
        // Handle API error responses
        const errorMessage = data.message || 'Registration failed. Please try again.';
        toast.error(errorMessage);
      }
    } catch (err) {
      // Handle network errors and other exceptions
      if (err instanceof TypeError && err.message.includes('fetch')) {
        toast.error('Network error. Please check your internet connection and try again.');
      } else if (err instanceof SyntaxError) {
        toast.error('Invalid response from server. Please try again.');
      } else {
        toast.error('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10B981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
          },
        }}
      />
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/login" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4">
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Login
        </Link>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Create your account
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl rounded-2xl sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Username"
              required
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-xl shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />

            <input
              type="text"
              placeholder="Full Name"
              required
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-xl shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />

            <input
              type="email"
              placeholder="Email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-xl shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />

            <div className="space-y-1">
              <input
                type="password"
                placeholder="Password"
                required
                value={formData.password}
                onChange={handlePasswordChange}
                className={`appearance-none block w-full px-3 py-2 border ${
                  passwordErrors.length > 0 ? 'border-red-300' : 'border-gray-300'
                } rounded-xl shadow-sm focus:ring-blue-500 focus:border-blue-500`}
              />
              {formData.password.length > 0 && (
                <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 mb-2">Password must have:</p>
                  <ul className="space-y-1">
                    {[
                      'At least 8 characters long',
                      'One uppercase letter',
                      'One lowercase letter',
                      'One number',
                      'One special character (!@#$%^&*(),.?":{}|<>)'
                    ].map((requirement) => (
                      <li 
                        key={requirement} 
                        className={`text-sm flex items-center ${
                          passwordErrors.includes(requirement) 
                            ? 'text-red-600' 
                            : 'text-green-600'
                        }`}
                      >
                        {passwordErrors.includes(requirement) ? '✗' : '✓'} {requirement}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <fieldset>
              <legend className="text-sm font-medium text-gray-700 mb-2">Select Roles</legend>
              <div className="grid grid-cols-2 gap-3 mt-2">
                {availableRoles.map((role) => (
                  <label key={role} className="flex items-center p-2 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      value={role}
                      checked={formData.roles.includes(role)}
                      onChange={() => handleRoleChange(role)}
                      className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">{role.replace('ROLE_', '')}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2.5 px-4 border rounded-xl shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-gray-600">
            Already have an account? {' '}
            <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

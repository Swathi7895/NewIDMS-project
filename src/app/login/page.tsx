'use client';

import React, { useState, useEffect } from 'react';
import { Lock, User, Eye, EyeOff, Shield } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast, { Toaster } from 'react-hot-toast';

interface FormData {
  email: string;
  password: string;
}

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<FormData>({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Partial<FormData>>({});
  const [loginAsEmployee, setLoginAsEmployee] = useState(false);
  const [, setSelectedRole] = useState<string>('');

  useEffect(() => {
    const role = sessionStorage.getItem('selectedRole');
    if (role) {
      setSelectedRole(role);
      if (role === 'employee') setLoginAsEmployee(true);
      sessionStorage.removeItem('selectedRole');
    }
  }, []);

  const redirectBasedOnRole = (roles: string[]) => {
    if (roles.includes('ADMIN')) router.replace('/admin');
    else if (roles.includes('STORE')) router.replace('/store');
    else if (roles.includes('FINANCE')) router.replace('/finance-manager/dashboard');
    else if (roles.includes('HR')) router.replace('/hr');
    else if (roles.includes('DATA_MANAGER')) router.replace('/data-manager');
    else router.replace('/dashboard');
  };

  const validateForm = (): boolean => {
    const errors: Partial<FormData> = {};
    if (!formData.email) errors.email = 'Email is required';
    else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)) errors.email = 'Invalid email address';
    if (!formData.password) errors.password = 'Password is required';
    else if (formData.password.length < 8) errors.password = 'Password must be at least 8 characters';
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setValidationErrors(prev => ({ ...prev, [name]: undefined }));
  };

  const handleLogin = async () => {
    if (!validateForm()) return;
    setLoading(true);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://idmsbackend-production.up.railway.app';
      const apiUrl = loginAsEmployee
        ? `${baseUrl}/api/employees/login`
        : `${baseUrl}/api/auth/login`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        toast.error(response.status === 401
          ? 'Invalid email or password.'
          : response.status === 404
            ? 'Login service not found.'
            : response.status >= 500
              ? 'Server error. Try again later.'
              : 'Login failed. Please check your credentials.');
        return;
      }

      const data = await response.json() as (
        | { token: string; roles: string[]; message?: string }
        | { employeeId: string; employeeProfile?: object; userEmail?: string; roles?: string[]; message?: string }
        | { message?: string }
      );

      if (response.ok && data) {
        if (loginAsEmployee) {
          if ('employeeId' in data) {
            sessionStorage.setItem('employeeId', data.employeeId);
            sessionStorage.setItem('employeeProfile', JSON.stringify(data));
            sessionStorage.setItem('userEmail', formData.email);
            sessionStorage.setItem('roles', JSON.stringify(['EMPLOYEE']));
            toast.success('Employee login successful!');
            router.replace('/employee');
            return;
          } else {
            toast.error('Invalid employee login response.');
            return;
          }
        }

        if ('token' in data && 'roles' in data) {
          sessionStorage.setItem('token', data.token);
          sessionStorage.setItem('userEmail', formData.email);
          sessionStorage.setItem('roles', JSON.stringify(data.roles));
          toast.success('Login successful!');
          redirectBasedOnRole(data.roles);
        } else {
          toast.error('Invalid login response. Please try again.');
        }
      } else {
        toast.error(data?.message || 'Login failed.');
        sessionStorage.clear();
      }
    } catch (e: unknown) {
      let errorMessage = 'Unexpected error';
      if (
        e &&
        typeof e === 'object' &&
        'message' in e &&
        typeof (e as { message?: string }).message === 'string'
      ) {
        errorMessage = (e as { message: string }).message.includes('fetch') ? 'Network error' : (e as { message: string }).message;
      }
      toast.error(errorMessage);
      sessionStorage.clear();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Toaster position="top-right" toastOptions={{
        duration: 4000,
        style: { background: '#363636', color: '#fff' },
        success: { duration: 3000, iconTheme: { primary: '#10B981', secondary: '#fff' } },
        error: { duration: 5000, iconTheme: { primary: '#EF4444', secondary: '#fff' } },
      }} />
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-indigo-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Login</h1>
          <p className="text-gray-600">Sign in to access your dashboard</p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
            <div className="relative">
              <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`w-full pl-10 pr-4 py-3 border ${validationErrors.email ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-indigo-500`}
                placeholder="Enter your email"
                required
              />
            </div>
            {validationErrors.email && <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className={`w-full pl-10 pr-12 py-3 border ${validationErrors.password ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-indigo-500`}
                placeholder="Enter your password"
                required
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-gray-400 hover:text-gray-600">
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {validationErrors.password && <p className="mt-1 text-sm text-red-600">{validationErrors.password}</p>}
            <div className="flex justify-end mt-2">
              <Link href="/forgot-password" className="text-sm text-blue-600 hover:underline">Forgot Password?</Link>
            </div>
          </div>

          <div className="flex items-center">
            <input
              id="loginAsEmployee"
              type="checkbox"
              checked={loginAsEmployee}
              onChange={() => setLoginAsEmployee(v => !v)}
              className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            />
            <label htmlFor="loginAsEmployee" className="ml-2 block text-sm text-gray-700">
              Login as Employee
            </label>
          </div>

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </div>

        <div className="mt-6 text-center">
          <span className="text-gray-600">Don&apos;t have an account? </span>
          <Link href="/register" className="text-indigo-600 hover:underline font-medium">Create one</Link>
        </div>
      </div>
    </div>
  );
}

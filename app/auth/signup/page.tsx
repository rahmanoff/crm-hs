'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  UserPlus,
  Mail,
  Lock,
  User,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import Link from 'next/link';

export default function SignUpPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const validateForm = (): string | null => {
    if (!formData.name.trim()) {
      return 'Name is required';
    }
    if (!formData.email.trim()) {
      return 'Email is required';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      return 'Please enter a valid email';
    }
    if (!formData.password) {
      return 'Password is required';
    }
    if (formData.password.length < 6) {
      return 'Password must be at least 6 characters';
    }
    if (formData.password !== formData.confirmPassword) {
      return 'Passwords do not match';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Signup response error:', data);
        setError(data.error || 'Failed to create account');
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push(
          '/auth/signin?email=' + encodeURIComponent(formData.email),
        );
      }, 2000);
    } catch (err) {
      console.error('Signup fetch error:', err);
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center px-4'>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className='w-full max-w-md'>
          <div className='bg-white rounded-lg shadow-xl p-8 text-center'>
            <div className='inline-block p-3 bg-green-100 rounded-lg mb-4'>
              <CheckCircle className='text-green-600 w-8 h-8' />
            </div>
            <h1 className='text-3xl font-bold text-gray-900 mb-2'>
              Account Created!
            </h1>
            <p className='text-gray-600 mb-6'>
              Your account has been successfully created. Redirecting to
              sign in...
            </p>
            <div className='animate-spin inline-block'>
              <div className='w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full'></div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4'>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className='w-full max-w-md'>
        <div className='bg-white rounded-lg shadow-xl p-8'>
          {/* Header */}
          <div className='text-center mb-8'>
            <div className='inline-block p-3 bg-indigo-100 rounded-lg mb-4'>
              <UserPlus className='text-indigo-600 w-8 h-8' />
            </div>
            <h1 className='text-3xl font-bold text-gray-900 mb-2'>
              Create Account
            </h1>
            <p className='text-gray-600'>Join HubSpot Dashboard</p>
          </div>

          {/* Error Messages */}
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className='mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3'>
              <AlertCircle className='text-red-600 w-5 h-5 flex-shrink-0 mt-0.5' />
              <div>
                <p className='text-red-800 font-medium'>Error</p>
                <p className='text-red-700 text-sm'>{error}</p>
              </div>
            </motion.div>
          )}

          {/* Sign Up Form */}
          <form
            onSubmit={handleSubmit}
            className='space-y-4 mb-6'>
            <div>
              <label
                htmlFor='name'
                className='block text-sm font-medium text-gray-700 mb-2'>
                Full Name
              </label>
              <div className='relative'>
                <User className='absolute left-3 top-3 text-gray-400 w-5 h-5' />
                <input
                  id='name'
                  type='text'
                  name='name'
                  value={formData.name}
                  onChange={handleChange}
                  placeholder='John Doe'
                  className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition'
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor='email'
                className='block text-sm font-medium text-gray-700 mb-2'>
                Email Address
              </label>
              <div className='relative'>
                <Mail className='absolute left-3 top-3 text-gray-400 w-5 h-5' />
                <input
                  id='email'
                  type='email'
                  name='email'
                  value={formData.email}
                  onChange={handleChange}
                  placeholder='you@example.com'
                  className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition'
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor='password'
                className='block text-sm font-medium text-gray-700 mb-2'>
                Password
              </label>
              <div className='relative'>
                <Lock className='absolute left-3 top-3 text-gray-400 w-5 h-5' />
                <input
                  id='password'
                  type='password'
                  name='password'
                  value={formData.password}
                  onChange={handleChange}
                  placeholder='••••••••'
                  className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition'
                  required
                  disabled={loading}
                />
              </div>
              <p className='text-xs text-gray-500 mt-1'>
                At least 6 characters
              </p>
            </div>

            <div>
              <label
                htmlFor='confirmPassword'
                className='block text-sm font-medium text-gray-700 mb-2'>
                Confirm Password
              </label>
              <div className='relative'>
                <Lock className='absolute left-3 top-3 text-gray-400 w-5 h-5' />
                <input
                  id='confirmPassword'
                  type='password'
                  name='confirmPassword'
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder='••••••••'
                  className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition'
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <button
              type='submit'
              disabled={loading}
              className='w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6'>
              {loading ? (
                <>
                  <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
                  Creating account...
                </>
              ) : (
                <>
                  <UserPlus className='w-5 h-5' />
                  Create Account
                </>
              )}
            </button>
          </form>

          {/* Sign In Link */}
          <p className='text-center text-sm text-gray-600'>
            Already have an account?{' '}
            <Link
              href='/auth/signin'
              className='text-indigo-600 hover:underline font-semibold'>
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

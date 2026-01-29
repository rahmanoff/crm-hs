'use client';

import React from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { AlertTriangle, Home } from 'lucide-react';
import Link from 'next/link';

export default function ErrorPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const error = searchParams.get('error');

  const errorMessages: {
    [key: string]: { title: string; message: string };
  } = {
    AccessDenied: {
      title: 'Access Denied',
      message:
        'You do not have permission to access this resource. Please contact your administrator.',
    },
    Callback: {
      title: 'Callback Error',
      message:
        'There was an error processing your authentication. Please try again.',
    },
    OAuthSignin: {
      title: 'OAuth Sign In Error',
      message:
        'There was an error during the OAuth sign-in process. Please try again.',
    },
    OAuthCallback: {
      title: 'OAuth Callback Error',
      message:
        'There was an error processing your OAuth callback. Please try again.',
    },
    EmailCreateAccount: {
      title: 'Account Creation Error',
      message:
        'There was an error creating your account. Please try again or contact support.',
    },
    EmailSignin: {
      title: 'Email Sign In Error',
      message:
        'There was an error sending you the sign-in email. Please try again.',
    },
    EmailCallback: {
      title: 'Email Callback Error',
      message:
        'There was an error processing your email callback. Please try again.',
    },
    SessionCallback: {
      title: 'Session Error',
      message:
        'There was an error creating your session. Please try signing in again.',
    },
    Signin: {
      title: 'Sign In Error',
      message: 'There was an error signing you in. Please try again.',
    },
    OAuthCreateAccount: {
      title: 'Account Creation Error',
      message:
        'There was an error creating your account via OAuth. Please try again.',
    },
    EmailProviderNotConfigured: {
      title: 'Email Provider Error',
      message:
        'Email authentication is not configured. Please contact support.',
    },
    CredentialsSignin: {
      title: 'Invalid Credentials',
      message: 'Invalid email or password. Please try again.',
    },
    default: {
      title: 'Authentication Error',
      message:
        'An unexpected error occurred during authentication. Please try again.',
    },
  };

  const errorInfo =
    errorMessages[error as string] || errorMessages.default;

  return (
    <div className='min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center px-4'>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className='w-full max-w-md'>
        <div className='bg-white rounded-lg shadow-xl p-8'>
          {/* Header */}
          <div className='text-center mb-8'>
            <div className='inline-block p-3 bg-red-100 rounded-lg mb-4'>
              <AlertTriangle className='text-red-600 w-8 h-8' />
            </div>
            <h1 className='text-3xl font-bold text-gray-900 mb-2'>
              {errorInfo.title}
            </h1>
          </div>

          {/* Error Message */}
          <div className='mb-8 p-4 bg-red-50 border border-red-200 rounded-lg'>
            <p className='text-red-700 text-center'>
              {errorInfo.message}
            </p>
          </div>

          {/* Error Code (if available) */}
          {error && (
            <p className='text-center text-sm text-gray-500 mb-6'>
              Error Code:{' '}
              <code className='bg-gray-100 px-2 py-1 rounded'>
                {error}
              </code>
            </p>
          )}

          {/* Action Buttons */}
          <div className='flex flex-col gap-3'>
            <Link
              href='/auth/signin'
              className='w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg transition text-center'>
              Try Again
            </Link>
            <Link
              href='/'
              className='w-full border border-gray-300 hover:border-gray-400 text-gray-700 font-semibold py-2 px-4 rounded-lg transition flex items-center justify-center gap-2'>
              <Home className='w-5 h-5' />
              Go Home
            </Link>
          </div>

          {/* Support Message */}
          <p className='text-center text-sm text-gray-600 mt-6'>
            Need help? Contact{' '}
            <a
              href='mailto:support@example.com'
              className='text-indigo-600 hover:underline'>
              support@example.com
            </a>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

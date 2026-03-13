import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '@/auth/admin-auth';

export default function RequireAdmin({ children }) {
  const { loading, session, isAdmin } = useAdminAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Loading…
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-xl border p-6">
          <h1 className="text-lg font-bold text-gray-900">Access denied</h1>
          <p className="text-sm text-gray-600 mt-2">
            Your account is signed in, but not listed as an admin for this portal.
          </p>
          <p className="text-xs text-gray-500 mt-4">
            Add your email to <code className="font-mono">VITE_ADMIN_EMAILS</code> (comma-separated) and reload.
          </p>
        </div>
      </div>
    );
  }

  return children;
}


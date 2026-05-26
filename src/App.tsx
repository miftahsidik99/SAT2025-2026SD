/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import History from './pages/History';
import Login from './pages/Login';
import DocumentPreview from './pages/DocumentPreview';
import { useAuth, AuthProvider } from './hooks/useAuth';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex h-screen items-center justify-center font-mono">Memuat...</div>;
  return user ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }
          >
            <Route index element={<Home />} />
            <Route path="riwayat" element={<History />} />
            <Route path="dokumen/:id" element={<DocumentPreview />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

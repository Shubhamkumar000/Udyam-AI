import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import UdyanLanding from './pages/UdyanLanding';
import UdyanLogin from './pages/UdyanLogin';
import UdyanSignup from './pages/UdyanSignup';
import UdyanDashboard from './pages/UdyanDashboard';
import UdyanScanner from './pages/UdyanScanner';
import UdyanChat from './pages/UdyanChat';
import UdyanProfile from './pages/UdyanProfile';

import UdyanIdentity from './pages/UdyanIdentity';
import UdyanOnboarding from './pages/UdyanOnboarding';
import UdyanUploadLicenses from './pages/UdyanUploadLicenses';
import UdyanLicenseDetail from './pages/UdyanLicenseDetail';
import UdyanPendingLicenses from './pages/UdyanPendingLicenses';
import { getToken } from './utils/udyanStorage';

// Authentication Guard Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = getToken();
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Udyan AI Compliance Landing Page */}
        <Route path="/" element={<UdyanLanding />} />
        <Route path="/login" element={<UdyanLogin />} />
        <Route path="/signup" element={<UdyanSignup />} />

        {/* Protected Udyan AI Workspace Routes */}
        <Route 
          path="/udyan" 
          element={
            <ProtectedRoute>
              <UdyanDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/udyan/identity" 
          element={
            <ProtectedRoute>
              <UdyanIdentity />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/udyan/onboarding" 
          element={
            <ProtectedRoute>
              <UdyanOnboarding />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/udyan/upload-licenses" 
          element={
            <ProtectedRoute>
              <UdyanUploadLicenses />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/udyan/scanner" 
          element={
            <ProtectedRoute>
              <UdyanScanner />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/udyan/chat" 
          element={
            <ProtectedRoute>
              <UdyanChat />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/udyan/profile" 
          element={
            <ProtectedRoute>
              <UdyanProfile />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/udyan/license/:type" 
          element={
            <ProtectedRoute>
              <UdyanLicenseDetail />
            </ProtectedRoute>
          } 
        />
        <Route
          path="/udyan/pending-licenses"
          element={
            <ProtectedRoute>
              <UdyanPendingLicenses />
            </ProtectedRoute>
          }
        />

        {/* Fallback Catch-All */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;

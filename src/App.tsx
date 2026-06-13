import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import UdyanLanding from './pages/UdyanLanding';
import UdyanLogin from './pages/UdyanLogin';
import UdyanSignup from './pages/UdyanSignup';
import UdyanDashboard from './pages/UdyanDashboard';
import UdyanScanner from './pages/UdyanScanner';
import UdyanChat from './pages/UdyanChat';
import UdyanProfile from './pages/UdyanProfile';
import UdyanExtension from './pages/UdyanExtension';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Udyan AI Compliance Landing Page */}
        <Route path="/" element={<UdyanLanding />} />
        <Route path="/login" element={<UdyanLogin />} />
        <Route path="/signup" element={<UdyanSignup />} />

        {/* Udyan AI Compliance Dashboard Routes */}
        <Route path="/udyan" element={<UdyanDashboard />} />
        <Route path="/udyan/scanner" element={<UdyanScanner />} />
        <Route path="/udyan/chat" element={<UdyanChat />} />
        <Route path="/udyan/profile" element={<UdyanProfile />} />
        <Route path="/udyan/extension" element={<UdyanExtension />} />
      </Routes>
    </Router>
  );
};

export default App;

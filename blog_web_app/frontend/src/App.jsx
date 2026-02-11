import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import BlogDetail from './pages/BlogDetail';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ManualUpload from './pages/ManualUpload';
import Dashboard from './pages/Dashboard';
import UserDashboard from './pages/UserDashboard';

import Navbar from './components/Navbar';

function App() {
  return (
    <Router>
      <div className="app-wrapper">
        <div className="bg-blobs">
          <div className="blob blob-1"></div>
          <div className="blob blob-2"></div>
          <div className="blob blob-3"></div>
        </div>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/blog/:slug" element={<BlogDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/upload" element={<ManualUpload />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<UserDashboard />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

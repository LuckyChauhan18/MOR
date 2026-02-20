import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';

// Lazy-loaded pages — each gets its own JS chunk, downloaded only on navigation
const BlogDetail = lazy(() => import('./pages/BlogDetail'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const ManualUpload = lazy(() => import('./pages/ManualUpload'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const UserDashboard = lazy(() => import('./pages/UserDashboard'));

import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Themed loading spinner matching the site's glassmorphism style
const PageLoader = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '60vh',
  }}>
    <div style={{
      width: '44px',
      height: '44px',
      border: '3px solid rgba(139, 92, 246, 0.15)',
      borderTopColor: 'var(--primary)',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite',
    }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

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
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/blog/:slug" element={<BlogDetail />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/upload" element={<ManualUpload />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<UserDashboard />} />
          </Routes>
        </Suspense>
        <Footer />
      </div>
    </Router>
  );
}

export default App;


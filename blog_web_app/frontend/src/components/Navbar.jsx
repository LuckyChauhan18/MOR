import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { motion } from 'framer-motion';
import { LogOut, LayoutDashboard } from 'lucide-react';
import logo from '../assets/websiteLogo.png';

const Navbar = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const updateUser = () => {
      const username = Cookies.get('username');
      const role = Cookies.get('userRole');
      if (username) {
        setUser({ username, role });
      } else {
        setUser(null);
      }
    };

    updateUser();

    // Check for cookie changes occasionally or on navigation
    // Note: In a real app, a context provider would be better, but we'll stick to this for now
    const interval = setInterval(updateUser, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    Cookies.remove('userToken');
    Cookies.remove('username');
    Cookies.remove('userRole');
    setUser(null);
    navigate('/');
  };

  return (
    <nav style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
      padding: '10px 40px',
      background: 'rgba(10, 10, 18, 0.7)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--glass-border)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      {/* Brand / Logo */}
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '15px', textDecoration: 'none' }}>
        <img src={logo} alt="Mor Logo" style={{ height: '70px', width: '70px', borderRadius: '50%', objectFit: 'cover' }} />
        <span className="text-gradient" style={{ fontWeight: 'bold', fontSize: '1.8rem' }}>Mor</span>
      </Link>

      {/* Animated Welcome Message */}
      <div style={{ flex: 1, overflow: 'hidden', margin: '0 40px' }}>
        {user ? (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: '-100%' }}
            transition={{ repeat: Infinity, duration: 15, ease: 'linear' }}
            style={{ whiteSpace: 'nowrap' }}
          >
            <h2 className="text-gradient" style={{ display: 'inline-block', fontSize: '1.1rem', fontWeight: 'bold' }}>
              Hi, {user.username}! Welcome to your space. ✨ You are logged in as {user.role}.
            </h2>
          </motion.div>
        ) : (
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Welcome to AI Insights • Shared Creativity</div>
        )}
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
        {user ? (
          <>
            {user.role === 'admin' && (
              <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'white', fontSize: '0.9rem', padding: '8px 15px', borderRadius: '10px', background: 'var(--glass)', textDecoration: 'none' }}>
                <LayoutDashboard size={18} /> Dashboard
              </Link>
            )}
            <button
              onClick={() => navigate('/upload')}
              className="vibrant-gradient"
              style={{ padding: '8px 18px', borderRadius: '10px', color: 'white', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}
            >
              Upload Blog
            </button>
            <button
              onClick={handleLogout}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ef4444', fontSize: '0.9rem', padding: '8px 15px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', cursor: 'pointer' }}
            >
              <LogOut size={18} /> Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" style={{ color: 'white', fontSize: '0.9rem', padding: '8px 18px', borderRadius: '10px', border: '1px solid var(--glass-border)', textDecoration: 'none' }}>Login</Link>
            <Link to="/signup" className="vibrant-gradient" style={{ color: 'white', fontSize: '0.9rem', padding: '8px 18px', borderRadius: '10px', textDecoration: 'none', fontWeight: 'bold' }}>Sign Up</Link>
            <button
              onClick={() => navigate('/login')}
              style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', padding: '8px 18px', borderRadius: '10px', border: '1px solid var(--glass-border)', background: 'transparent', cursor: 'pointer' }}
            >
              Upload Blog
            </button>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

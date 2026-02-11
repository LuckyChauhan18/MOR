import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { Lock, User, Mail, ArrowLeft, UserPlus } from 'lucide-react';
import { motion } from 'framer-motion';

const Signup = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/register', { username, email, password });
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="login-container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '120px 20px 40px 20px' }}>
      <motion.div
        className="glass"
        style={{ width: '100%', maxWidth: '450px', padding: '50px' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', marginBottom: '30px' }}>
          <ArrowLeft size={18} /> Home
        </Link>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '10px', color: '#ffffff' }} className="font-accent">Create Account</h1>
        <p style={{ color: 'rgba(255, 255, 255, 0.7)', marginBottom: '40px', fontWeight: '500', letterSpacing: '0.5px' }}>JOIN OUR COMMUNITY</p>

        {error && <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', borderRadius: '10px', marginBottom: '20px', fontSize: '0.9rem' }}>{error}</div>}

        <form onSubmit={handleSignup}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.95rem', fontWeight: '600' }}>Username</label>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{ width: '100%', padding: '15px 15px 15px 45px', background: 'var(--glass)', border: '1px solid var(--glass-border)', color: 'white', borderRadius: '12px' }}
                placeholder="Pick a username"
                required
              />
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.95rem', fontWeight: '600' }}>Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ width: '100%', padding: '15px 15px 15px 45px', background: 'var(--glass)', border: '1px solid var(--glass-border)', color: 'white', borderRadius: '12px' }}
                placeholder="Enter your email"
                required
              />
            </div>
          </div>

          <div style={{ marginBottom: '30px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.95rem', fontWeight: '600' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: '100%', padding: '15px 15px 15px 45px', background: 'var(--glass)', border: '1px solid var(--glass-border)', color: 'white', borderRadius: '12px' }}
                placeholder="Create a password"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="vibrant-gradient"
            disabled={loading}
            style={{ width: '100%', padding: '15px', borderRadius: '12px', color: 'white', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '1rem' }}
          >
            {loading ? 'Creating Account...' : <><UserPlus size={20} /> Sign Up</>}
          </button>

          <p style={{ marginTop: '25px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Already have an account? <Link to="/login" style={{ color: '#4facfe', fontWeight: 'bold', textDecoration: 'none' }}>Log In</Link>
          </p>
        </form>
      </motion.div>
    </div>
  );
};

export default Signup;

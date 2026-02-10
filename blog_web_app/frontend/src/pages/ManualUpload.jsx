import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import Cookies from 'js-cookie';
import { ArrowLeft, Send, Image as ImageIcon, Plus, X } from 'lucide-react';
import { motion } from 'framer-motion';

const ManualUpload = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categories, setCategories] = useState('');
  const [summary, setSummary] = useState('');
  const [bannerImage, setBannerImage] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const navigate = useNavigate();

  useEffect(() => {
    const token = Cookies.get('userToken');
    const role = Cookies.get('userRole');

    if (!token) {
      navigate('/login');
      return;
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    const token = Cookies.get('userToken');
    const blogData = {
      title,
      content,
      categories: categories.split(',').map(c => c.trim()),
      summary,
      bannerImage
    };

    try {
      await axios.post('/api/blogs', blogData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage({ type: 'success', text: 'Blog published successfully!' });
      setTimeout(() => navigate('/'), 2000);
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to publish blog.';
      const errorDetails = err.response?.data?.error ? ` (${err.response.data.error})` : '';
      setMessage({ type: 'error', text: `${errorMsg}${errorDetails}` });
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Cookies.remove('userToken');
    Cookies.remove('username');
    Cookies.remove('userRole');
    navigate('/login');
  };

  return (
    <div className="container" style={{ paddingTop: '120px', paddingBottom: '100px', maxWidth: '900px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
          <ArrowLeft size={18} /> Back to Home
        </Link>
        <button onClick={handleLogout} style={{ background: 'var(--glass)', color: 'white', padding: '8px 20px', borderRadius: '10px' }}>Logout</button>
      </div>

      <motion.div
        className="glass"
        style={{ padding: '50px' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <h1 style={{ fontSize: '2.5rem', marginBottom: '10px' }}>Create New Blog</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '40px' }}>Share your manual insights with the world.</p>

        {message.text && (
          <div style={{
            padding: '15px',
            background: message.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${message.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
            color: message.type === 'success' ? '#10b981' : '#ef4444',
            borderRadius: '12px',
            marginBottom: '30px'
          }}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '30px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Blog Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{ width: '100%', padding: '12px', background: 'var(--glass)', border: '1px solid var(--glass-border)', color: 'white', borderRadius: '10px' }}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Categories (comma separated)</label>
              <input
                type="text"
                value={categories}
                onChange={(e) => setCategories(e.target.value)}
                style={{ width: '100%', padding: '12px', background: 'var(--glass)', border: '1px solid var(--glass-border)', color: 'white', borderRadius: '10px' }}
                placeholder="tech, ai, tutorial"
                required
              />
            </div>
          </div>

          <div style={{ marginBottom: '30px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Banner Image URL (optional)</label>
            <input
              type="text"
              value={bannerImage}
              onChange={(e) => setBannerImage(e.target.value)}
              style={{ width: '100%', padding: '12px', background: 'var(--glass)', border: '1px solid var(--glass-border)', color: 'white', borderRadius: '10px' }}
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div style={{ marginBottom: '30px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Summary (short description)</label>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows="2"
              style={{ width: '100%', padding: '12px', background: 'var(--glass)', border: '1px solid var(--glass-border)', color: 'white', borderRadius: '10px', resize: 'vertical' }}
            />
          </div>

          <div style={{ marginBottom: '40px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Content (Markdown Supported)</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows="12"
              style={{ width: '100%', padding: '15px', background: 'var(--glass)', border: '1px solid var(--glass-border)', color: 'white', borderRadius: '10px', resize: 'vertical', fontFamily: 'monospace' }}
              required
            />
          </div>

          <button
            type="submit"
            className="vibrant-gradient"
            disabled={loading}
            style={{ width: '100%', padding: '18px', borderRadius: '15px', color: 'white', fontWeight: 'bold', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
          >
            {loading ? 'Publishing...' : <><Send size={22} /> Publish Blog</>}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default ManualUpload;

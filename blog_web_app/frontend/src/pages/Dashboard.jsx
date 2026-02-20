import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import Cookies from 'js-cookie';
import { LayoutDashboard, FileText, Send, Plus, ExternalLink, RefreshCw, LogOut, ThumbsUp, ThumbsDown, MessageSquare, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

const Dashboard = () => {
  const [stats, setStats] = useState({ totalBlogs: 0 });
  const [agentStatus, setAgentStatus] = useState({ status: 'idle', node: '' });
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('AI');
  const navigate = useNavigate();

  const topics = [
    'AI', 'Sport', 'Current Affairs', 'Politics', 'Geography',
    'Economic', 'Space', 'Geopolitics', 'Indian Politics', 'Software Industries'
  ];

  useEffect(() => {
    const token = Cookies.get('userToken');
    const role = Cookies.get('userRole');

    if (!token) {
      navigate('/login');
      return;
    }

    if (role !== 'admin') {
      alert("You are not admin, you cannot access this page");
      navigate('/');
      return;
    }

    fetchStats();

    // Initial status fetch
    fetchAgentStatus();

    // Polling for agent status
    const interval = setInterval(() => {
      fetchAgentStatus();
    }, 2000);

    return () => clearInterval(interval);
  }, [navigate]);

  const fetchStats = async () => {
    try {
      const res = await api.get('/blogs/dashboard-stats');
      setStats(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const fetchAgentStatus = async () => {
    try {
      const res = await api.get('/blogs/agent-status');
      setAgentStatus(res.data);
      if (res.data.status === 'idle' && triggering) {
        setTriggering(false);
        fetchStats();
      }
    } catch (err) {
      console.error('Status fetch error:', err);
    }
  };

  const handleTriggerAgent = async () => {
    setTriggering(true);
    setMessage('');
    try {
      const res = await api.post('/blogs/trigger-agent', { topic: selectedTopic });
      setMessage(res.data.message);
      setTriggering(false);
    } catch (err) {
      setMessage('Failed to trigger agent.');
      setTriggering(false);
    }
  };

  const handleLogout = () => {
    Cookies.remove('userToken');
    Cookies.remove('username');
    Cookies.remove('userRole');
    navigate('/login');
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;

    try {
      await api.delete(`/blogs/${id}`);
      setMessage(`"${title}" deleted successfully.`);
      fetchStats(); // Refresh the list
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete blog.');
    }
  };

  if (loading) return <div className="container" style={{ paddingTop: '100px' }}>Loading...</div>;

  return (
    <div className="container" style={{ paddingTop: '100px', paddingBottom: '60px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: 'clamp(1.3rem, 4vw, 2rem)' }}>
          <LayoutDashboard className="primary-text" /> Admin Dashboard
        </h1>
        <div style={{ display: 'flex', gap: '15px' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: 'var(--glass)', borderRadius: '12px' }}>
            <ExternalLink size={18} /> View Site
          </Link>
          <button onClick={handleLogout} style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '10px 20px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <LogOut size={18} /> Logout
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(300px, 100%), 1fr))', gap: '24px' }}>
        {/* Stats Card */}
        <motion.div
          className="glass"
          style={{ padding: '30px', position: 'relative', overflow: 'hidden' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <FileText size={40} style={{ color: 'var(--primary)' }} />
              <div style={{ textAlign: 'right' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Blogs</p>
                <h2 style={{ fontSize: '2rem', margin: '0' }}>{stats.totalBlogs}</h2>
              </div>
            </div>

            <p style={{ fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '15px' }}>Engagement Overview</p>
            <div style={{ maxHeight: '200px', overflowY: 'auto', pr: '10px' }}>
              {stats.detailedStats && stats.detailedStats.map(blog => (
                <div key={blog._id} style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', marginBottom: '10px', border: '1px solid var(--glass-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <p style={{ fontSize: '0.85rem', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>{blog.title}</p>
                    <button
                      onClick={() => handleDelete(blog.id, blog.title)}
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0 0 0 10px', opacity: 0.6 }}
                      title="Delete Blog"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div style={{ display: 'flex', gap: '15px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><ThumbsUp size={12} className="primary-text" /> {blog.likes}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><ThumbsDown size={12} style={{ color: '#ef4444' }} /> {blog.dislikes}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MessageSquare size={12} style={{ color: 'var(--secondary)' }} /> {blog.comments}</span>
                  </div>
                </div>
              ))}
            </div>

            <button onClick={fetchStats} style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--primary)', background: 'none', border: 'none', fontSize: '0.8rem', marginTop: '15px', cursor: 'pointer' }}>
              <RefreshCw size={14} /> Refresh engagement data
            </button>
          </div>
          <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '150px', height: '150px', background: 'var(--primary)', filter: 'blur(80px)', opacity: 0.1 }}></div>
        </motion.div>

        {/* AI Agent Card */}
        <motion.div
          className="glass"
          style={{ padding: '30px', borderLeft: '4px solid var(--secondary)' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', margin: '20px 0' }}>
            {/* 80x80 Log Square */}
            <div style={{
              width: '80px',
              minWidth: '80px',
              height: '80px',
              background: agentStatus.status === 'running' ? 'var(--secondary)' : 'var(--glass)',
              border: '2px solid ' + (agentStatus.status === 'running' ? 'white' : 'var(--glass-border)'),
              borderRadius: '15px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              boxShadow: agentStatus.status === 'running' ? '0 0 20px rgba(236, 72, 153, 0.4)' : 'none',
              animation: agentStatus.status === 'running' ? 'pulse 2s infinite' : 'none',
              transition: '0.5s ease',
              overflow: 'hidden'
            }}>
              <p style={{ fontSize: '0.6rem', fontWeight: 'bold', color: 'white', opacity: 0.8, marginBottom: '4px' }}>STAGE</p>
              <p style={{ fontSize: '0.7rem', fontWeight: 'bold', color: 'white', wordBreak: 'break-all', padding: '0 5px', lineHeight: '1.1' }}>
                {agentStatus.node || 'IDLE'}
              </p>
            </div>

            <div style={{ flex: 1 }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <Send size={20} style={{ color: 'var(--secondary)' }} /> AI Agent Trigger
              </h3>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Select Topic:</label>
                <select
                  value={selectedTopic}
                  onChange={(e) => setSelectedTopic(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: 'var(--glass)',
                    border: '1px solid var(--glass-border)',
                    color: 'white',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    outline: 'none'
                  }}
                >
                  {topics.map(t => <option key={t} value={t} style={{ background: '#121212' }}>{t}</option>)}
                </select>
              </div>
              {agentStatus.topic ? (
                <p style={{ fontSize: '0.9rem', color: 'var(--text)', fontWeight: 'bold', background: 'rgba(255,255,255,0.05)', padding: '5px 10px', borderRadius: '8px', borderLeft: '3px solid var(--secondary)' }}>
                  Topic: {agentStatus.topic}
                </p>
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Research & write a new blog post automatically.</p>
              )}
            </div>
          </div>

          {message && (
            <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderRadius: '10px', marginBottom: '15px', fontSize: '0.9rem' }}>
              {message}
            </div>
          )}

          <button
            onClick={handleTriggerAgent}
            disabled={triggering}
            className="vibrant-gradient"
            style={{ width: '100%', padding: '15px', borderRadius: '12px', color: 'white', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
          >
            {triggering ? <RefreshCw className="animate-spin" size={20} /> : <><Plus size={20} /> Generate AI Blog</>}
          </button>
        </motion.div>

        {/* Manual Links */}
        <motion.div
          className="glass"
          style={{ padding: '30px' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Plus size={40} style={{ color: 'var(--accent)', marginBottom: '20px' }} />
          <h3>Quick Actions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
            <Link to="/upload" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '15px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
              <div style={{ background: 'var(--accent)', width: '30px', height: '30px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Plus size={18} color="white" />
              </div>
              <div>
                <p style={{ fontWeight: 'bold' }}>Manual Upload</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Write and publish it yourself</p>
              </div>
            </Link>
          </div>
        </motion.div>
      </div>

      <style>{`
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(236, 72, 153, 0.7); }
          70% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(236, 72, 153, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(236, 72, 153, 0); }
        }
        .primary-text {
          color: var(--primary);
        }
      `}</style>
    </div>
  );
};

export default Dashboard;

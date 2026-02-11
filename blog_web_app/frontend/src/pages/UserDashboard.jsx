import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Cookies from 'js-cookie';
import { User, FileText, ThumbsUp, ThumbsDown, MessageSquare, Trash2, Calendar, ArrowRight, LogOut, LayoutDashboard, Home } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const UserDashboard = () => {
  const [activity, setActivity] = useState({
    ownPosts: [],
    likedPosts: [],
    dislikedPosts: [],
    userComments: []
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('posts'); // posts, activity, comments
  const navigate = useNavigate();

  const username = Cookies.get('username');
  const role = Cookies.get('userRole');

  useEffect(() => {
    const token = Cookies.get('userToken');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchActivity();
  }, [navigate]);

  const fetchActivity = async () => {
    try {
      const token = Cookies.get('userToken');
      const res = await axios.get('/api/blogs/user-activity', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setActivity(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;

    try {
      const token = Cookies.get('userToken');
      await axios.delete(`/api/blogs/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage(`"${title}" deleted successfully.`);
      fetchActivity(); // Refresh
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete blog.');
    }
  };

  const handleLogout = () => {
    Cookies.remove('userToken');
    Cookies.remove('username');
    Cookies.remove('userRole');
    navigate('/login');
  };

  if (loading) return (
    <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} style={{ width: '40px', height: '40px', border: '4px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%' }} />
    </div>
  );

  const TabButton = ({ id, icon: Icon, label, count }) => (
    <button
      onClick={() => setActiveTab(id)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '12px 24px',
        background: activeTab === id ? 'var(--primary)' : 'var(--glass)',
        color: 'white',
        border: 'none',
        borderRadius: '12px',
        cursor: 'pointer',
        fontWeight: 'bold',
        transition: 'all 0.3s ease',
        boxShadow: activeTab === id ? '0 4px 15px rgba(139, 92, 246, 0.4)' : 'none'
      }}
    >
      <Icon size={18} />
      {label}
      <span style={{ fontSize: '0.8rem', opacity: 0.8, padding: '2px 8px', background: 'rgba(0,0,0,0.2)', borderRadius: '10px' }}>{count}</span>
    </button>
  );

  return (
    <div className="container" style={{ paddingTop: '120px', paddingBottom: '100px' }}>
      {/* Profile Header */}
      <div className="glass" style={{ padding: '40px', marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--vibrant-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User size={40} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: '2.4rem', margin: 0 }}>{username}</h1>
            <p style={{ color: 'var(--text-muted)', margin: '5px 0 0 0', textTransform: 'capitalize' }}>{role} Member</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '15px' }}>
          <button onClick={() => navigate('/')} style={{ background: 'var(--glass)', color: 'white', border: '1px solid var(--glass-border)', padding: '10px 20px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <Home size={18} /> Home
          </button>
          {role === 'admin' && (
            <button onClick={() => navigate('/dashboard')} style={{ background: 'var(--glass)', color: 'white', border: '1px solid var(--glass-border)', padding: '10px 20px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <LayoutDashboard size={18} /> Admin
            </button>
          )}
          <button onClick={handleLogout} style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '10px 20px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <LogOut size={18} /> Logout
          </button>
        </div>
      </div>

      {message && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} style={{ padding: '15px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderRadius: '12px', marginBottom: '30px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
          {message}
        </motion.div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '15px', marginBottom: '40px', overflowX: 'auto', paddingBottom: '10px' }}>
        <TabButton id="posts" icon={FileText} label="My Posts" count={activity.ownPosts.length} />
        <TabButton id="activity" icon={ThumbsUp} label="Interactions" count={activity.likedPosts.length + activity.dislikedPosts.length} />
        <TabButton id="comments" icon={MessageSquare} label="My Comments" count={activity.userComments.length} />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'posts' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '25px' }}>
              {activity.ownPosts.length > 0 ? (
                activity.ownPosts.map(blog => (
                  <div key={blog._id} className="glass" style={{ padding: '25px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                      <h3 style={{ fontSize: '1.3rem', margin: 0 }}>{blog.title}</h3>
                      <button onClick={() => handleDelete(blog._id, blog.title)} style={{ color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                        <Trash2 size={20} />
                      </button>
                    </div>
                    <div style={{ display: 'flex', gap: '15px', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={14} /> {new Date(blog.date).toLocaleDateString()}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><ThumbsUp size={14} /> {blog.likes.length}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><ThumbsDown size={14} /> {blog.dislikes.length}</span>
                    </div>
                    <Link to={`/blog/${blog.slug}`} className="vibrant-gradient" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px', color: 'white', textDecoration: 'none', fontSize: '0.9rem' }}>
                      View Details <ArrowRight size={16} />
                    </Link>
                  </div>
                ))
              ) : (
                <div className="glass" style={{ padding: '60px', textAlign: 'center', gridColumn: '1 / -1' }}>
                  <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>No blogs published yet.</p>
                  <button onClick={() => navigate('/upload')} className="vibrant-gradient" style={{ padding: '12px 30px', borderRadius: '10px', color: 'white', fontWeight: 'bold', border: 'none', cursor: 'pointer', marginTop: '15px' }}>
                    Create Your First Blog
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'activity' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
              <div>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}><ThumbsUp color="#10b981" /> Liked Posts</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {activity.likedPosts.length > 0 ? activity.likedPosts.map(blog => (
                    <div key={blog._id} className="glass" style={{ padding: '20px' }}>
                      <p style={{ fontSize: '1.1rem', margin: '0 0 10px 0' }}>{blog.title}</p>
                      <Link to={`/blog/${blog.slug}`} style={{ color: 'var(--primary)', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 'bold' }}>View Project →</Link>
                    </div>
                  )) : <p style={{ color: 'var(--text-muted)' }}>No likes yet</p>}
                </div>
              </div>
              <div>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}><ThumbsDown color="#ef4444" /> Disliked Posts</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {activity.dislikedPosts.length > 0 ? activity.dislikedPosts.map(blog => (
                    <div key={blog._id} className="glass" style={{ padding: '20px' }}>
                      <p style={{ fontSize: '1.1rem', margin: '0 0 10px 0' }}>{blog.title}</p>
                      <Link to={`/blog/${blog.slug}`} style={{ color: 'var(--primary)', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 'bold' }}>View Project →</Link>
                    </div>
                  )) : <p style={{ color: 'var(--text-muted)' }}>No dislikes yet</p>}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'comments' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {activity.userComments.length > 0 ? activity.userComments.map(item => (
                <div key={item._id} className="glass" style={{ padding: '25px' }}>
                  <div style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '15px', marginBottom: '15px' }}>
                    <Link to={`/blog/${item.blogSlug}`} style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'white', textDecoration: 'none' }}>
                      {item.blogTitle}
                    </Link>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {item.comments.map(c => (
                      <div key={c._id} style={{ background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '10px' }}>
                        <p style={{ margin: '0 0 8px 0', lineHeight: 1.5 }}>{c.text}</p>
                        <time style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(c.date).toLocaleString()}</time>
                      </div>
                    ))}
                  </div>
                </div>
              )) : (
                <div className="glass" style={{ padding: '60px', textAlign: 'center' }}>
                  <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>You haven't commented on any blogs yet.</p>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default UserDashboard;

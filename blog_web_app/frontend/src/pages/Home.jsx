import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { motion } from 'framer-motion';
import { Search, Calendar, User, ArrowRight, Tag, LogOut, LayoutDashboard } from 'lucide-react';

const Home = () => {
  const [blogs, setBlogs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const username = Cookies.get('username');
    const role = Cookies.get('userRole');
    if (username) {
      setUser({ username, role });
    }

    const fetchBlogs = async () => {
      try {
        const { data } = await axios.get('/api/blogs');
        setBlogs(data);

        // Extract unique categories safely
        const allCategories = data.flatMap(b => b.categories || []);
        const cats = ['All', ...new Set(allCategories)];
        setCategories(cats);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };
    fetchBlogs();
  }, []);

  const filteredBlogs = activeCategory === 'All'
    ? blogs
    : blogs.filter(b => b.categories.includes(activeCategory));

  return (
    <div className="home-container" style={{ position: 'relative' }}>
      {/* Hero Section */}
      <header className="hero container animate-fade" style={{ paddingTop: '150px', paddingBottom: '60px', textAlign: 'center' }}>
        <motion.h1
          className="text-gradient"
          style={{ fontSize: '4rem', marginBottom: '20px' }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          Insights from the Agent
        </motion.h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', maxWidth: '700px', margin: '0 auto' }}>
          Explore the latest in tech, AI, and startups, curated daily by our autonomous blog agent and manually by our experts.
        </p>
      </header>

      {/* Category Filter */}
      <section className="container" style={{ marginBottom: '40px' }}>
        <div className="glass" style={{ padding: '10px', display: 'flex', gap: '10px', overflowX: 'auto', whiteSpace: 'nowrap' }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={activeCategory === cat ? 'vibrant-gradient' : ''}
              style={{
                background: activeCategory === cat ? '' : 'var(--glass)',
                padding: '8px 20px',
                borderRadius: '12px',
                color: 'white',
                fontWeight: '500'
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Blog Grid */}
      <main className="container blog-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '30px', paddingBottom: '100px' }}>
        {loading ? (
          <p>Loading the latest stories...</p>
        ) : filteredBlogs.length > 0 ? (
          filteredBlogs.map((blog, idx) => (
            <motion.article
              key={blog._id}
              className="glass"
              style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ y: -5, boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}
            >
              {blog.bannerImage && (
                <div style={{ height: '200px', width: '100%', overflow: 'hidden' }}>
                  <img src={blog.bannerImage} alt={blog.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}
              <div style={{ padding: '25px', flex: 1 }}>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '15px', flexWrap: 'wrap' }}>
                  {(blog.categories || []).map(c => (
                    <span key={c} style={{ fontSize: '0.75rem', padding: '4px 10px', background: 'rgba(139, 92, 246, 0.2)', borderRadius: '20px', color: 'var(--primary)' }}>
                      {c}
                    </span>
                  ))}
                </div>
                <h2 style={{ fontSize: '1.4rem', marginBottom: '12px' }}>{blog.title || 'Untitled'}</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '20px', display: '-webkit-box', WebkitLineClamp: '3', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {blog.summary || (blog.content ? blog.content.substring(0, 150) + '...' : 'No content available')}
                </p>
                <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '15px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={14} /> {new Date(blog.date).toLocaleDateString()}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><User size={14} /> {blog.author}</span>
                  </div>
                  <Link to={`/blog/${blog.slug}`} style={{ color: 'var(--primary)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    Read <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            </motion.article>
          ))
        ) : (
          <p>No blogs found in this category.</p>
        )}
      </main>
    </div>
  );
};

export default Home;

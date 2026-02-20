import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import ReactMarkdown from 'react-markdown';
import { Calendar, User, ArrowLeft, Tag, ThumbsUp, ThumbsDown, MessageSquare, Send, Bot, X, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Cookies from 'js-cookie';

const BlogDetail = () => {
  const { slug } = useParams();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [question, setQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    const username = Cookies.get('username');
    if (username) setUser({ username });
  }, []);

  const [scrollProgress, setScrollProgress] = useState(0);

  const fetchBlog = async () => {
    try {
      const { data } = await api.get(`/blogs/${slug}`);
      setBlog(data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const fetchComments = async (blogId) => {
    try {
      const { data } = await api.get(`/blogs/${blogId}/comments`);
      setComments(data);
    } catch (err) {
      console.error('Failed to fetch comments:', err);
    }
  };

  useEffect(() => {
    const loadBlog = async () => {
      try {
        const { data } = await api.get(`/blogs/${slug}`);
        setBlog(data);
        setLoading(false);
        fetchComments(data._id);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };
    loadBlog();
    window.scrollTo(0, 0);

    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollTop;
      const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scroll = `${(totalScroll / windowHeight) * 100}%`;
      setScrollProgress(scroll);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [slug]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Link copied to clipboard!');
  };

  const handleEngagement = async (type) => {
    if (!user) {
      alert('Please login to like or dislike this blog.');
      return;
    }
    try {
      const { data } = await api.post(`/blogs/${blog._id}/${type}`);
      setBlog(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setSubmitting(true);
    try {
      await api.post(`/blogs/${blog._id}/comment`, { text: commentText });
      setCommentText('');
      fetchComments(blog._id);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAskAI = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;

    const userMsg = { role: 'user', text: question };
    setChatHistory(prev => [...prev, userMsg]);
    setQuestion('');
    setChatLoading(true);

    try {
      const { data } = await api.post(`/blogs/${blog._id}/ask`, { question });
      const aiMsg = { role: 'ai', text: data.answer };
      setChatHistory(prev => [...prev, aiMsg]);
    } catch (err) {
      console.error(err);
      setChatHistory(prev => [...prev, { role: 'error', text: 'Sorry, I couldn\'t process that question.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  if (loading) return (
    <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} style={{ width: '40px', height: '40px', border: '4px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%' }} />
    </div>
  );

  if (!blog) return <div className="container" style={{ padding: '100px' }}>Blog not found. <Link to="/">Go Home</Link></div>;

  return (
    <>
      <div className="reading-progress-container">
        <div className="reading-progress-bar" style={{ width: scrollProgress }} />
      </div>

      <motion.div
        className="container"
        style={{ paddingTop: '100px', paddingBottom: '60px', maxWidth: '850px', padding: '100px 1rem 60px' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', marginBottom: '40px', width: 'fit-content' }}>
          <ArrowLeft size={20} /> Back to Grid
        </Link>

        <header style={{ marginBottom: '50px' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '25px', flexWrap: 'wrap' }}>
            {blog.categories.map(c => (
              <span key={c} style={{ fontSize: '0.8rem', padding: '6px 16px', fontWeight: '600', background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.2)', borderRadius: '20px', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {c}
              </span>
            ))}
          </div>
          <h1 className="text-gradient" style={{ fontSize: 'clamp(1.8rem, 5vw, 3.5rem)', lineHeight: '1.1', marginBottom: '20px', fontWeight: '800' }}>{blog.title}</h1>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', borderBottom: '1px solid var(--glass-border)', paddingBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}><Calendar size={16} /> {new Date(blog.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}><User size={16} /> {blog.author}</span>
            </div>
            <button onClick={handleShare} style={{ background: 'var(--glass)', border: '1px solid var(--glass-border)', color: 'white', padding: '8px 14px', borderRadius: '10px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <Sparkles size={14} /> Share
            </button>
          </div>
        </header>

        {blog.bannerImage && (
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={{ width: '100%', borderRadius: '16px', overflow: 'hidden', marginBottom: '40px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', maxHeight: '450px' }}
          >
            <img src={blog.bannerImage} alt={blog.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </motion.div>
        )}

        <article className="markdown-content" style={{ fontSize: 'clamp(1rem, 2.5vw, 1.2rem)', marginBottom: '40px' }}>
          <ReactMarkdown>{blog.content}</ReactMarkdown>
        </article>

        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '50px', padding: '20px', background: 'var(--glass)', borderRadius: '16px', border: '1px solid var(--glass-border)', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '20px' }}>
            <motion.button
              onClick={() => handleEngagement('like')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--glass-border)',
                color: 'white',
                cursor: 'pointer',
                padding: '12px 24px',
                borderRadius: '16px'
              }}
              whileHover={{ scale: 1.05, background: 'rgba(139, 92, 246, 0.1)', borderColor: 'var(--primary)' }}
              whileTap={{ scale: 0.95 }}
            >
              <ThumbsUp size={22} className="primary-text" />
              <span style={{ fontWeight: '700' }}>{blog.likes?.length || 0}</span>
            </motion.button>

            <motion.button
              onClick={() => handleEngagement('dislike')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--glass-border)',
                color: 'white',
                cursor: 'pointer',
                padding: '12px 24px',
                borderRadius: '16px'
              }}
              whileHover={{ scale: 1.05, background: 'rgba(239, 68, 68, 0.05)', borderColor: '#ef4444' }}
              whileTap={{ scale: 0.95 }}
            >
              <ThumbsDown size={22} style={{ color: '#ef4444' }} />
              <span style={{ fontWeight: '700' }}>{blog.dislikes?.length || 0}</span>
            </motion.button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.1rem', fontWeight: '600' }}>
            <MessageSquare size={22} className="primary-text" /> {comments.length} Comments
          </div>
        </div>

        {/* Comment Section */}
        <section style={{ marginBottom: '80px' }}>
          <h3 style={{ marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <MessageSquare className="primary-text" /> Discussions
          </h3>

          {user ? (
            <form onSubmit={handleComment} style={{ marginBottom: '40px' }}>
              <div style={{ position: 'relative' }}>
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Share your thoughts..."
                  style={{ width: '100%', height: '120px', padding: '20px', borderRadius: '16px', background: 'var(--glass)', border: '1px solid var(--glass-border)', color: 'white', fontSize: '1rem', resize: 'none', outline: 'none' }}
                />
                <button
                  type="submit"
                  className="vibrant-gradient"
                  disabled={submitting}
                  style={{ position: 'absolute', bottom: '15px', right: '15px', padding: '8px 20px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px', border: 'none', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  {submitting ? 'Posting...' : <><Send size={18} /> Post</>}
                </button>
              </div>
            </form>
          ) : (
            <div style={{ padding: '30px', background: 'rgba(139, 92, 246, 0.05)', border: '1px dashed var(--glass-border)', borderRadius: '16px', textAlign: 'center', marginBottom: '40px' }}>
              <p style={{ color: 'var(--text-muted)' }}>
                Join the conversation! <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>Login</Link> to share a comment.
              </p>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <AnimatePresence>
              {comments.map((comment, index) => (
                <motion.div
                  key={comment._id || index}
                  className="glass"
                  style={{ padding: '20px', borderRadius: '16px' }}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', alignItems: 'center' }}>
                    <span style={{ fontWeight: 'bold', color: 'var(--primary)', fontSize: '0.95rem' }}>@{comment.username}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(comment.date).toLocaleDateString()}</span>
                  </div>
                  <p style={{ lineHeight: '1.6', fontSize: '1rem' }}>{comment.text}</p>
                </motion.div>
              ))}
            </AnimatePresence>
            {comments.length === 0 && (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', paddingTop: '20px' }}>No comments yet. Be the first to start the discussion!</p>
            )}
          </div>
        </section>

        <div style={{ marginTop: '60px', padding: '30px', borderTop: '1px solid var(--glass-border)', textAlign: 'center' }}>
          <h3 style={{ marginBottom: '20px' }}>Inspired by this post?</h3>
          <Link to="/" className="vibrant-gradient" style={{ padding: '12px 30px', borderRadius: '12px', fontWeight: 'bold', display: 'inline-block' }}>
            Explore More Topics
          </Link>
        </div>

        {/* Floating RAG Icon */}
        <motion.button
          onClick={() => setShowChat(true)}
          className="vibrant-gradient"
          style={{
            position: 'fixed',
            bottom: '30px',
            right: '30px',
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none',
            color: 'white',
            boxShadow: '0 10px 30px rgba(139, 92, 246, 0.4)',
            cursor: 'pointer',
            zIndex: 1000
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <Bot size={30} />
        </motion.button>

        {/* RAG Chat Sidebar */}
        <AnimatePresence>
          {showChat && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowChat(false)}
                style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', zIndex: 1001 }}
              />
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                style={{
                  position: 'fixed',
                  top: 0,
                  right: 0,
                  width: 'min(400px, 100vw)',
                  height: '100vh',
                  background: 'rgba(15, 12, 41, 0.95)',
                  backdropFilter: 'blur(20px)',
                  borderLeft: '1px solid var(--glass-border)',
                  zIndex: 1002,
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: '-20px 0 50px rgba(0,0,0,0.5)'
                }}
              >
                <div style={{ padding: '25px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Bot className="primary-text" />
                    <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Ask AI about this Post</h3>
                  </div>
                  <button onClick={() => setShowChat(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                    <X />
                  </button>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {chatHistory.length === 0 && (
                    <div style={{ textAlign: 'center', paddingTop: '40px', color: 'var(--text-muted)' }}>
                      <Sparkles size={40} style={{ marginBottom: '15px', opacity: 0.5 }} />
                      <p>I've read this entire blog! Ask me anything about it.</p>
                    </div>
                  )}
                  {chatHistory.map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      style={{
                        alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                        maxWidth: '85%',
                        padding: '12px 18px',
                        borderRadius: '16px',
                        fontSize: '0.95rem',
                        background: msg.role === 'user' ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                        border: msg.role === 'user' ? 'none' : '1px solid var(--glass-border)'
                      }}
                    >
                      {msg.text}
                    </motion.div>
                  ))}
                  {chatLoading && (
                    <div style={{ alignSelf: 'flex-start', background: 'rgba(255,255,255,0.05)', padding: '12px 18px', borderRadius: '16px' }}>
                      AI is thinking...
                    </div>
                  )}
                </div>

                <form onSubmit={handleAskAI} style={{ padding: '20px', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid var(--glass-border)' }}>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      placeholder="Ask a question..."
                      style={{
                        width: '100%',
                        padding: '15px 50px 15px 20px',
                        borderRadius: '12px',
                        background: 'var(--glass)',
                        border: '1px solid var(--glass-border)',
                        color: 'white',
                        outline: 'none'
                      }}
                    />
                    <button
                      type="submit"
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: 'var(--primary)',
                        cursor: 'pointer'
                      }}
                    >
                      <Send size={20} />
                    </button>
                  </div>
                </form>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
};

export default BlogDetail;

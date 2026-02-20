import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Github, Linkedin, Twitter, Mail, ArrowUp, Sparkles, BookOpen, Code2, Cpu } from 'lucide-react';
import { motion } from 'framer-motion';

const Footer = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { label: 'Home', to: '/' },
    { label: 'Login', to: '/login' },
    { label: 'Sign Up', to: '/signup' },
    { label: 'Upload Blog', to: '/upload' },
  ];

  const categories = ['AI', 'Technology', 'Space', 'Politics', 'Sports', 'Economics'];

  return (
    <footer style={{
      position: 'relative',
      marginTop: '40px',
      borderTop: '1px solid var(--glass-border)',
      background: 'linear-gradient(180deg, transparent 0%, rgba(10, 10, 18, 0.95) 20%)',
      overflow: 'hidden'
    }}>
      {/* Decorative top gradient line */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '60%',
        height: '1px',
        background: 'linear-gradient(90deg, transparent, var(--primary), var(--secondary), var(--primary), transparent)',
      }} />

      {/* Decorative background glow */}
      <div style={{
        position: 'absolute',
        bottom: '-100px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(139, 92, 246, 0.06) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      {/* Main Footer Content */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '40px 1rem 0',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '50px',
          marginBottom: '50px'
        }}>
          {/* Brand Column */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)'
              }}>
                <Sparkles size={20} color="white" />
              </div>
              <span style={{
                fontFamily: 'var(--font-accent)',
                fontSize: '1.6rem',
                fontWeight: '800',
                background: 'linear-gradient(135deg, #fff 30%, var(--primary))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>Mor</span>
            </div>
            <p style={{
              color: 'var(--text-muted)',
              fontSize: '0.9rem',
              lineHeight: '1.7',
              maxWidth: '280px',
              marginBottom: '25px'
            }}>
              A next-gen AI-powered blog platform where creativity meets intelligence.
              Fresh insights delivered daily by humans and AI alike.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              {[
                { icon: Github, href: 'https://github.com/LuckyChauhan18', label: 'GitHub' },
                { icon: Linkedin, href: 'https://linkedin.com', label: 'LinkedIn' },
                { icon: Twitter, href: 'https://twitter.com', label: 'Twitter' },
                { icon: Mail, href: 'mailto:contact@mor.blog', label: 'Email' },
              ].map(({ icon: Icon, href, label }) => (
                <motion.a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  whileHover={{ scale: 1.15, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid var(--glass-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-muted)',
                    transition: 'all 0.3s ease',
                  }}
                >
                  <Icon size={16} />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 style={{
              fontSize: '0.8rem',
              textTransform: 'uppercase',
              letterSpacing: '1.5px',
              color: 'var(--primary)',
              marginBottom: '20px',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <BookOpen size={14} /> Quick Links
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {quickLinks.map(link => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    style={{
                      color: 'var(--text-muted)',
                      fontSize: '0.9rem',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.color = 'white';
                      e.target.style.paddingLeft = '6px';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.color = 'var(--text-muted)';
                      e.target.style.paddingLeft = '0px';
                    }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 style={{
              fontSize: '0.8rem',
              textTransform: 'uppercase',
              letterSpacing: '1.5px',
              color: 'var(--primary)',
              marginBottom: '20px',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Cpu size={14} /> Categories
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {categories.map(cat => (
                <span
                  key={cat}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '0.8rem',
                    background: 'rgba(139, 92, 246, 0.08)',
                    border: '1px solid rgba(139, 92, 246, 0.15)',
                    color: 'var(--text-muted)',
                    fontWeight: '500',
                  }}
                >
                  {cat}
                </span>
              ))}
            </div>
          </div>

          {/* Tech Stack */}
          <div>
            <h4 style={{
              fontSize: '0.8rem',
              textTransform: 'uppercase',
              letterSpacing: '1.5px',
              color: 'var(--primary)',
              marginBottom: '20px',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Code2 size={14} /> Built With
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { name: 'React + Vite', detail: 'Frontend' },
                { name: 'Node.js + Express', detail: 'Backend' },
                { name: 'MongoDB Atlas', detail: 'Database' },
                { name: 'Redis', detail: 'Caching' },
                { name: 'LangChain + OpenRouter', detail: 'AI Engine' },
              ].map(item => (
                <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{item.name}</span>
                  <span style={{
                    fontSize: '0.7rem',
                    color: 'var(--accent)',
                    background: 'rgba(16, 185, 129, 0.08)',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontWeight: '600'
                  }}>{item.detail}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div style={{
          borderTop: '1px solid var(--glass-border)',
          padding: '25px 0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '15px'
        }}>
          <p style={{
            color: 'var(--text-muted)',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            © {currentYear} Mor. Crafted with <Heart size={14} style={{ color: 'var(--secondary)' }} /> by Lucky Chauhan
          </p>

          <motion.button
            onClick={scrollToTop}
            whileHover={{ scale: 1.1, y: -3 }}
            whileTap={{ scale: 0.9 }}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
              border: 'none',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)',
            }}
            aria-label="Scroll to top"
          >
            <ArrowUp size={18} />
          </motion.button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

"use client";

import React, { useState } from 'react';
import Link from "next/link";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import toast, { Toaster } from "react-hot-toast";
import { useSession } from "next-auth/react";

export default function ContactPage() {
  const { data: session } = useSession();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    if (!name.trim() || !email.trim() || !message.trim()) {
        toast.error("Please fill out all fields.");
        setIsLoading(false);
        return;
    }

    try {
        const response = await fetch('/api/contact', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, email, message }),
        });

        const result = await response.json();

        if (response.ok) {
            toast.success('Message sent successfully!');
            setName('');
            setEmail('');
            setMessage('');
        } else {
            toast.error(result.error || 'Failed to send message.');
        }
    } catch (error) {
        toast.error('An unexpected error occurred.');
        console.error("Fetch error:", error);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{
      '--bg': '#0f1320',
      '--text': '#e7ecf5',
      '--muted': '#9aa4b2',
      '--cta': '#8856ff',
      '--cta-2': '#a854ff',
      '--accent': '#6ae2ff'
    } as React.CSSProperties}>
      <Toaster position="top-center" />
      
      <style jsx global>{`
        :root {
          --bg: #0f1320;
          --text: #e7ecf5;
          --muted: #9aa4b2;
          --cta: #8856ff;
          --cta-2: #a854ff;
          --accent: #6ae2ff;
        }
        * {
          box-sizing: border-box;
        }
        body {
          margin: 0;
          font-family: Inter, system-ui, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
          background:
            radial-gradient(1200px 600px at -10% -10%, #1a1f35 2%, transparent 60%),
            radial-gradient(900px 500px at 110% -5%, #1a1f35 5%, transparent 65%),
            var(--bg);
          color: var(--text);
        }
        a {
          color: inherit;
          text-decoration: none;
        }
        .container {
          max-width: 1240px;
          margin: 0 auto;
          padding: 24px;
        }
        .nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .logo {
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 800;
          font-size: 20px;
          transition: opacity 0.2s ease;
        }
        .logo:hover {
          opacity: 0.8;
        }
        .logo-badge {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          display: grid;
          place-items: center;
          background: linear-gradient(135deg, var(--cta), var(--accent));
          color: #08101b;
          font-weight: 900;
        }
        .navlinks {
          display: flex;
          gap: 26px;
          color: #c9d2e2;
        }
        .btn {
          padding: 12px 18px;
          border-radius: 12px;
          border: 1px solid #2a2f44;
          background: #161a2c;
          color: #e8edfb;
          font-weight: 600;
          transition: all 0.2s ease;
        }
        .btn:hover {
          background: #1e2541;
          border-color: #3a4161;
        }
        .btn.primary {
          background: linear-gradient(90deg, var(--cta), var(--cta-2));
          border: none;
          color: #fff;
        }
        .btn.primary:hover {
          background: linear-gradient(90deg, #7a4bff, #9a44ff);
        }
        .eyebrow {
          color: #a8b1c6;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          font-size: 12px;
        }
        .title {
          font-size: 48px;
          line-height: 1.05;
          font-weight: 800;
          margin: 16px 0;
          letter-spacing: -0.02em;
          color: #e7ecf5;
        }
        .sub {
          color: #b7c1d6;
          max-width: 600px;
          margin: 0 auto;
          font-size: 18px;
        }
        .contact-form {
          background: linear-gradient(180deg, #12182c, #0f1325);
          border: 1px solid #1e2541;
          border-radius: 20px;
          padding: 48px;
          max-width: 600px;
          margin: 0 auto;
        }
        .form-group {
          margin-bottom: 24px;
        }
        .form-label {
          display: block;
          color: #e7ecf5;
          font-weight: 600;
          margin-bottom: 8px;
          font-size: 14px;
        }
        .form-input {
          width: 100%;
          padding: 16px;
          background: #0e142c;
          border: 1px solid #2a3261;
          border-radius: 12px;
          color: #dfe6ff;
          font-size: 16px;
          transition: all 0.2s ease;
        }
        .form-input:focus {
          outline: none;
          border-color: #8856ff;
          box-shadow: 0 0 0 3px rgba(136, 86, 255, 0.1);
        }
        .form-input::placeholder {
          color: #8ca0c5;
        }
        .form-textarea {
          min-height: 150px;
          resize: vertical;
        }
        .submit-btn {
          width: 100%;
          padding: 16px;
          background: linear-gradient(90deg, var(--cta), var(--cta-2));
          color: white;
          border: none;
          border-radius: 12px;
          font-weight: 600;
          font-size: 16px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .submit-btn:hover:not(:disabled) {
          background: linear-gradient(90deg, #7a4bff, #9a44ff);
        }
        .submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .contact-info {
          background: linear-gradient(180deg, #0a0e1a, #0f1320);
          padding: 80px 0;
          margin-top: 80px;
        }
        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 32px;
          margin-top: 48px;
        }
        .info-item {
          background: linear-gradient(180deg, #12182c, #0f1325);
          border: 1px solid #1e2541;
          border-radius: 16px;
          padding: 32px;
          text-align: center;
        }
        .info-icon {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #8856ff, #6ae2ff);
          border-radius: 12px;
          display: grid;
          place-items: center;
          margin: 0 auto 16px;
          color: #0b0f1a;
          font-weight: 900;
        }
        .info-title {
          font-size: 18px;
          font-weight: 600;
          color: #e7ecf5;
          margin-bottom: 8px;
        }
        .info-content {
          color: #b7c1d6;
          line-height: 1.6;
        }
        .footer {
          background: #0a0e1a;
          border-top: 1px solid #1e2541;
          padding: 24px;
        }
        .footer-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          max-width: 1240px;
          margin: 0 auto;
        }
        .footer-links {
          display: flex;
          gap: 24px;
        }
        .footer-links a {
          color: #9aa4b2;
          font-size: 14px;
          transition: color 0.2s ease;
        }
        .footer-links a:hover {
          color: #e7ecf5;
        }
      `}</style>

      <header className="container">
        <nav className="nav">
          <Link href="/" className="logo">
            <div className="logo-badge">+</div>
            <span>Health<span style={{ color: '#7ae2ff' }}>Consultant</span></span>
          </Link>
          <div className="navlinks">
            <a href="/#features">Features</a>
            <a href="/#how-it-works">How it Works</a>
            <a href="/#faq">FAQ</a>
            <a href="/plans">Pricing</a>
            <a href="/contact">Contact</a>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            {session ? (
              <Link className="btn primary" href="/dashboard">Go to Dashboard</Link>
            ) : (
              <>
                <Link className="btn" href="/auth/login">Sign In</Link>
                <Link className="btn primary" href="/auth/signup">Get Started</Link>
              </>
            )}
          </div>
        </nav>
      </header>

      <main className="container" style={{ paddingTop: '60px' }}>
        {/* Page Header */}
        <div style={{ textAlign: 'center', marginBottom: '80px' }}>
          <div className="eyebrow">GET IN TOUCH</div>
          <h1 className="title">Contact Us</h1>
          <p className="sub">
            Have a question or feedback? Fill out the form below to get in touch with our team.
          </p>
        </div>

        {/* Contact Form */}
        <form onSubmit={handleSubmit} className="contact-form">
          <div className="form-group">
            <label className="form-label" htmlFor="name">Name</label>
            <input
              id="name"
              type="text"
              className="form-input"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>
          
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>
          
          <div className="form-group">
            <label className="form-label" htmlFor="message">Message</label>
            <textarea
              id="message"
              className="form-input form-textarea"
              placeholder="Enter your message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>
          
          <button 
            type="submit" 
            className="submit-btn" 
            disabled={isLoading}
          >
            {isLoading ? 'Sending...' : 'Send Message'}
          </button>
        </form>

        {/* Contact Information */}
        <section className="contact-info">
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <div className="eyebrow">WAYS TO REACH US</div>
            <h2 style={{ fontSize: '36px', fontWeight: '800', margin: '16px 0', color: '#e7ecf5' }}>
              Other Ways to Connect
            </h2>
            <p style={{ color: '#b7c1d6', maxWidth: '600px', margin: '0 auto', fontSize: '18px' }}>
              Prefer a different way to get in touch? We&apos;re here to help.
            </p>
          </div>
          
          <div className="info-grid">
            <div className="info-item">
              <div className="info-icon">📧</div>
              <h3 className="info-title">Email Support</h3>
              <p className="info-content">
                Send us an email at contact@healthconsultant.ai and we&apos;ll get back to you within 24 hours.
              </p>
            </div>
            
            <div className="info-item">
              <div className="info-icon">💬</div>
              <h3 className="info-title">Live Chat</h3>
              <p className="info-content">
                Chat with our AI assistant 24/7 for instant help with your questions and concerns.
              </p>
            </div>
            

            <div className="info-item">
              <div className="info-icon">📖</div>
              <h3 className="info-title">Help Center</h3>
              <p className="info-content">
                Browse our comprehensive knowledge base for answers to common questions.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <p style={{ color: '#9aa4b2', fontSize: '14px' }}>
            © 2025 HealthConsultant. All rights reserved.
          </p>
          <div className="footer-links">
            <Link href="/terms">Terms of Service</Link>
            <Link href="/privacy">Privacy Policy</Link>
            <Link href="/contact">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
} 
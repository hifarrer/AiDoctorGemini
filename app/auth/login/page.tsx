"use client";

import Link from "next/link";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const result = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    setIsLoading(false);

    if (result?.error) {
      toast.error(result.error);
    } else {
      router.push("/dashboard");
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotPasswordLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: forgotPasswordEmail }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(result.message);
        setShowForgotPassword(false);
        setForgotPasswordEmail("");
      } else {
        toast.error(result.error || 'Failed to send reset email.');
      }
    } catch (error) {
      toast.error('An unexpected error occurred.');
      console.error("Forgot password error:", error);
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{
      background:
        'radial-gradient(1200px 600px at -10% -10%, #1a1f35 2%, transparent 60%),\nradial-gradient(900px 500px at 110% -5%, #1a1f35 5%, transparent 65%),\n#0f1320',
      color: '#e7ecf5'
    }}>
      <div className="max-w-5xl mx-auto px-6 py-10">
        <nav className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-extrabold text-lg">
            <div className="w-8 h-8 rounded-xl grid place-items-center" style={{ background: 'linear-gradient(135deg,#8856ff,#6ae2ff)', color: '#08101b' }}>+</div>
            <span>Health<span style={{ color: '#7ae2ff' }}>Consultant</span></span>
          </Link>
          <Link href="/" className="text-sm text-[#c9d2e2] hover:opacity-80">Back to site</Link>
        </nav>

        <div className="grid md:grid-cols-2 gap-8 mt-10 items-center">
          <div className="hidden md:block">
            <h1 className="text-4xl font-extrabold leading-tight">
              Welcome Back to <span style={{ background: 'linear-gradient(90deg,#8a6bff,#c87cff,#8a6bff)', WebkitBackgroundClip: 'text', color: 'transparent' }}>your AI</span>
              <br /> Health <span style={{ background: 'linear-gradient(90deg,#6ae2ff,#7df3cf,#6ae2ff)', WebkitBackgroundClip: 'text', color: 'transparent' }}>Assistant</span>
            </h1>
            <p className="mt-4 text-[#b7c1d6]">Log in to continue your private, AI-guided wellness journey.</p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-xl p-4 border" style={{ background: 'linear-gradient(180deg,#12182c,#0f1325)', borderColor: '#1e2541' }}>
                <p className="text-sm text-[#9fb0cf]">HIPAA-friendly</p>
              </div>
              <div className="rounded-xl p-4 border" style={{ background: 'linear-gradient(180deg,#12182c,#0f1325)', borderColor: '#1e2541' }}>
                <p className="text-sm text-[#9fb0cf]">24/7 secure access</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl p-6 md:p-8 border shadow-lg" style={{ background: 'linear-gradient(180deg,#12182c,#0f1325)', borderColor: '#1e2541' }}>
            <div className="text-center">
              <HeartPulseIcon className="w-8 h-8 mx-auto" />
              <h2 className="text-2xl font-bold mt-2">Sign in to your account</h2>
              <p className="text-sm text-[#9aa4b2]">Use your email and password</p>
            </div>

            <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm mb-1 text-[#c9d2e2]" htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="w-full rounded-md px-3 py-2 text-sm"
                  style={{ background: '#0f1325', border: '1px solid #1e2541', color: '#e7ecf5' }}
                  required
                />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-sm mb-1 text-[#c9d2e2]" htmlFor="password">Password</label>
                  <button 
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-xs text-[#7ae2ff] hover:opacity-80"
                  >
                    Forgot password?
                  </button>
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="w-full rounded-md px-3 py-2 text-sm"
                  style={{ background: '#0f1325', border: '1px solid #1e2541', color: '#e7ecf5' }}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-lg py-2.5 text-sm font-semibold"
                style={{ background: 'linear-gradient(90deg,#8856ff,#a854ff)', color: '#fff' }}
              >
                {isLoading ? 'Logging in...' : 'Login'}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-[#c9d2e2]">
              Don&apos;t have an account?{' '}
              <Link href="/auth/signup" className="text-[#7ae2ff] hover:opacity-80">Sign up</Link>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="rounded-2xl p-6 md:p-8 border shadow-lg max-w-md w-full mx-4" style={{ background: 'linear-gradient(180deg,#12182c,#0f1325)', borderColor: '#1e2541' }}>
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-[#e7ecf5]">Reset Password</h3>
              <p className="text-sm text-[#9aa4b2] mt-2">Enter your email address and we&apos;ll send you a link to reset your password.</p>
            </div>

            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label className="block text-sm mb-1 text-[#c9d2e2]" htmlFor="forgot-email">Email</label>
                <input
                  id="forgot-email"
                  type="email"
                  placeholder="you@example.com"
                  value={forgotPasswordEmail}
                  onChange={(e) => setForgotPasswordEmail(e.target.value)}
                  disabled={forgotPasswordLoading}
                  className="w-full rounded-md px-3 py-2 text-sm"
                  style={{ background: '#0f1325', border: '1px solid #1e2541', color: '#e7ecf5' }}
                  required
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setForgotPasswordEmail("");
                  }}
                  disabled={forgotPasswordLoading}
                  className="flex-1 rounded-lg py-2.5 text-sm font-semibold border"
                  style={{ borderColor: '#1e2541', color: '#c9d2e2' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={forgotPasswordLoading}
                  className="flex-1 rounded-lg py-2.5 text-sm font-semibold"
                  style={{ background: 'linear-gradient(90deg,#8856ff,#a854ff)', color: '#fff' }}
                >
                  {forgotPasswordLoading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function HeartPulseIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
      <path d="M3.22 12H9.5l.7-1.5L11.5 12H16" />
    </svg>
  )
}
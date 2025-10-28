"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (!tokenParam) {
      toast.error('Invalid reset link. Please request a new password reset.');
      router.push('/auth/login');
      return;
    }
    setToken(tokenParam);
  }, [searchParams, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      toast.error('Invalid reset token.');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(result.message);
        router.push('/auth/login');
      } else {
        toast.error(result.error || 'Failed to reset password.');
      }
    } catch (error) {
      toast.error('An unexpected error occurred.');
      console.error("Password reset error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{
        background: 'radial-gradient(1200px 600px at -10% -10%, #1a1f35 2%, transparent 60%), radial-gradient(900px 500px at 110% -5%, #1a1f35 5%, transparent 65%), #0f1320',
        color: '#e7ecf5'
      }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7ae2ff] mx-auto mb-4"></div>
          <p className="text-[#c9d2e2]">Validating reset token...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{
      background: 'radial-gradient(1200px 600px at -10% -10%, #1a1f35 2%, transparent 60%), radial-gradient(900px 500px at 110% -5%, #1a1f35 5%, transparent 65%), #0f1320',
      color: '#e7ecf5'
    }}>
      <div className="max-w-5xl mx-auto px-6 py-10">
        <nav className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-extrabold text-lg">
            <div className="w-8 h-8 rounded-xl grid place-items-center" style={{ background: 'linear-gradient(135deg,#8856ff,#6ae2ff)', color: '#08101b' }}>+</div>
            <span>Health<span style={{ color: '#7ae2ff' }}>Consultant</span></span>
          </Link>
          <Link href="/auth/login" className="text-sm text-[#c9d2e2] hover:opacity-80">Back to login</Link>
        </nav>

        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="rounded-2xl p-6 md:p-8 border shadow-lg w-full max-w-md" style={{ background: 'linear-gradient(180deg,#12182c,#0f1325)', borderColor: '#1e2541' }}>
            <div className="text-center mb-8">
              <LockIcon className="w-8 h-8 mx-auto mb-4" style={{ color: '#7ae2ff' }} />
              <h2 className="text-2xl font-bold text-[#e7ecf5]">Reset Your Password</h2>
              <p className="text-sm text-[#9aa4b2] mt-2">Enter your new password below</p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm mb-1 text-[#c9d2e2]" htmlFor="password">New Password</label>
                <input
                  id="password"
                  type="password"
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="w-full rounded-md px-3 py-2 text-sm"
                  style={{ background: '#0f1325', border: '1px solid #1e2541', color: '#e7ecf5' }}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm mb-1 text-[#c9d2e2]" htmlFor="confirmPassword">Confirm Password</label>
                <input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
                {isLoading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-[#c9d2e2]">
              Remember your password?{' '}
              <Link href="/auth/login" className="text-[#7ae2ff] hover:opacity-80">Sign in</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LockIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  );
}

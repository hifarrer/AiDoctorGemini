"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import axios from "axios";
import { signIn } from "next-auth/react";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await axios.post("/api/register", { email, password });

      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        toast.error("Sign up successful, but login failed. Please log in manually.");
        router.push("/auth/login");
      } else {
        toast.success("Account created successfully!");
        router.push("/dashboard");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Something went wrong.");
    } finally {
      setIsLoading(false);
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
          <Link href="/auth/login" className="text-sm text-[#c9d2e2] hover:opacity-80">Already have an account?</Link>
        </nav>

        <div className="grid md:grid-cols-2 gap-8 mt-10 items-center">
          <div className="hidden md:block">
            <h1 className="text-4xl font-extrabold leading-tight">
              Create your <span style={{ background: 'linear-gradient(90deg,#8a6bff,#c87cff,#8a6bff)', WebkitBackgroundClip: 'text', color: 'transparent' }}>AI</span>
              <br /> Health <span style={{ background: 'linear-gradient(90deg,#6ae2ff,#7df3cf,#6ae2ff)', WebkitBackgroundClip: 'text', color: 'transparent' }}>Assistant</span> account
            </h1>
            <p className="mt-4 text-[#b7c1d6]">Start your private, AI-guided wellness journey today.</p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-xl p-4 border" style={{ background: 'linear-gradient(180deg,#12182c,#0f1325)', borderColor: '#1e2541' }}>
                <p className="text-sm text-[#9fb0cf]">HIPAA-friendly</p>
              </div>
              <div className="rounded-xl p-4 border" style={{ background: 'linear-gradient(180deg,#12182c,#0f1325)', borderColor: '#1e2541' }}>
                <p className="text-sm text-[#9fb0cf]">Cancel anytime</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl p-6 md:p-8 border shadow-lg" style={{ background: 'linear-gradient(180deg,#12182c,#0f1325)', borderColor: '#1e2541' }}>
            <div className="text-center">
              <MountainIcon className="w-8 h-8 mx-auto" />
              <h2 className="text-2xl font-bold mt-2">Create an account</h2>
              <p className="text-sm text-[#9aa4b2]">Use your email and a secure password</p>
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
                <label className="block text-sm mb-1 text-[#c9d2e2]" htmlFor="password">Password</label>
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
                {isLoading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-[#c9d2e2]">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-[#7ae2ff] hover:opacity-80">Log in</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MountainIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m8 3 4 8 5-5 5 15H2L8 3z" />
    </svg>
  );
} 
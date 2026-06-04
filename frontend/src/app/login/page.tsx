'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import api from '@/api/client';

export default function LoginPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [showPwd, setShowPwd] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(''); setSuccess(''); setLoading(true);
        try {
            if (isLogin) {
                const fd = new FormData();
                fd.append('username', email);
                fd.append('password', password);
                const res = await api.post('/auth/login', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
                localStorage.setItem('token', res.data.access_token);
                router.push('/dashboard');
            } else {
                await api.post('/auth/signup', { email, password, full_name: fullName });
                setSuccess('Account created! Sign in below.');
                setIsLogin(true);
            }
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Something went wrong. Please try again.');
        } finally { setLoading(false); }
    };

    return (
        <div className="min-h-screen flex" style={{ background: '#07061A' }}>
            {/* Left: branding panel */}
            <div className="hidden lg:flex flex-col justify-between w-[46%] p-14"
                style={{ background: 'linear-gradient(135deg, #0D0B21 0%, #1A0F3C 100%)', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => router.push('/')}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#6D5DFC' }}>
                        <Sparkles size={17} className="text-white" />
                    </div>
                    <span className="font-black text-white text-xl tracking-tight">ResumeAI</span>
                </div>

                <div>
                    <p className="text-5xl font-black text-white leading-[1.1] mb-6">
                        Build the resume<br />
                        <span style={{ background: 'linear-gradient(135deg, #A89BFF, #00D4FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                            that gets you hired.
                        </span>
                    </p>
                    <p className="text-white/50 text-lg leading-relaxed mb-10">
                        AI Interview Builder, ATS Optimizer, Job Match Studio,<br />and Career Intelligence — all in one platform.
                    </p>

                    <div className="space-y-3">
                        {[
                            { stat: '10K+', label: 'Resumes built with ResumeAI' },
                            { stat: '47%', label: 'More interview callbacks on average' },
                            { stat: '5 min', label: 'From blank page to a complete resume' },
                        ].map(s => (
                            <div key={s.stat} className="flex items-center gap-4">
                                <span className="text-2xl font-black w-16" style={{ color: '#A89BFF' }}>{s.stat}</span>
                                <span className="text-white/50 text-sm">{s.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <p className="text-white/20 text-sm">© 2025 ResumeAI. All rights reserved.</p>
            </div>

            {/* Right: form panel */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 relative">
                <button onClick={() => router.push('/')} className="absolute top-6 left-6 flex items-center gap-1.5 text-white/40 hover:text-white/70 transition-colors text-sm lg:hidden">
                    <ArrowLeft size={15} /> Back
                </button>

                <div className="w-full max-w-md">
                    {/* Mobile logo */}
                    <div className="flex items-center justify-center gap-2 mb-10 lg:hidden">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#6D5DFC' }}>
                            <Sparkles size={15} className="text-white" />
                        </div>
                        <span className="font-black text-white text-lg">ResumeAI</span>
                    </div>

                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                        <h1 className="text-3xl font-black text-white mb-1.5">
                            {isLogin ? 'Welcome back' : 'Create your account'}
                        </h1>
                        <p className="text-white/40 mb-8">
                            {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
                            <button onClick={() => { setIsLogin(v => !v); setError(''); setSuccess(''); }}
                                className="font-semibold hover:underline transition-colors" style={{ color: '#A89BFF' }}>
                                {isLogin ? 'Sign up free' : 'Sign in'}
                            </button>
                        </p>

                        <AnimatePresence>
                            {error && (
                                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                    className="mb-5 px-4 py-3 rounded-xl text-sm font-medium"
                                    style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#FCA5A5' }}>
                                    {error}
                                </motion.div>
                            )}
                            {success && (
                                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                    className="mb-5 px-4 py-3 rounded-xl text-sm font-medium"
                                    style={{ background: 'rgba(0,194,122,0.1)', border: '1px solid rgba(0,194,122,0.25)', color: '#6EE7B7' }}>
                                    {success}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <form onSubmit={submit} className="space-y-4">
                            <AnimatePresence>
                                {!isLogin && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                                        <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'rgba(255,255,255,0.45)' }}>Full Name</label>
                                        <input value={fullName} onChange={e => setFullName(e.target.value)} required={!isLogin}
                                            placeholder="Jane Smith"
                                            className="w-full px-4 py-3.5 rounded-xl text-sm text-white placeholder-white/25 outline-none transition-all"
                                            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'rgba(255,255,255,0.45)' }}>Email</label>
                                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                                    placeholder="you@company.com" autoComplete="email"
                                    className="w-full px-4 py-3.5 rounded-xl text-sm text-white placeholder-white/25 outline-none transition-all focus:border-[#6D5DFC]"
                                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'rgba(255,255,255,0.45)' }}>Password</label>
                                <div className="relative">
                                    <input type={showPwd ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                                        placeholder="••••••••" autoComplete={isLogin ? 'current-password' : 'new-password'}
                                        className="w-full px-4 py-3.5 pr-12 rounded-xl text-sm text-white placeholder-white/25 outline-none transition-all"
                                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
                                    <button type="button" onClick={() => setShowPwd(v => !v)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                                        {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            <button type="submit" disabled={loading}
                                className="w-full flex items-center justify-center gap-2.5 py-4 rounded-xl font-black text-sm text-white transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 mt-2"
                                style={{ background: '#6D5DFC', boxShadow: '0 10px 28px rgba(109,93,252,0.45)' }}>
                                {loading
                                    ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> {isLogin ? 'Signing in…' : 'Creating account…'}</>
                                    : <>{isLogin ? 'Sign In' : 'Create Account'} <ArrowRight size={15} /></>}
                            </button>
                        </form>

                        {!isLogin && (
                            <p className="text-center text-xs mt-6" style={{ color: 'rgba(255,255,255,0.3)' }}>
                                By creating an account you agree to our{' '}
                                <a href="#" className="underline hover:text-white/50">Terms of Service</a> and{' '}
                                <a href="#" className="underline hover:text-white/50">Privacy Policy</a>.
                            </p>
                        )}
                    </motion.div>
                </div>
            </div>
        </div>
    );
}

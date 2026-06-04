'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, AlertCircle } from 'lucide-react';
import { saveGuestTokenForMigration } from '@/lib/session';

const BACKEND = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') ?? 'http://localhost:8000';
const API     = `${BACKEND}/api/v1`;

// Google's official brand color + SVG logo
const GOOGLE_BLUE = '#4285F4';
function GoogleIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 48 48" fill="none">
            <path d="M47.532 24.552c0-1.636-.132-3.196-.388-4.692H24v9.206h13.14c-.576 3.016-2.276 5.572-4.828 7.28v6.04h7.808c4.568-4.208 7.412-10.408 7.412-17.834z" fill="#4285F4"/>
            <path d="M24 48c6.576 0 12.1-2.176 16.12-5.904l-7.808-6.04c-2.176 1.456-4.956 2.32-8.312 2.32-6.388 0-11.804-4.312-13.744-10.108H2.196v6.24C6.196 42.696 14.536 48 24 48z" fill="#34A853"/>
            <path d="M10.256 28.268A14.817 14.817 0 0 1 9.44 24c0-1.48.256-2.916.696-4.268v-6.24H2.196A23.998 23.998 0 0 0 0 24c0 3.876.928 7.544 2.196 10.508l8.06-6.24z" fill="#FBBC05"/>
            <path d="M24 9.624c3.604 0 6.836 1.24 9.38 3.668l6.98-6.98C36.096 2.396 30.572 0 24 0 14.536 0 6.196 5.304 2.196 13.492l8.06 6.24C12.196 13.936 17.612 9.624 24 9.624z" fill="#EA4335"/>
        </svg>
    );
}

function LoginContent() {
    const router = useRouter();
    const params = useSearchParams();
    const next   = params.get('next') || '/dashboard';
    const errorParam = params.get('error');

    const [authed, setAuthed] = useState(false);
    const [hovering, setHovering] = useState(false);

    useEffect(() => {
        try {
            const token   = localStorage.getItem('token');
            const isGuest = localStorage.getItem('is_guest') === 'true';
            // Only auto-redirect real (non-guest) users — guests visit this page to upgrade
            if (token && !isGuest) {
                setAuthed(true);
                router.replace('/dashboard');
            }
        } catch {}
    }, [router]);

    // Save guest token THEN redirect — so migration can happen after sign-in
    const handleSignIn = () => {
        saveGuestTokenForMigration();
        window.location.href = `${API}/auth/google?next=${encodeURIComponent(next)}`;
    };

    const errorMessages: Record<string, string> = {
        auth_failed:    'Sign-in failed. Please try again.',
        access_denied:  'Access was denied. Please allow permissions to continue.',
    };
    const errorMsg = errorParam ? (errorMessages[errorParam] ?? 'Something went wrong. Please try again.') : null;

    if (authed) return null;

    return (
        <div className="min-h-screen flex" style={{ background: '#07061A' }}>

            {/* ── Left branding panel (lg+) ─────────────────────────── */}
            <div className="hidden lg:flex flex-col justify-between w-[46%] p-14 relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #0D0B21 0%, #1A0F3C 100%)', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="absolute -right-24 -top-24 w-72 h-72 rounded-full opacity-10"
                    style={{ background: 'radial-gradient(circle, #6D5DFC, transparent)' }} />
                <div className="absolute -left-16 -bottom-16 w-56 h-56 rounded-full opacity-8"
                    style={{ background: 'radial-gradient(circle, #00D4FF, transparent)' }} />

                <div className="relative flex items-center gap-2.5 cursor-pointer" onClick={() => router.push('/')}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#6D5DFC' }}>
                        <Sparkles size={17} className="text-white" />
                    </div>
                    <span className="font-black text-white text-xl tracking-tight">ResumeAI</span>
                </div>

                <div className="relative">
                    <p className="text-5xl font-black text-white leading-[1.1] mb-6">
                        Build the resume<br />
                        <span style={{ background: 'linear-gradient(135deg, #A89BFF, #00D4FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                            that gets you hired.
                        </span>
                    </p>
                    <p className="text-white/50 text-lg leading-relaxed mb-10">
                        AI Interview Builder · ATS Optimizer<br />
                        Job Match · Career Intelligence
                    </p>
                    <div className="space-y-4">
                        {[
                            { stat: '10K+', label: 'Resumes built' },
                            { stat: '47%',  label: 'More interview callbacks' },
                            { stat: '5 min',label: 'From blank page to complete resume' },
                        ].map(s => (
                            <div key={s.stat} className="flex items-center gap-4">
                                <span className="text-2xl font-black w-16 shrink-0" style={{ color: '#A89BFF' }}>{s.stat}</span>
                                <span className="text-white/45 text-sm">{s.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <p className="relative text-white/20 text-xs">© 2025 ResumeAI. All rights reserved.</p>
            </div>

            {/* ── Right: sign-in panel ───────────────────────────────── */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 relative">

                {/* Mobile logo */}
                <div className="flex items-center gap-2 mb-12 lg:hidden cursor-pointer" onClick={() => router.push('/')}>
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#6D5DFC' }}>
                        <Sparkles size={15} className="text-white" />
                    </div>
                    <span className="font-black text-white text-lg">ResumeAI</span>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-sm">

                    <h1 className="text-3xl font-black text-white mb-2">Welcome</h1>
                    <p className="text-white/40 mb-10 text-sm leading-relaxed">
                        Sign in to your account — or we'll create one automatically<br className="hidden sm:block" />
                        if this is your first time.
                    </p>

                    {/* Error banner */}
                    <AnimatePresence>
                        {errorMsg && (
                            <motion.div
                                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                className="flex items-center gap-2.5 mb-6 px-4 py-3 rounded-xl text-sm"
                                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#FCA5A5' }}>
                                <AlertCircle size={15} className="shrink-0" />
                                {errorMsg}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* ── THE button ── */}
                    <button
                        onClick={handleSignIn}
                        onMouseEnter={() => setHovering(true)}
                        onMouseLeave={() => setHovering(false)}
                        className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl font-bold text-sm transition-all"
                        style={{
                            background: hovering ? 'rgba(255,255,255,0.97)' : 'white',
                            color: '#1E1B3A',
                            boxShadow: hovering
                                ? '0 12px 36px rgba(109,93,252,0.45), 0 0 0 1px rgba(255,255,255,0.1)'
                                : '0 6px 24px rgba(0,0,0,0.35)',
                            transform: hovering ? 'translateY(-1px) scale(1.01)' : 'none',
                        }}>
                        <GoogleIcon />
                        Continue with Google
                        <ArrowRight size={15} className="ml-auto" style={{ opacity: hovering ? 1 : 0.4, transition: 'opacity 0.2s' }} />
                    </button>

                    <p className="text-center text-xs mt-6" style={{ color: 'rgba(255,255,255,0.2)' }}>
                        By continuing you agree to our{' '}
                        <a href="#" className="underline hover:text-white/40 transition-colors">Terms</a>
                        {' '}and{' '}
                        <a href="#" className="underline hover:text-white/40 transition-colors">Privacy Policy</a>.
                    </p>

                    {/* Future providers — hidden, easy to uncomment */}
                    {/*
                    <div className="mt-4 flex flex-col gap-3">
                        <ProviderButton icon={...} label="Continue with Microsoft" href={`${API}/auth/microsoft?next=${next}`} />
                        <ProviderButton icon={...} label="Continue with LinkedIn"  href={`${API}/auth/linkedin?next=${next}`}  />
                    </div>
                    */}
                </motion.div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="h-screen flex items-center justify-center" style={{ background: '#07061A' }}>
                <Sparkles size={22} className="animate-pulse" style={{ color: '#6D5DFC' }} />
            </div>
        }>
            <LoginContent />
        </Suspense>
    );
}

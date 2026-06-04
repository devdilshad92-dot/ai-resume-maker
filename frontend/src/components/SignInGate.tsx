'use client';

/**
 * SignInGate — wraps any action that requires a real (non-guest) account.
 *
 * Usage:
 *   <SignInGate feature="download your resume">
 *     <DownloadButton />
 *   </SignInGate>
 *
 * For guests, clicking the wrapped element shows an inline sign-in modal.
 * For real users, the wrapped element works normally.
 *
 * Also exports useRequireAuth() for programmatic use.
 */

import { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Lock } from 'lucide-react';
import { isGuest, saveGuestTokenForMigration } from '@/lib/session';

const BACKEND = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') ?? 'http://localhost:8000';

// ─── Hook ──────────────────────────────────────────────────────────────────────

/**
 * Returns a function that:
 * - runs `fn` immediately for real users
 * - shows a sign-in modal for guests
 */
export function useRequireAuth(feature: string) {
    const [showModal, setShowModal] = useState(false);
    const pathname = usePathname();

    const requireAuth = useCallback((fn?: () => void) => {
        if (!isGuest()) {
            fn?.();
        } else {
            setShowModal(true);
        }
    }, []);

    const modal = showModal ? (
        <SignInModal feature={feature} onClose={() => setShowModal(false)} currentPath={pathname} />
    ) : null;

    return { requireAuth, modal };
}

// ─── Wrapper component ─────────────────────────────────────────────────────────

interface SignInGateProps {
    children: React.ReactNode;
    feature: string;   // e.g. "download your resume"
}

export function SignInGate({ children, feature }: SignInGateProps) {
    const [guest, setGuest] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const pathname = usePathname();

    useEffect(() => { setGuest(isGuest()); }, [pathname]);

    if (!guest) return <>{children}</>;

    return (
        <>
            <div onClick={e => { e.preventDefault(); e.stopPropagation(); setShowModal(true); }}
                className="cursor-pointer relative">
                {children}
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center"
                    style={{ background: '#F59E0B', boxShadow: '0 2px 6px rgba(245,158,11,0.5)' }}>
                    <Lock size={8} className="text-white" />
                </span>
            </div>
            {showModal && (
                <SignInModal feature={feature} onClose={() => setShowModal(false)} currentPath={pathname} />
            )}
        </>
    );
}

// ─── Modal ─────────────────────────────────────────────────────────────────────

function SignInModal({ feature, onClose, currentPath }: { feature: string; onClose: () => void; currentPath: string }) {
    const handleSignIn = () => {
        saveGuestTokenForMigration();
        const next = encodeURIComponent(currentPath);
        window.location.href = `${BACKEND}/api/v1/auth/google?next=${next}`;
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                style={{ background: 'rgba(7,6,26,0.75)', backdropFilter: 'blur(8px)' }}
                onClick={onClose}>
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 12 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    onClick={e => e.stopPropagation()}
                    className="w-full max-w-sm p-8 rounded-3xl text-center"
                    style={{ background: '#0D0B21', border: '1px solid rgba(109,93,252,0.25)', boxShadow: '0 24px 60px rgba(0,0,0,0.6)' }}>

                    <button onClick={onClose} className="absolute top-4 right-4 text-white/30 hover:text-white/60 transition-colors">
                        <X size={18} />
                    </button>

                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
                        style={{ background: 'rgba(109,93,252,0.15)' }}>
                        <Sparkles size={24} style={{ color: '#A89BFF' }} />
                    </div>

                    <h3 className="text-xl font-black text-white mb-2">
                        Sign in to {feature}
                    </h3>
                    <p className="text-sm mb-7" style={{ color: 'rgba(255,255,255,0.45)' }}>
                        Your resume content will be saved automatically. One click and you're in.
                    </p>

                    <button onClick={handleSignIn}
                        className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
                        style={{ background: 'white', color: '#1E1B3A', boxShadow: '0 6px 24px rgba(255,255,255,0.15)' }}>
                        <GoogleIcon />
                        Continue with Google — Free
                    </button>

                    <p className="text-xs mt-4" style={{ color: 'rgba(255,255,255,0.2)' }}>
                        Your resume content is preserved after sign-in.
                    </p>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

function GoogleIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
            <path d="M47.532 24.552c0-1.636-.132-3.196-.388-4.692H24v9.206h13.14c-.576 3.016-2.276 5.572-4.828 7.28v6.04h7.808c4.568-4.208 7.412-10.408 7.412-17.834z" fill="#4285F4"/>
            <path d="M24 48c6.576 0 12.1-2.176 16.12-5.904l-7.808-6.04c-2.176 1.456-4.956 2.32-8.312 2.32-6.388 0-11.804-4.312-13.744-10.108H2.196v6.24C6.196 42.696 14.536 48 24 48z" fill="#34A853"/>
            <path d="M10.256 28.268A14.817 14.817 0 0 1 9.44 24c0-1.48.256-2.916.696-4.268v-6.24H2.196A23.998 23.998 0 0 0 0 24c0 3.876.928 7.544 2.196 10.508l8.06-6.24z" fill="#FBBC05"/>
            <path d="M24 9.624c3.604 0 6.836 1.24 9.38 3.668l6.98-6.98C36.096 2.396 30.572 0 24 0 14.536 0 6.196 5.304 2.196 13.492l8.06 6.24C12.196 13.936 17.612 9.624 24 9.624z" fill="#EA4335"/>
        </svg>
    );
}

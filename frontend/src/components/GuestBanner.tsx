'use client';

/**
 * GuestBanner — persistent bottom bar shown to anonymous users.
 *
 * Visible on every page when is_guest === true.
 * Clicking "Sign in" saves the guest token for migration, then navigates to /login.
 */

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X } from 'lucide-react';
import { isGuest, saveGuestTokenForMigration } from '@/lib/session';

const BACKEND = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') ?? 'http://localhost:8000';

export default function GuestBanner() {
    const [show, setShow]       = useState(false);
    const [dismissed, setDismiss] = useState(false);
    const pathname              = usePathname();

    useEffect(() => {
        // Re-evaluate whenever path changes (user might have just signed in)
        setShow(isGuest() && !dismissed);
    }, [pathname, dismissed]);

    if (!show) return null;

    const handleSignIn = () => {
        saveGuestTokenForMigration();
        const next = encodeURIComponent(pathname);
        window.location.href = `${BACKEND}/api/v1/auth/google?next=${next}`;
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: 80, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 80, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                className="fixed bottom-4 left-1/2 z-50 w-[calc(100vw-2rem)] max-w-2xl"
                style={{ transform: 'translateX(-50%)' }}>
                <div className="flex items-center gap-4 px-5 py-3.5 rounded-2xl"
                    style={{
                        background: 'rgba(13,11,33,0.95)',
                        border: '1px solid rgba(109,93,252,0.35)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(109,93,252,0.15)',
                        backdropFilter: 'blur(16px)',
                    }}>
                    <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: 'rgba(109,93,252,0.2)' }}>
                        <Sparkles size={13} style={{ color: '#A89BFF' }} />
                    </div>

                    <p className="flex-1 text-sm" style={{ color: 'rgba(255,255,255,0.65)' }}>
                        <span className="font-semibold text-white">Your work is temporary.</span>
                        {' '}Sign in to save your resume and access it anywhere.
                    </p>

                    <button
                        onClick={handleSignIn}
                        className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all hover:scale-[1.03] active:scale-95"
                        style={{ background: '#6D5DFC', boxShadow: '0 4px 14px rgba(109,93,252,0.45)' }}>
                        <GoogleDot /> Sign in with Google
                    </button>

                    <button
                        onClick={() => setDismiss(true)}
                        className="shrink-0 text-white/25 hover:text-white/60 transition-colors ml-1">
                        <X size={15} />
                    </button>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

function GoogleDot() {
    return (
        <span className="w-3.5 h-3.5 rounded-full bg-white flex items-center justify-center shrink-0">
            <svg width="9" height="9" viewBox="0 0 48 48">
                <path d="M47.5 24.6c0-1.6-.1-3.1-.4-4.6H24v9h13.1c-.6 3-2.3 5.6-4.8 7.3v6h7.8c4.6-4.2 7.4-10.4 7.4-17.7z" fill="#4285F4"/>
                <path d="M24 48c6.6 0 12.1-2.2 16.1-5.9l-7.8-6c-2.2 1.5-5 2.3-8.3 2.3-6.4 0-11.8-4.3-13.7-10.1H2.2v6.2C6.2 42.7 14.5 48 24 48z" fill="#34A853"/>
                <path d="M10.3 28.3A15 15 0 0 1 9.4 24c0-1.5.3-2.9.7-4.3v-6.2H2.2A24 24 0 0 0 0 24c0 3.9.9 7.5 2.2 10.5l8.1-6.2z" fill="#FBBC05"/>
                <path d="M24 9.6c3.6 0 6.8 1.2 9.4 3.7l7-7C36.1 2.4 30.6 0 24 0 14.5 0 6.2 5.3 2.2 13.5l8.1 6.2C12.2 13.9 17.6 9.6 24 9.6z" fill="#EA4335"/>
            </svg>
        </span>
    );
}

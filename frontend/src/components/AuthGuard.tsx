'use client';

/**
 * AuthGuard — session-first gate.
 *
 * Old behaviour: redirect to /login if no token.
 * New behaviour:  call ensureSession() so every visitor (guest or real)
 *                 gets a valid JWT automatically.  No hard redirect to /login.
 *
 * Use <SignInGate> / useRequireAuth() to gate specific ACTIONS (download,
 * export, etc.) instead of whole pages.
 */

import { useEffect, useState, Suspense } from 'react';
import { Sparkles } from 'lucide-react';
import { ensureSession } from '@/lib/session';

function Spinner() {
    return (
        <div className="h-screen flex items-center justify-center" style={{ background: '#07061A' }}>
            <Sparkles size={22} className="animate-pulse" style={{ color: '#6D5DFC' }} />
        </div>
    );
}

function Gate({ children }: { children: React.ReactNode }) {
    const [ready, setReady] = useState(false);

    useEffect(() => {
        ensureSession().then(() => setReady(true));
    }, []);

    if (!ready) return <Spinner />;
    return <>{children}</>;
}

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    return (
        <Suspense fallback={<Spinner />}>
            <Gate>{children}</Gate>
        </Suspense>
    );
}

'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import { clearGuestMarkers, migrateGuestData } from '@/lib/session';

function CallbackHandler() {
    const router = useRouter();
    const params = useSearchParams();

    useEffect(() => {
        const token = params.get('token');
        const next  = params.get('next') || '/dashboard';

        if (!token) {
            router.replace('/login?error=auth_failed');
            return;
        }

        // Store real JWT (replaces any existing guest JWT)
        try { localStorage.setItem('token', token); } catch {}

        // Clear guest markers and migrate any anonymous resume data
        clearGuestMarkers();
        migrateGuestData().then(count => {
            if (count > 0) console.info(`[auth] migrated ${count} resume(s) from guest account`);
        });

        router.replace(next.startsWith('/') ? next : '/dashboard');
    }, [params, router]);

    return (
        <div className="h-screen flex flex-col items-center justify-center gap-4"
            style={{ background: '#07061A' }}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(109,93,252,0.2)' }}>
                <Sparkles size={22} className="animate-pulse" style={{ color: '#6D5DFC' }} />
            </div>
            <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Signing you in and saving your work…
            </p>
        </div>
    );
}

export default function AuthCallbackPage() {
    return (
        <Suspense fallback={
            <div className="h-screen flex items-center justify-center" style={{ background: '#07061A' }}>
                <Sparkles size={22} className="animate-pulse" style={{ color: '#6D5DFC' }} />
            </div>
        }>
            <CallbackHandler />
        </Suspense>
    );
}

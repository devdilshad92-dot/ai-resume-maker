'use client';

import AuthGuard from '@/components/AuthGuard';
import AdminPanel from '@/components/pages/AdminPanel';

export default function AdminPage() {
    return (
        <AuthGuard>
            <AdminPanel />
        </AuthGuard>
    );
}

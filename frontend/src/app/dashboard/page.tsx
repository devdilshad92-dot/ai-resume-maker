'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    Sparkles, ArrowRight, Wand2, Check, CornerDownLeft, LogOut,
    Target, Upload, FileText, TrendingUp, Zap, Layers, Rocket,
    Bot, Settings2,
} from 'lucide-react';
import api from '@/api/client';
import AuthGuard from '@/components/AuthGuard';
import {
    readiness, atsScore, countMetrics,
    missingSignals, percentileVsApplicants, potentialAtsGain,
} from '@/lib/resumeInsights';

// ─── Design tokens ─────────────────────────────────────────────────────────────
const BG   = '#07061A';
const CARD = 'rgba(255,255,255,0.04)';
const BORDER = 'rgba(255,255,255,0.08)';
const P = '#6D5DFC';
const G = '#00C27A';
const C = '#00D4FF';
const A = '#F59E0B';

export default function DashboardPage() {
    return <AuthGuard><CommandCenter /></AuthGuard>;
}

interface ResumeItem {
    id: number;
    template_id: string;
    parsed_content?: any;
    meta_data?: any;
    updated_at?: string;
    created_at?: string;
}

function greeting() {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}
function timeAgo(iso?: string): string {
    if (!iso) return 'just now';
    const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (m < 1) return 'just now'; if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
}

// ─── Quick actions ──────────────────────────────────────────────────────────────
const QUICK = [
    { icon: Bot,      label: 'AI Interview',  sub: 'Start from scratch', color: P,  href: (id?: number) => '/builder/interview' },
    { icon: Zap,      label: 'Health Check',  sub: 'Fix your resume',    color: G,  href: (id?: number) => id ? `/health?id=${id}` : '/builder/scratch' },
    { icon: Target,   label: 'Job Match',     sub: 'Tailor to any job',  color: C,  href: (id?: number) => id ? `/match?id=${id}` : '/builder/interview' },
    { icon: Rocket,   label: 'Career Intel',  sub: 'Grow your career',   color: A,  href: (id?: number) => id ? `/coach?id=${id}` : '/builder/interview' },
    { icon: Upload,   label: 'Upload Resume', sub: 'Import existing',    color: '#EC4899', href: () => '/builder' },
];

// ─── Main dashboard ─────────────────────────────────────────────────────────────
function CommandCenter() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [resumes, setResumes] = useState<ResumeItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [command, setCommand] = useState('');
    const [page, setPage] = useState(0);
    const PAGE_SIZE = 5;
    const inputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        Promise.all([
            api.get('/auth/me').then(r => setName((r.data.full_name || r.data.email || '').split(' ')[0].split('@')[0])).catch(() => {}),
            api.get<ResumeItem[]>('/resume/list').then(r => setResumes(r.data)).catch(() => setResumes([])),
        ]).finally(() => setLoading(false));
    }, []);

    const latest = resumes[0];
    const ready    = readiness(latest?.parsed_content);
    const ats      = atsScore(latest?.parsed_content);
    const percentile = latest ? percentileVsApplicants(ready) : 0;
    const atsGain    = latest ? potentialAtsGain(latest?.parsed_content) : 0;

    const run = (intent?: string) => {
        const v = (intent ?? command).trim();
        const wantsMatch = /optimi[sz]e|tailor|match|\bfor (amazon|google|microsoft|meta|apple|netflix)/i.test(v);
        if (wantsMatch && latest) { router.push(`/match?id=${latest.id}`); return; }
        if (v) { try { sessionStorage.setItem('ai_intent', v); } catch {} }
        router.push('/builder/interview');
    };
    const fixEverything = () => router.push(latest ? `/health?id=${latest.id}` : '/builder/scratch');
    const logout = () => { try { localStorage.removeItem('token'); } catch {}; router.push('/login'); };

    const SUGGESTED = ['Create a DevOps resume', 'Optimize for Amazon', 'Create a PM resume', 'Improve my ATS score'];
    const p = latest?.parsed_content;
    const missing: string[] = latest ? missingSignals(p) : [];

    const activity = latest ? [
        { text: `ATS score reached ${ats}`,                                                                     delta: `${ats}`,                     ok: ats >= 60 },
        { text: `${p?.skills?.length || 0} skills on your profile`,                                             delta: `+${p?.skills?.length || 0}`, ok: (p?.skills?.length || 0) >= 3 },
        { text: countMetrics(p) > 0 ? `${countMetrics(p)} measurable achievements` : 'No metrics yet',          delta: `${countMetrics(p)}`,         ok: countMetrics(p) > 0 },
        { text: (p?.summary?.length || 0) > 50 ? 'Professional summary complete' : 'Summary needs work',        delta: '',                           ok: (p?.summary?.length || 0) > 50 },
    ] : [];

    return (
        <div className="min-h-screen" style={{
            background: [
                `radial-gradient(ellipse at 50% -5%, rgba(109,93,252,0.28) 0%, transparent 60%)`,
                `radial-gradient(ellipse at 92% 15%, rgba(0,212,255,0.1) 0%, transparent 40%)`,
                BG,
            ].join(', '),
        }}>
            {/* ── NAV ─────────────────────────────────────────────────────────── */}
            <div className="h-14 flex items-center px-6 gap-3 sticky top-0 z-10"
                style={{ background: 'rgba(7,6,26,0.85)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0" style={{ background: P }}>
                    <Sparkles size={14} className="text-white" />
                </div>
                <span className="font-black text-white text-sm tracking-tight">ResumeAI</span>
                <div className="flex-1" />
                <button onClick={() => router.push('/admin')}
                    className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                    style={{ color: 'rgba(255,255,255,0.4)', background: 'transparent' }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.8)', e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)', e.currentTarget.style.background = 'transparent')}>
                    <Settings2 size={13} /> Settings
                </button>
                <button onClick={logout}
                    className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                    style={{ color: 'rgba(255,255,255,0.4)' }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.8)', e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)', e.currentTarget.style.background = 'transparent')}>
                    <LogOut size={13} /> Log out
                </button>
            </div>

            {/* ── HERO ────────────────────────────────────────────────────────── */}
            <section className="max-w-3xl mx-auto px-6 pt-20 pb-14 text-center">
                <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
                    <p className="font-medium mb-3 text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
                        {greeting()}{name ? `, ${name}` : ''} 👋
                    </p>
                    <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-[1.08] mb-8"
                        style={{ color: 'white' }}>
                        What role are you<br />
                        <span style={{ background: `linear-gradient(135deg, #A89BFF 0%, ${C} 100%)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                            targeting today?
                        </span>
                    </h1>
                </motion.div>

                {/* ── AI COMMAND INPUT ── */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
                    <div className="p-3 text-left" style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 24,
                        boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
                    }}>
                        <textarea
                            ref={inputRef}
                            rows={2}
                            className="w-full bg-transparent outline-none text-base resize-none px-2 pt-1"
                            style={{ color: 'white', caretColor: `${P}` }}
                            placeholder={'Describe what you want…  e.g. "Create a Senior Product Manager resume optimized for Amazon"'}
                            value={command}
                            onChange={e => setCommand(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); run(); } }}
                        />
                        <style>{`textarea::placeholder { color: rgba(255,255,255,0.22); }`}</style>
                        <div className="flex items-center justify-between px-2 pt-2">
                            <div className="flex items-center gap-1 text-xs flex-wrap" style={{ color: 'rgba(255,255,255,0.35)' }}>
                                <span className="hidden sm:inline mr-1">Start with</span>
                                {[
                                    { icon: Target,   label: 'Job Match',   action: () => router.push(latest ? `/match?id=${latest.id}` : '/builder/interview') },
                                    { icon: Sparkles, label: 'AI Interview', action: () => router.push('/builder/interview') },
                                    { icon: Upload,   label: 'Upload',       action: () => router.push('/builder') },
                                    { icon: Rocket,   label: 'Career Coach', action: () => router.push(latest ? `/coach?id=${latest.id}` : '/builder/interview') },
                                ].map(({ icon: Icon, label, action }) => (
                                    <button key={label} onClick={action}
                                        className="flex items-center gap-1 px-2 py-1 rounded-lg transition-all"
                                        style={{ color: 'rgba(255,255,255,0.35)' }}
                                        onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.8)', e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
                                        onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.35)', e.currentTarget.style.background = 'transparent')}>
                                        <Icon size={11} /> {label}
                                    </button>
                                ))}
                            </div>
                            <button onClick={() => run()}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95 shrink-0"
                                style={{ background: P, boxShadow: `0 4px 16px rgba(109,93,252,0.45)` }}>
                                Generate <CornerDownLeft size={13} />
                            </button>
                        </div>
                    </div>

                    {/* Suggested chips */}
                    <div className="flex flex-wrap justify-center gap-2 mt-4">
                        {SUGGESTED.map(s => (
                            <button key={s} onClick={() => run(s)}
                                className="text-xs px-4 py-2 rounded-full transition-all hover:-translate-y-0.5"
                                style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.55)', border: '1px solid rgba(255,255,255,0.08)' }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(255,255,255,0.85)'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; }}>
                                {s}
                            </button>
                        ))}
                    </div>
                </motion.div>
            </section>

            <div className="max-w-3xl mx-auto px-6 pb-28 space-y-10">

                {/* ── QUICK ACCESS GRID ─────────────────────────────────────── */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <div className="grid grid-cols-5 gap-3">
                        {QUICK.map(q => (
                            <button key={q.label} onClick={() => router.push(q.href(latest?.id))}
                                className="flex flex-col items-center gap-2 p-4 rounded-2xl transition-all hover:-translate-y-1 group"
                                style={{ background: CARD, border: `1px solid ${BORDER}` }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.borderColor = `${q.color}40`; }}
                                onMouseLeave={e => { e.currentTarget.style.background = CARD; e.currentTarget.style.borderColor = BORDER; }}>
                                <div className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
                                    style={{ background: `${q.color}18` }}>
                                    <q.icon size={17} style={{ color: q.color }} />
                                </div>
                                <div className="text-center">
                                    <p className="text-[11px] font-bold leading-tight" style={{ color: 'rgba(255,255,255,0.8)' }}>{q.label}</p>
                                    <p className="text-[10px] mt-0.5 hidden sm:block" style={{ color: 'rgba(255,255,255,0.3)' }}>{q.sub}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </motion.div>

                {/* ── RESUME HEALTH BAND ────────────────────────────────────── */}
                {!loading && latest && (
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}
                        className="relative overflow-hidden rounded-3xl p-7 text-white"
                        style={{ background: 'linear-gradient(135deg, #6D5DFC 0%, #8B7BFF 55%, #00D4FF 140%)' }}>
                        <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full opacity-15 bg-white" />
                        <div className="absolute -left-6 -bottom-6 w-32 h-32 rounded-full opacity-10 bg-white" />
                        <div className="relative">
                            <div className="flex items-center gap-2 mb-1">
                                <Zap size={14} />
                                <span className="text-[11px] font-bold uppercase tracking-widest opacity-75">Resume Health Check</span>
                            </div>
                            <p className="text-2xl font-black leading-tight mb-5">
                                Stronger than <span className="text-3xl">{percentile}%</span> of applicants
                            </p>
                            <div className="flex flex-wrap items-end gap-6">
                                <div>
                                    <p className="text-[10px] uppercase tracking-wider opacity-60 mb-1.5">Missing signals</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {(missing.length ? missing : ['Resume looking strong']).map(k => (
                                            <span key={k} className="text-xs px-2.5 py-1 rounded-full font-medium"
                                                style={{ background: 'rgba(255,255,255,0.18)' }}>{k}</span>
                                        ))}
                                    </div>
                                </div>
                                <div className="ml-auto text-right">
                                    <p className="text-[10px] uppercase tracking-wider opacity-60">Potential ATS Gain</p>
                                    <p className="text-3xl font-black flex items-center gap-1 justify-end">
                                        <TrendingUp size={20} />+{atsGain}
                                    </p>
                                </div>
                            </div>
                            <button onClick={fixEverything}
                                className="mt-6 w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-sm font-black transition-all hover:scale-[1.02] active:scale-95"
                                style={{ background: 'white', color: P, boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
                                <Wand2 size={15} /> Fix Everything — One Click
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* ── RESUME STUDIO ─────────────────────────────────────────── */}
                {!loading && (
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <h2 className="font-bold text-base" style={{ color: 'white' }}>Your Resume Studio</h2>
                                {resumes.length > 0 && (
                                    <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                                        style={{ background: `${P}20`, color: '#A89BFF' }}>
                                        {resumes.length}
                                    </span>
                                )}
                            </div>
                            <button onClick={() => run()}
                                className="text-xs font-bold px-3 py-1.5 rounded-lg transition-all"
                                style={{ color: P, background: `${P}18`, border: `1px solid ${P}30` }}>
                                + New Resume
                            </button>
                        </div>

                        {resumes.length === 0 ? (
                            <div className="text-center py-16 rounded-3xl" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
                                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                                    style={{ background: `${P}20` }}>
                                    <Sparkles size={24} style={{ color: P }} />
                                </div>
                                <h3 className="font-bold mb-1" style={{ color: 'white' }}>No resumes yet</h3>
                                <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.4)' }}>
                                    Describe your target role above and AI writes the first draft.
                                </p>
                                <button onClick={() => router.push('/builder/interview')}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
                                    style={{ background: P }}>
                                    <Bot size={14} /> Start with AI Interview
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {resumes.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE).map((r, i) => {
                                    const a = atsScore(r.parsed_content);
                                    const rd = readiness(r.parsed_content);
                                    const mc = countMetrics(r.parsed_content);
                                    const lastImp = mc > 0 ? 'Added measurable achievements' : (r.parsed_content?.summary?.length > 50 ? 'Optimized summary' : 'Draft started');
                                    return (
                                        <motion.div key={r.id}
                                            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                                            className="group flex items-center gap-4 p-5 rounded-2xl transition-all"
                                            style={{ background: CARD, border: `1px solid ${BORDER}` }}
                                            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.07)'; (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.12)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; }}
                                            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = CARD; (e.currentTarget as HTMLDivElement).style.borderColor = BORDER; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; }}>

                                            {/* Icon */}
                                            <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
                                                style={{ background: `${P}22` }}>
                                                <FileText size={18} style={{ color: P }} />
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0 cursor-pointer" onClick={() => router.push(`/builder/scratch?id=${r.id}`)}>
                                                <h3 className="font-bold truncate text-sm" style={{ color: 'white' }}>
                                                    {r.meta_data?.job_role || 'Untitled'} Resume
                                                </h3>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <span className="text-xs font-bold" style={{ color: G }}>ATS {a}%</span>
                                                    <span className="text-xs font-semibold" style={{ color: '#A89BFF' }}>Match {Math.min(rd + 6, 100)}%</span>
                                                    <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.25)' }}>{timeAgo(r.updated_at || r.created_at)}</span>
                                                </div>
                                                <p className="text-[11px] mt-1 flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
                                                    <Sparkles size={9} style={{ color: P }} /> {lastImp}
                                                </p>
                                            </div>

                                            {/* Action buttons */}
                                            <div className="flex items-center gap-1 shrink-0">
                                                {[
                                                    { icon: Rocket, label: 'Coach', route: `/coach?id=${r.id}`,             color: A },
                                                    { icon: Layers, label: 'Style', route: `/templates?id=${r.id}`,          color: '#EC4899' },
                                                    { icon: Target, label: 'Match', route: `/match?id=${r.id}`,              color: C },
                                                    { icon: Zap,    label: 'Health', route: `/health?id=${r.id}`,            color: G },
                                                ].map(({ icon: Icon, label, route, color }) => (
                                                    <button key={label}
                                                        onClick={() => router.push(route)}
                                                        className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1.5 rounded-lg transition-all"
                                                        style={{ color: 'rgba(255,255,255,0.35)', background: 'transparent' }}
                                                        onMouseEnter={e => { e.currentTarget.style.color = color; e.currentTarget.style.background = `${color}18`; }}
                                                        onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.35)'; e.currentTarget.style.background = 'transparent'; }}
                                                        title={label}>
                                                        <Icon size={12} /> <span className="hidden lg:inline">{label}</span>
                                                    </button>
                                                ))}
                                                <button
                                                    onClick={() => router.push(`/builder/scratch?id=${r.id}`)}
                                                    className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg transition-all ml-1"
                                                    style={{ color: P, background: `${P}18`, border: `1px solid ${P}30` }}
                                                    onMouseEnter={e => { e.currentTarget.style.background = `${P}30`; }}
                                                    onMouseLeave={e => { e.currentTarget.style.background = `${P}18`; }}>
                                                    Edit <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
                                                </button>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Pagination */}
                        {resumes.length > PAGE_SIZE && (
                            <div className="flex items-center justify-between mt-4 pt-4"
                                style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                                <button
                                    onClick={() => setPage(p => Math.max(0, p - 1))}
                                    disabled={page === 0}
                                    className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl transition-all disabled:opacity-25"
                                    style={{ color: 'rgba(255,255,255,0.6)', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                    ← Previous
                                </button>

                                <div className="flex items-center gap-1.5">
                                    {Array.from({ length: Math.ceil(resumes.length / PAGE_SIZE) }).map((_, i) => (
                                        <button key={i} onClick={() => setPage(i)}
                                            className="w-7 h-7 rounded-lg text-xs font-bold transition-all"
                                            style={page === i
                                                ? { background: P, color: 'white' }
                                                : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
                                            {i + 1}
                                        </button>
                                    ))}
                                </div>

                                <button
                                    onClick={() => setPage(p => Math.min(Math.ceil(resumes.length / PAGE_SIZE) - 1, p + 1))}
                                    disabled={page >= Math.ceil(resumes.length / PAGE_SIZE) - 1}
                                    className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl transition-all disabled:opacity-25"
                                    style={{ color: 'rgba(255,255,255,0.6)', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                    Next →
                                </button>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* ── AI ACTIVITY FEED ──────────────────────────────────────── */}
                {!loading && latest && (
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}>
                        <h2 className="font-bold text-base mb-4" style={{ color: 'white' }}>AI Activity</h2>
                        <div className="rounded-2xl overflow-hidden" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
                            {activity.map((a, i) => (
                                <div key={i} className="flex items-center gap-3 px-5 py-3.5"
                                    style={{ borderBottom: i < activity.length - 1 ? `1px solid rgba(255,255,255,0.05)` : 'none' }}>
                                    <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                                        style={{ background: a.ok ? `${G}30` : 'rgba(255,255,255,0.06)' }}>
                                        <Check size={10} style={{ color: a.ok ? G : 'rgba(255,255,255,0.25)' }} />
                                    </div>
                                    <span className="text-sm flex-1" style={{ color: a.ok ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.3)' }}>
                                        {a.text}
                                    </span>
                                    {a.delta && (
                                        <span className="text-xs font-black" style={{ color: a.ok ? G : 'rgba(255,255,255,0.2)' }}>
                                            {a.delta}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Loading */}
                {loading && (
                    <div className="flex justify-center py-20">
                        <Sparkles size={22} className="animate-pulse" style={{ color: 'rgba(255,255,255,0.2)' }} />
                    </div>
                )}
            </div>
        </div>
    );
}

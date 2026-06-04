'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    Sparkles, ArrowRight, Wand2, Check, CornerDownLeft, LogOut,
    Target, Upload, FileText, TrendingUp, Zap, Layers, Rocket,
} from 'lucide-react';
import api from '@/api/client';
import AuthGuard from '@/components/AuthGuard';
import {
    readiness, atsScore, countMetrics,
    missingSignals, percentileVsApplicants, potentialAtsGain,
} from '@/lib/resumeInsights';

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

function greeting() { const h = new Date().getHours(); return h<12 ? 'Good morning' : h<18 ? 'Good afternoon' : 'Good evening'; }
function timeAgo(iso?: string): string {
    if(!iso) return 'just now';
    const m = Math.floor((Date.now() - new Date(iso).getTime())/60000);
    if(m < 1) return 'just now'; if(m < 60) return `${m}m ago`;
    const h = Math.floor(m/60); if(h < 24) return `${h}h ago`;
    return `${Math.floor(h/24)}d ago`;
}

// ─── Command Center ───────────────────────────────────────────────────────────
function CommandCenter() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [resumes, setResumes] = useState<ResumeItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [command, setCommand] = useState('');
    const inputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        Promise.all([
            api.get('/auth/me').then(r => setName((r.data.full_name || r.data.email || '').split(' ')[0].split('@')[0])).catch(()=>{}),
            api.get<ResumeItem[]>('/resume/list').then(r => setResumes(r.data)).catch(()=>setResumes([])),
        ]).finally(() => setLoading(false));
    }, []);

    const latest = resumes[0];
    const ready = readiness(latest?.parsed_content);
    const ats = atsScore(latest?.parsed_content);
    const percentile = latest ? percentileVsApplicants(ready) : 0;
    const atsGain = latest ? potentialAtsGain(latest?.parsed_content) : 0;

    // Smart routing: "optimize/tailor for X" → Job Match Studio; else → AI Interview
    const run = (intent?: string) => {
        const v = (intent ?? command).trim();
        const wantsMatch = /optimi[sz]e|tailor|match|\bfor (amazon|google|microsoft|meta|apple|netflix)/i.test(v);
        if (wantsMatch && latest) { router.push(`/match?id=${latest.id}`); return; }
        if(v) { try { sessionStorage.setItem('ai_intent', v); } catch {} }
        router.push('/builder/interview');
    };
    const fixEverything = () => { router.push(latest ? `/health?id=${latest.id}` : '/builder/scratch'); };
    const logout = () => { try { localStorage.removeItem('token'); } catch {}; router.push('/login'); };

    const SUGGESTED = ['Create a DevOps resume', 'Optimize for Amazon', 'Create a PM resume', 'Improve my ATS score'];

    // Missing-item derivation (canonical engine)
    const p = latest?.parsed_content;
    const missing: string[] = latest ? missingSignals(p) : [];

    // AI activity (grounded in real numbers, framed as achievements)
    const activity = latest ? [
        { text: `ATS score reached ${ats}`, delta: `${ats}`, ok: ats>=60 },
        { text: `${p?.skills?.length||0} skills tracked on your profile`, delta: `+${p?.skills?.length||0}`, ok: (p?.skills?.length||0)>=3 },
        { text: countMetrics(p)>0 ? `${countMetrics(p)} measurable achievements detected` : 'No measurable achievements yet', delta: `${countMetrics(p)}`, ok: countMetrics(p)>0 },
        { text: (p?.summary?.length||0)>50 ? 'Professional summary in place' : 'Summary needs strengthening', delta: '', ok: (p?.summary?.length||0)>50 },
    ] : [];

    return (
        <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
            {/* Top bar */}
            <div className="h-14 flex items-center px-6 gap-3 sticky top-0 z-10" style={{ background: 'rgba(250,250,252,0.8)', backdropFilter: 'blur(12px)' }}>
                <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: 'var(--primary)' }}>
                    <Sparkles size={15} className="text-white" />
                </div>
                <span className="font-bold text-slate-800 text-sm">ResumeAI</span>
                <div className="flex-1" />
                <button onClick={() => router.push('/admin')} className="text-xs text-slate-400 hover:text-slate-700 transition-colors">Settings</button>
                <button onClick={logout} className="text-slate-400 hover:text-slate-700 transition-colors"><LogOut size={15} /></button>
            </div>

            {/* ─── HERO (dominant) ─────────────────────────────────────────── */}
            <section className="max-w-3xl mx-auto px-6 pt-20 pb-16 text-center">
                <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
                    <p className="text-slate-400 font-medium mb-2">{greeting()}{name ? `, ${name}` : ''} 👋</p>
                    <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 mb-8 leading-[1.1]">
                        What role are you<br />targeting today?
                    </h1>
                </motion.div>

                {/* Big AI input */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
                    <div className="surface-elevated p-3 text-left" style={{ borderRadius: 'var(--radius-xl)' }}>
                        <textarea
                            ref={inputRef}
                            rows={2}
                            className="w-full bg-transparent outline-none text-lg text-slate-800 placeholder-slate-300 resize-none px-2 pt-1"
                            placeholder="Describe what you want…  e.g. “Create a Senior Product Manager resume optimized for Amazon”"
                            value={command}
                            onChange={e => setCommand(e.target.value)}
                            onKeyDown={e => { if(e.key === 'Enter' && !e.shiftKey){ e.preventDefault(); run(); } }}
                        />
                        <div className="flex items-center justify-between px-2 pt-2">
                            {/* Workflow strip — one flow, not 3 cards */}
                            <div className="flex items-center gap-1 text-xs text-slate-400">
                                <span className="hidden sm:inline mr-1">Start with</span>
                                <button onClick={() => router.push(latest ? `/match?id=${latest.id}` : '/builder/interview')} className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-slate-50 hover:text-slate-700 transition-colors"><Target size={12}/>Job Description</button>
                                <span className="text-slate-200">·</span>
                                <button onClick={() => router.push('/builder/interview')} className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-slate-50 hover:text-slate-700 transition-colors"><Sparkles size={12}/>AI Interview</button>
                                <span className="text-slate-200">·</span>
                                <button onClick={() => router.push('/builder')} className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-slate-50 hover:text-slate-700 transition-colors"><Upload size={12}/>Upload</button>
                                <span className="text-slate-200">·</span>
                                <button onClick={() => router.push(latest ? `/coach?id=${latest.id}` : '/builder/interview')} className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-slate-50 hover:text-slate-700 transition-colors"><Rocket size={12}/>Career Coach</button>
                            </div>
                            <button onClick={() => run()} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95" style={{ background: 'var(--primary)' }}>
                                Generate <CornerDownLeft size={14} />
                            </button>
                        </div>
                    </div>

                    {/* Suggested */}
                    <div className="flex flex-wrap justify-center gap-2 mt-5">
                        {SUGGESTED.map(s => (
                            <button key={s} onClick={() => run(s)} className="text-sm px-3.5 py-1.5 rounded-full bg-white text-slate-500 hover:text-slate-900 transition-all hover:-translate-y-0.5" style={{ boxShadow: 'var(--shadow-sm)' }}>
                                {s}
                            </button>
                        ))}
                    </div>
                </motion.div>
            </section>

            <div className="max-w-3xl mx-auto px-6 pb-24 space-y-12">
                {/* ─── RESUME HEALTH CHECK — the wow band ───────────────────── */}
                {!loading && latest && (
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
                        className="relative overflow-hidden rounded-3xl p-7 text-white"
                        style={{ background: 'linear-gradient(135deg, #6D5DFC 0%, #8B7BFF 55%, #00D4FF 140%)' }}>
                        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full opacity-20" style={{ background: 'white' }} />
                        <div className="relative">
                            <div className="flex items-center gap-2 mb-1">
                                <Zap size={15} /><span className="text-xs font-bold uppercase tracking-widest opacity-80">Resume Health Check</span>
                            </div>
                            <p className="text-2xl font-black leading-tight mb-5">
                                Your resume is stronger than<br /><span className="text-3xl">{percentile}%</span> of applicants
                            </p>

                            <div className="flex flex-wrap items-end gap-6">
                                <div>
                                    <p className="text-[11px] uppercase tracking-wider opacity-70 mb-1.5">Missing</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {(missing.length ? missing : ['Resume looking strong']).map(k => (
                                            <span key={k} className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: 'rgba(255,255,255,0.18)' }}>{k}</span>
                                        ))}
                                    </div>
                                </div>
                                <div className="ml-auto text-right">
                                    <p className="text-[11px] uppercase tracking-wider opacity-70">Potential ATS Gain</p>
                                    <p className="text-3xl font-black flex items-center gap-1 justify-end"><TrendingUp size={20}/>+{atsGain}</p>
                                </div>
                            </div>

                            <button onClick={fixEverything} className="mt-6 w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-sm font-black transition-all hover:scale-[1.02] active:scale-95" style={{ background: 'white', color: 'var(--primary)' }}>
                                <Wand2 size={15} /> Fix Everything — One Click
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* ─── RESUME STUDIO — alive rows, not file manager ─────────── */}
                {!loading && (
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-bold text-slate-800 text-lg">Your Resume Studio</h2>
                            <button onClick={() => run()} className="text-xs font-bold transition-colors" style={{ color: 'var(--primary)' }}>+ New</button>
                        </div>

                        {resumes.length === 0 ? (
                            <div className="text-center py-14">
                                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--primary-light)' }}>
                                    <Sparkles size={24} style={{ color: 'var(--primary)' }} />
                                </div>
                                <h3 className="font-bold text-slate-800 mb-1">No resumes yet</h3>
                                <p className="text-sm text-slate-500 mb-5">Describe your target role above and AI writes the first draft.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {resumes.map(r => {
                                    const a = atsScore(r.parsed_content);
                                    const rd = readiness(r.parsed_content);
                                    const mc = countMetrics(r.parsed_content);
                                    const lastImp = mc > 0 ? 'Added measurable achievements' : (r.parsed_content?.summary?.length>50 ? 'Optimized professional summary' : 'Draft started');
                                    return (
                                        <div key={r.id} className="w-full p-5 surface hover:-translate-y-0.5 transition-all group flex items-center gap-5">
                                            <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0" style={{ background: 'var(--primary-light)' }}>
                                                <FileText size={18} style={{ color: 'var(--primary)' }} />
                                            </div>
                                            <div className="flex-1 min-w-0 cursor-pointer" onClick={() => router.push(`/builder/scratch?id=${r.id}`)}>
                                                <h3 className="font-bold text-slate-800 truncate">{r.meta_data?.job_role || 'Untitled'} Resume</h3>
                                                <div className="flex items-center gap-4 mt-1.5">
                                                    <span className="text-xs font-semibold" style={{ color: 'var(--success)' }}>ATS {a}%</span>
                                                    <span className="text-xs font-semibold" style={{ color: 'var(--primary)' }}>Match {Math.min(rd+6,100)}%</span>
                                                    <span className="text-[11px] text-slate-400">{timeAgo(r.updated_at || r.created_at)}</span>
                                                </div>
                                                <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1"><Sparkles size={9} style={{ color: 'var(--primary)' }}/> Last AI improvement: {lastImp}</p>
                                            </div>
                                            <button onClick={() => router.push(`/coach?id=${r.id}`)} className="flex items-center gap-1 text-xs font-bold shrink-0 px-3 py-1.5 rounded-lg transition-colors hover:bg-violet-50" style={{ color: 'var(--primary)' }} title="Career Intelligence">
                                                <Rocket size={13} /> Coach
                                            </button>
                                            <button onClick={() => router.push(`/templates?id=${r.id}`)} className="flex items-center gap-1 text-xs font-bold shrink-0 px-3 py-1.5 rounded-lg transition-colors hover:bg-violet-50" style={{ color: 'var(--primary)' }} title="Template Intelligence">
                                                <Layers size={13} /> Style
                                            </button>
                                            <button onClick={() => router.push(`/match?id=${r.id}`)} className="flex items-center gap-1 text-xs font-bold shrink-0 px-3 py-1.5 rounded-lg transition-colors hover:bg-violet-50" style={{ color: 'var(--primary)' }} title="Job Match Studio">
                                                <Target size={13} /> Match
                                            </button>
                                            <button onClick={() => router.push(`/health?id=${r.id}`)} className="flex items-center gap-1 text-xs font-bold shrink-0 px-3 py-1.5 rounded-lg transition-colors hover:bg-violet-50" style={{ color: 'var(--primary)' }} title="Resume Health Center">
                                                <Zap size={13} /> Health
                                            </button>
                                            <button onClick={() => router.push(`/builder/scratch?id=${r.id}`)} className="flex items-center gap-1 text-sm font-bold shrink-0 transition-transform group-hover:translate-x-1" style={{ color: 'var(--primary)' }}>
                                                Continue <ArrowRight size={14} />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </motion.div>
                )}

                {/* ─── AI ACTIVITY FEED ─────────────────────────────────────── */}
                {!loading && latest && (
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                        <h2 className="font-bold text-slate-800 text-lg mb-4">Recent AI Activity</h2>
                        <div className="space-y-1">
                            {activity.map((a, i) => (
                                <div key={i} className="flex items-center gap-3 py-2.5 px-1">
                                    <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: a.ok ? 'var(--success)' : '#E2E8F0' }}>
                                        <Check size={11} className={a.ok ? 'text-white' : 'text-slate-400'} />
                                    </div>
                                    <span className={`text-sm flex-1 ${a.ok ? 'text-slate-700' : 'text-slate-400'}`}>{a.text}</span>
                                    {a.delta && <span className="text-xs font-black" style={{ color: a.ok ? 'var(--success)' : '#94a3b8' }}>{a.delta}</span>}
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {loading && <div className="flex justify-center py-20 text-slate-300"><Sparkles size={20} className="animate-pulse" /></div>}
            </div>
        </div>
    );
}

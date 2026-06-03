'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Sparkles, ArrowLeft, Wand2, Check, X, RefreshCw, TrendingUp,
    AlertTriangle, Lightbulb, ChevronRight, ArrowRight, Zap,
} from 'lucide-react';
import api from '@/api/client';
import { ResumeResponse } from '@/types';
import AuthGuard from '@/components/AuthGuard';
import {
    healthReport, overallScore, skillName, HealthReport,
} from '@/lib/resumeInsights';

export default function HealthPage() {
    return (
        <AuthGuard>
            <Suspense fallback={<div className="h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}><Sparkles className="animate-pulse text-slate-300" /></div>}>
                <HealthCenter />
            </Suspense>
        </AuthGuard>
    );
}

interface Diff { before: any; after: any }

function HealthCenter() {
    const router = useRouter();
    const params = useSearchParams();
    const id = params.get('id');

    const [resume, setResume] = useState<ResumeResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [report, setReport] = useState<HealthReport | null>(null);
    const [improving, setImproving] = useState(false);
    const [diff, setDiff] = useState<Diff | null>(null);
    const [applying, setApplying] = useState(false);
    const [error, setError] = useState('');
    const [done, setDone] = useState(false);

    const jobRole = (resume?.meta_data as any)?.job_role || '';

    useEffect(() => {
        if (!id) { setLoading(false); return; }
        api.get<ResumeResponse>(`/resume/${id}`).then(r => {
            setResume(r.data);
            setReport(healthReport(r.data.parsed_content as any, (r.data.meta_data as any)?.job_role || ''));
        }).catch(() => setError('Could not load resume.')).finally(() => setLoading(false));
    }, [id]);

    const runImprove = async () => {
        if (!resume) return;
        setImproving(true); setError('');
        try {
            const r = await api.post<Diff>(`/resume/${resume.id}/health-improve`, { job_description: '' });
            setDiff(r.data);
        } catch (e: any) {
            const s = e?.response?.status, d = e?.response?.data?.detail;
            setError(s === 429 ? (d || 'AI quota exceeded — wait and retry.') : (d || 'Improvement failed.'));
        } finally { setImproving(false); }
    };

    const applyAll = async () => {
        if (!resume || !diff) return;
        setApplying(true);
        try {
            const r = await api.patch<ResumeResponse>(`/resume/${resume.id}/bulk-apply`, { content: diff.after });
            setResume(r.data);
            setReport(healthReport(r.data.parsed_content as any, jobRole));
            setDiff(null); setDone(true);
            setTimeout(() => setDone(false), 2600);
        } catch { setError('Could not apply improvements.'); }
        finally { setApplying(false); }
    };

    if (loading) return <div className="h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}><Sparkles className="animate-pulse text-slate-300" /></div>;
    if (!resume || !report) return (
        <div className="h-screen flex flex-col items-center justify-center gap-3" style={{ background: 'var(--bg)' }}>
            <p className="text-slate-500">{error || 'No resume selected.'}</p>
            <button onClick={() => router.push('/')} className="text-sm font-bold" style={{ color: 'var(--primary)' }}>← Back to dashboard</button>
        </div>
    );

    const metrics = [
        { label: 'Resume Strength', value: report.overall, primary: true },
        { label: 'ATS Score', value: report.ats },
        { label: 'Keyword Coverage', value: report.keywordCoverage },
        { label: 'Impact', value: report.impact },
        { label: 'Leadership', value: report.leadership },
        { label: 'Readability', value: report.readability },
        { label: 'Completeness', value: report.completeness },
    ];

    // Strengths / Weaknesses / Opportunities (deterministic, instant)
    const strengths: string[] = [];
    if (report.leadership >= 50) strengths.push('Strong leadership signals');
    if (report.keywordCoverage >= 60) strengths.push('Strong keyword coverage');
    if (report.impact >= 60) strengths.push('Impactful, metric-driven language');
    if (report.readability >= 75) strengths.push('Clean, readable formatting');
    if (report.completeness >= 80) strengths.push('All key sections complete');
    if (!strengths.length) strengths.push('Solid foundation to build on');

    const weaknesses = report.missingSignals.map(s => ({
        'Quantifiable metrics': 'Missing measurable achievements',
        'Leadership impact': 'Weak leadership signals',
        'Industry keywords': 'Missing industry terminology',
        'Strong summary': 'Summary needs strengthening',
        'Action verbs': 'Weak impact language',
    } as Record<string, string>)[s] || s);

    const opportunities = report.missingSignals.map(s => ({
        'Quantifiable metrics': 'Add metrics (%, $, time saved)',
        'Leadership impact': 'Add leadership & team examples',
        'Industry keywords': 'Add role-specific keywords',
        'Strong summary': 'Write a sharper summary',
        'Action verbs': 'Open bullets with action verbs',
    } as Record<string, string>)[s] || `Improve ${s.toLowerCase()}`);

    return (
        <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
            {/* Top bar */}
            <div className="h-14 flex items-center px-6 gap-3 sticky top-0 z-20" style={{ background: 'rgba(250,250,252,0.8)', backdropFilter: 'blur(12px)' }}>
                <button onClick={() => router.push('/')} className="flex items-center gap-1.5 text-slate-400 hover:text-slate-700 transition-colors text-sm"><ArrowLeft size={15} /> Back</button>
                <div className="flex-1 flex justify-center items-center gap-2">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'var(--primary)' }}><Zap size={13} className="text-white" /></div>
                    <span className="text-sm font-bold text-slate-800">Resume Health Center</span>
                </div>
                <button onClick={() => router.push(`/builder/scratch?id=${resume.id}`)} className="text-xs font-bold transition-colors" style={{ color: 'var(--primary)' }}>Open Editor →</button>
            </div>

            <main className="max-w-4xl mx-auto px-6 py-10 space-y-8">
                {/* HERO score ring + percentile */}
                <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                    className="relative overflow-hidden rounded-3xl p-8 text-white"
                    style={{ background: 'linear-gradient(135deg,#6D5DFC 0%,#8B7BFF 55%,#00D4FF 150%)' }}>
                    <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full opacity-20 bg-white" />
                    <div className="relative flex items-center gap-8">
                        <ScoreRing value={report.overall} />
                        <div className="flex-1">
                            <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-1">Resume Strength</p>
                            <p className="text-2xl font-black leading-tight mb-2">Stronger than {report.percentile}% of applicants</p>
                            <div className="flex items-center gap-2 text-sm opacity-90">
                                <TrendingUp size={15} /> Potential ATS gain <span className="font-black">+{report.potentialAtsGain} points</span>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Metric grid */}
                <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {metrics.slice(1).map(m => <MetricCard key={m.label} {...m} />)}
                </motion.div>

                {/* AI Insights: S / W / O */}
                <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <InsightColumn title="Strengths" icon={Check} color="var(--success)" items={strengths} good />
                    <InsightColumn title="Weaknesses" icon={AlertTriangle} color="#F59E0B" items={weaknesses.length ? weaknesses : ['No major weaknesses found']} />
                    <InsightColumn title="Opportunities" icon={Lightbulb} color="var(--primary)" items={opportunities.length ? opportunities : ['Fine-tune for each target role']} />
                </motion.div>

                {error && <p className="text-sm text-red-500 text-center">{error}</p>}

                {/* THE magic button */}
                {!diff && (
                    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="text-center pt-2">
                        <button onClick={runImprove} disabled={improving}
                            className="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl text-base font-black text-white transition-all hover:scale-[1.03] active:scale-95 disabled:opacity-60"
                            style={{ background: 'var(--primary)', boxShadow: '0 12px 32px rgba(109,93,252,0.35)' }}>
                            {improving ? <><RefreshCw size={18} className="animate-spin" /> AI is rewriting your resume…</> : <><Wand2 size={18} /> ✨ Improve Entire Resume</>}
                        </button>
                        <p className="text-xs text-slate-400 mt-3">AI rewrites every section. You review before/after and apply with one click.</p>
                    </motion.div>
                )}

                {/* BEFORE / AFTER transformation */}
                <AnimatePresence>
                    {diff && (
                        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2"><Sparkles size={18} style={{ color: 'var(--primary)' }} /> Your Transformation</h2>
                                <span className="text-sm font-bold px-3 py-1 rounded-full" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
                                    {overallScore(resume.parsed_content as any, jobRole)} → {overallScore({ ...(resume.parsed_content as any), ...diff.after }, jobRole)}
                                </span>
                            </div>

                            <BeforeAfter label="Summary" before={diff.before.summary} after={diff.after.summary} />
                            <BeforeAfterList label="Skills" before={(diff.before.skills || []).map(skillName)} after={(diff.after.skills || []).map(skillName)} />
                            <BeforeAfterExperience before={diff.before.work_experience || []} after={diff.after.work_experience || []} />

                            <div className="sticky bottom-4 flex gap-3 justify-center pt-2">
                                <button onClick={() => setDiff(null)} className="px-5 py-3 rounded-2xl text-sm font-bold text-slate-500 bg-white transition-all hover:bg-slate-50" style={{ boxShadow: 'var(--shadow-md)' }}>
                                    <X size={14} className="inline mr-1" /> Discard
                                </button>
                                <button onClick={applyAll} disabled={applying} className="px-7 py-3 rounded-2xl text-sm font-black text-white transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-60" style={{ background: 'var(--success)', boxShadow: '0 8px 24px rgba(0,194,122,0.35)' }}>
                                    {applying ? <><RefreshCw size={14} className="inline animate-spin mr-1.5" /> Applying…</> : <><Check size={15} className="inline mr-1.5" /> Apply All Improvements</>}
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {/* Success burst */}
            <AnimatePresence>
                {done && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
                        <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} className="px-7 py-5 rounded-3xl text-white text-center" style={{ background: 'var(--success)', boxShadow: '0 20px 60px rgba(0,194,122,0.4)' }}>
                            <Check size={36} className="mx-auto mb-1" />
                            <p className="font-black text-lg">Resume upgraded!</p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ─── Sub-components ────────────────────────────────────────────────────────────
function ScoreRing({ value }: { value: number }) {
    const R = 46, C = 2 * Math.PI * R;
    return (
        <div className="relative w-28 h-28 shrink-0">
            <svg width="112" height="112" className="rotate-[-90deg]">
                <circle cx="56" cy="56" r={R} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="8" />
                <motion.circle cx="56" cy="56" r={R} fill="none" stroke="white" strokeWidth="8" strokeLinecap="round"
                    strokeDasharray={C} initial={{ strokeDashoffset: C }} animate={{ strokeDashoffset: C * (1 - value / 100) }} transition={{ duration: 1, ease: 'easeOut' }} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black">{value}</span>
                <span className="text-[10px] uppercase tracking-wider opacity-80">/ 100</span>
            </div>
        </div>
    );
}

function MetricCard({ label, value }: { label: string; value: number }) {
    const color = value >= 75 ? 'var(--success)' : value >= 45 ? '#F59E0B' : '#EF4444';
    return (
        <div className="surface p-4">
            <div className="flex items-end justify-between mb-2">
                <span className="text-2xl font-black" style={{ color }}>{value}</span>
                <span className="text-[10px] text-slate-300 mb-1">/100</span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-2">
                <motion.div className="h-full rounded-full" style={{ background: color }} initial={{ width: 0 }} animate={{ width: `${value}%` }} transition={{ duration: 0.7 }} />
            </div>
            <p className="text-[11px] font-semibold text-slate-500">{label}</p>
        </div>
    );
}

function InsightColumn({ title, icon: Icon, color, items, good }: { title: string; icon: any; color: string; items: string[]; good?: boolean }) {
    return (
        <div className="surface p-5">
            <div className="flex items-center gap-2 mb-3">
                <Icon size={15} style={{ color }} />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{title}</span>
            </div>
            <ul className="space-y-2">
                {items.map((it, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                        <span className="mt-0.5 shrink-0" style={{ color }}>{good ? '✓' : '•'}</span>{it}
                    </li>
                ))}
            </ul>
        </div>
    );
}

function BeforeAfter({ label, before, after }: { label: string; before: string; after: string }) {
    if (!after || after === before) return null;
    return (
        <div className="surface p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">{label}</p>
            <div className="grid md:grid-cols-2 gap-4">
                <div className="rounded-xl p-3 bg-slate-50">
                    <p className="text-[10px] font-bold text-slate-400 mb-1.5">BEFORE</p>
                    <p className="text-sm text-slate-400 leading-relaxed">{before || <span className="italic">empty</span>}</p>
                </div>
                <div className="rounded-xl p-3" style={{ background: 'rgba(0,194,122,0.06)', border: '1px solid rgba(0,194,122,0.2)' }}>
                    <p className="text-[10px] font-bold mb-1.5 flex items-center gap-1" style={{ color: 'var(--success)' }}>AFTER <ArrowRight size={9} /></p>
                    <p className="text-sm text-slate-700 leading-relaxed">{after}</p>
                </div>
            </div>
        </div>
    );
}

function BeforeAfterList({ label, before, after }: { label: string; before: string[]; after: string[] }) {
    const added = after.filter(a => !before.map(b => b.toLowerCase()).includes(a.toLowerCase()));
    if (!added.length) return null;
    return (
        <div className="surface p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">{label} · <span style={{ color: 'var(--success)' }}>+{added.length} added</span></p>
            <div className="flex flex-wrap gap-1.5">
                {before.map((s, i) => <span key={`b${i}`} className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-500">{s}</span>)}
                {added.map((s, i) => <span key={`a${i}`} className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{ background: 'rgba(0,194,122,0.12)', color: 'var(--success)' }}>+ {s}</span>)}
            </div>
        </div>
    );
}

function BeforeAfterExperience({ before, after }: { before: any[]; after: any[] }) {
    if (!after.length) return null;
    return (
        <div className="surface p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Experience · rewritten bullets</p>
            <div className="space-y-4">
                {after.map((entry: any, i: number) => {
                    const beforeEntry = before[i];
                    return (
                        <div key={i}>
                            <p className="text-sm font-bold text-slate-700">{entry.role} <span className="text-slate-400 font-normal">· {entry.company}</span></p>
                            <div className="grid md:grid-cols-2 gap-3 mt-2">
                                <div className="rounded-xl p-3 bg-slate-50">
                                    <p className="text-[10px] font-bold text-slate-400 mb-1.5">BEFORE</p>
                                    <ul className="space-y-1">
                                        {(beforeEntry?.points || []).map((p: string, j: number) => <li key={j} className="text-xs text-slate-400 leading-snug">· {p}</li>)}
                                        {!(beforeEntry?.points || []).length && <li className="text-xs italic text-slate-300">empty</li>}
                                    </ul>
                                </div>
                                <div className="rounded-xl p-3" style={{ background: 'rgba(0,194,122,0.06)', border: '1px solid rgba(0,194,122,0.2)' }}>
                                    <p className="text-[10px] font-bold mb-1.5" style={{ color: 'var(--success)' }}>AFTER</p>
                                    <ul className="space-y-1">
                                        {(entry.points || []).map((p: string, j: number) => <li key={j} className="text-xs text-slate-700 leading-snug">· {p}</li>)}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

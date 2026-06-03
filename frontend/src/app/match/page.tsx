'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Sparkles, ArrowLeft, Wand2, Check, X, RefreshCw, Target,
    AlertTriangle, ThumbsUp, ThumbsDown, Eye, Search, ArrowRight, Zap,
} from 'lucide-react';
import api from '@/api/client';
import { ResumeResponse } from '@/types';
import AuthGuard from '@/components/AuthGuard';
import { jobMatchReport, skillName, JobMatchReport } from '@/lib/resumeInsights';

export default function MatchPage() {
    return (
        <AuthGuard>
            <Suspense fallback={<div className="h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}><Sparkles className="animate-pulse text-slate-300" /></div>}>
                <JobMatchStudio />
            </Suspense>
        </AuthGuard>
    );
}

interface Gap { item: string; category: string; why: string }
interface Analysis {
    extracted: { skills?: string[]; technologies?: string[]; certifications?: string[]; responsibilities?: string[]; seniority_signals?: string[]; leadership_signals?: string[] };
    gaps: Gap[];
    recruiter: { likes?: string[]; rejects?: string[]; concerns?: string[]; strengths?: string[] };
}
interface Diff { before: any; after: any }

function JobMatchStudio() {
    const router = useRouter();
    const id = useSearchParams().get('id');

    const [resume, setResume] = useState<ResumeResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [jd, setJd] = useState('');
    const [company, setCompany] = useState('');
    const [analyzing, setAnalyzing] = useState(false);
    const [report, setReport] = useState<JobMatchReport | null>(null);
    const [analysis, setAnalysis] = useState<Analysis | null>(null);
    const [tailoring, setTailoring] = useState(false);
    const [diff, setDiff] = useState<Diff | null>(null);
    const [applying, setApplying] = useState(false);
    const [done, setDone] = useState(false);
    const [error, setError] = useState('');

    const jobRole = (resume?.meta_data as any)?.job_role || '';

    useEffect(() => {
        try { const stashed = sessionStorage.getItem('match_jd'); if (stashed) { setJd(stashed); sessionStorage.removeItem('match_jd'); } } catch {}
        if (!id) { setLoading(false); return; }
        api.get<ResumeResponse>(`/resume/${id}`).then(r => setResume(r.data)).catch(() => setError('Could not load resume.')).finally(() => setLoading(false));
    }, [id]);

    const analyze = async () => {
        if (!jd.trim() || !resume) return;
        setAnalyzing(true); setError(''); setDiff(null);
        setReport(jobMatchReport(resume.parsed_content as any, jd, jobRole)); // instant numbers
        try {
            const r = await api.post<Analysis>(`/resume/${resume.id}/job-analyze`, { job_description: jd, company });
            setAnalysis(r.data);
        } catch (e: any) {
            const s = e?.response?.status, d = e?.response?.data?.detail;
            setError(s === 429 ? (d || 'AI quota exceeded — wait and retry.') : (d || 'Analysis failed.'));
        } finally { setAnalyzing(false); }
    };

    const tailor = async () => {
        if (!resume) return;
        setTailoring(true); setError('');
        try {
            const r = await api.post<Diff>(`/resume/${resume.id}/health-improve`, { job_description: jd });
            setDiff(r.data);
        } catch (e: any) {
            const s = e?.response?.status, d = e?.response?.data?.detail;
            setError(s === 429 ? (d || 'AI quota exceeded — wait and retry.') : (d || 'Tailoring failed.'));
        } finally { setTailoring(false); }
    };

    const applyAll = async () => {
        if (!resume || !diff) return;
        setApplying(true);
        try {
            const r = await api.patch<ResumeResponse>(`/resume/${resume.id}/bulk-apply`, { content: diff.after });
            setResume(r.data);
            setReport(jobMatchReport(r.data.parsed_content as any, jd, jobRole));
            setDiff(null); setDone(true);
            setTimeout(() => setDone(false), 2600);
        } catch { setError('Could not apply changes.'); }
        finally { setApplying(false); }
    };

    if (loading) return <div className="h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}><Sparkles className="animate-pulse text-slate-300" /></div>;
    if (!resume) return (
        <div className="h-screen flex flex-col items-center justify-center gap-3" style={{ background: 'var(--bg)' }}>
            <p className="text-slate-500">{error || 'No resume selected.'}</p>
            <button onClick={() => router.push('/')} className="text-sm font-bold" style={{ color: 'var(--primary)' }}>← Back to dashboard</button>
        </div>
    );

    return (
        <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
            {/* Top bar */}
            <div className="h-14 flex items-center px-6 gap-3 sticky top-0 z-20" style={{ background: 'rgba(250,250,252,0.8)', backdropFilter: 'blur(12px)' }}>
                <button onClick={() => router.push('/')} className="flex items-center gap-1.5 text-slate-400 hover:text-slate-700 transition-colors text-sm"><ArrowLeft size={15} /> Back</button>
                <div className="flex-1 flex justify-center items-center gap-2">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'var(--primary)' }}><Target size={13} className="text-white" /></div>
                    <span className="text-sm font-bold text-slate-800">Job Match Studio</span>
                </div>
                <button onClick={() => router.push(`/builder/scratch?id=${resume.id}`)} className="text-xs font-bold transition-colors" style={{ color: 'var(--primary)' }}>Open Editor →</button>
            </div>

            <main className="max-w-4xl mx-auto px-6 py-10 space-y-8">
                {/* STEP 1 — Paste JD */}
                <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
                    <h1 className="text-2xl font-black text-slate-900 mb-1">Paste the job description</h1>
                    <p className="text-slate-500 mb-4">AI extracts the requirements, scores your match, and can rewrite your resume to fit.</p>
                    <div className="surface p-4">
                        <textarea className="w-full h-40 bg-transparent outline-none text-sm text-slate-700 placeholder-slate-300 resize-none" placeholder="Paste the full job description here…" value={jd} onChange={e => setJd(e.target.value)} />
                        <div className="flex items-center gap-3 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                            <input className="flex-1 text-sm bg-transparent outline-none text-slate-700 placeholder-slate-300" placeholder="Target company (optional, e.g. Amazon)" value={company} onChange={e => setCompany(e.target.value)} />
                            <button onClick={analyze} disabled={!jd.trim() || analyzing} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-40" style={{ background: 'var(--primary)' }}>
                                {analyzing ? <><RefreshCw size={14} className="animate-spin" /> Analyzing…</> : <><Search size={14} /> Analyze Match</>}
                            </button>
                        </div>
                    </div>
                </motion.div>

                {error && <p className="text-sm text-red-500 text-center">{error}</p>}

                {/* STEP 2 — Match report */}
                {report && (
                    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                        <div className="relative overflow-hidden rounded-3xl p-7 text-white" style={{ background: 'linear-gradient(135deg,#6D5DFC 0%,#8B7BFF 55%,#00D4FF 150%)' }}>
                            <div className="absolute -right-10 -top-10 w-44 h-44 rounded-full opacity-20 bg-white" />
                            <div className="relative flex items-center gap-6 flex-wrap">
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-1">Match Score</p>
                                    <p className="text-5xl font-black">{report.match}%</p>
                                    <p className="text-sm opacity-90 mt-1">Stronger than {report.percentile}% of applicants · +{report.potentialGain} potential</p>
                                </div>
                                <div className="grid grid-cols-3 gap-x-6 gap-y-3 ml-auto">
                                    {[
                                        ['Keyword', report.keywordCoverage], ['Technical', report.technicalMatch], ['Leadership', report.leadershipMatch],
                                        ['Experience', report.experienceMatch], ['ATS', report.atsCompatibility],
                                    ].map(([l, v]) => (
                                        <div key={l as string}>
                                            <p className="text-2xl font-black">{v as number}<span className="text-sm opacity-70">%</span></p>
                                            <p className="text-[10px] uppercase tracking-wider opacity-70">{l as string}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Extracted requirements (visual) */}
                        {analysis && (
                            <div className="surface p-5">
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1"><Eye size={13} /> What this role demands</p>
                                <div className="space-y-3">
                                    {([
                                        ['Skills', analysis.extracted.skills, 'var(--primary)'],
                                        ['Technologies', analysis.extracted.technologies, '#00D4FF'],
                                        ['Certifications', analysis.extracted.certifications, '#F59E0B'],
                                        ['Leadership', analysis.extracted.leadership_signals, 'var(--success)'],
                                        ['Seniority', analysis.extracted.seniority_signals, '#EC4899'],
                                    ] as [string, string[] | undefined, string][]).filter(([, arr]) => arr && arr.length).map(([label, arr, color]) => (
                                        <div key={label}>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1.5">{label}</p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {arr!.map((t, i) => {
                                                    const has = report.matchedKeywords.some(k => t.toLowerCase().includes(k) || k.includes(t.toLowerCase()));
                                                    return <span key={i} className="text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1" style={has ? { background: 'rgba(0,194,122,0.12)', color: 'var(--success)' } : { background: `${color}14`, color }}>
                                                        {has && <Check size={9} />}{t}
                                                    </span>;
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* STEP 3 — Gap analysis with WHY */}
                        {analysis && analysis.gaps?.length > 0 && (
                            <div className="surface p-5">
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1"><AlertTriangle size={13} style={{ color: '#F59E0B' }} /> Gaps holding you back</p>
                                <div className="space-y-2.5">
                                    {analysis.gaps.map((g, i) => (
                                        <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-amber-50/60">
                                            <span className="text-xs px-2 py-0.5 rounded-md font-bold shrink-0 mt-0.5" style={{ background: '#FEF3C7', color: '#B45309' }}>{g.category}</span>
                                            <div>
                                                <p className="text-sm font-bold text-slate-800">{g.item}</p>
                                                <p className="text-xs text-slate-500 mt-0.5">{g.why}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* STEP 6 — Recruiter Perspective */}
                        {analysis?.recruiter && (
                            <div className="surface p-5">
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1"><Sparkles size={13} style={{ color: 'var(--primary)' }} /> Recruiter Perspective</p>
                                <div className="grid sm:grid-cols-2 gap-4">
                                    <RecruiterCol title="Strengths that stand out" icon={ThumbsUp} color="var(--success)" items={analysis.recruiter.strengths} />
                                    <RecruiterCol title="What a recruiter likes" icon={Check} color="var(--primary)" items={analysis.recruiter.likes} />
                                    <RecruiterCol title="Hiring-manager concerns" icon={AlertTriangle} color="#F59E0B" items={analysis.recruiter.concerns} />
                                    <RecruiterCol title="Why they might reject" icon={ThumbsDown} color="#EF4444" items={analysis.recruiter.rejects} />
                                </div>
                            </div>
                        )}

                        {/* STEP 4 — Flagship tailor button */}
                        {!diff && (
                            <div className="text-center pt-2">
                                <button onClick={tailor} disabled={tailoring} className="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl text-base font-black text-white transition-all hover:scale-[1.03] active:scale-95 disabled:opacity-60" style={{ background: 'var(--primary)', boxShadow: '0 12px 32px rgba(109,93,252,0.35)' }}>
                                    {tailoring ? <><RefreshCw size={18} className="animate-spin" /> AI is tailoring your resume…</> : <><Wand2 size={18} /> ✨ Tailor Resume For This Job</>}
                                </button>
                                <p className="text-xs text-slate-400 mt-3">AI rewrites every section using this job description. Review before/after, then apply.</p>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* STEP 4/5 — Before/After + atomic apply */}
                <AnimatePresence>
                    {diff && (
                        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2"><Sparkles size={18} style={{ color: 'var(--primary)' }} /> Tailored for this role</h2>
                                <span className="text-sm font-bold px-3 py-1 rounded-full" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
                                    Match {report?.match}% → {jobMatchReport({ ...(resume.parsed_content as any), ...diff.after }, jd, jobRole).match}%
                                </span>
                            </div>
                            <BeforeAfter label="Summary" before={diff.before.summary} after={diff.after.summary} />
                            <BeforeAfterList label="Skills" before={(diff.before.skills || []).map(skillName)} after={(diff.after.skills || []).map(skillName)} />
                            <BeforeAfterExperience before={diff.before.work_experience || []} after={diff.after.work_experience || []} />
                            <div className="sticky bottom-4 flex gap-3 justify-center pt-2">
                                <button onClick={() => setDiff(null)} className="px-5 py-3 rounded-2xl text-sm font-bold text-slate-500 bg-white transition-all hover:bg-slate-50" style={{ boxShadow: 'var(--shadow-md)' }}><X size={14} className="inline mr-1" /> Discard</button>
                                <button onClick={applyAll} disabled={applying} className="px-7 py-3 rounded-2xl text-sm font-black text-white transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-60" style={{ background: 'var(--success)', boxShadow: '0 8px 24px rgba(0,194,122,0.35)' }}>
                                    {applying ? <><RefreshCw size={14} className="inline animate-spin mr-1.5" /> Applying…</> : <><Check size={15} className="inline mr-1.5" /> Apply All Changes</>}
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            <AnimatePresence>
                {done && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
                        <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} className="px-7 py-5 rounded-3xl text-white text-center" style={{ background: 'var(--success)', boxShadow: '0 20px 60px rgba(0,194,122,0.4)' }}>
                            <Check size={36} className="mx-auto mb-1" />
                            <p className="font-black text-lg">Resume tailored!</p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function RecruiterCol({ title, icon: Icon, color, items }: { title: string; icon: any; color: string; items?: string[] }) {
    if (!items || !items.length) return null;
    return (
        <div className="rounded-xl p-4" style={{ background: `${color}0A`, border: `1px solid ${color}22` }}>
            <p className="text-xs font-bold mb-2 flex items-center gap-1.5" style={{ color }}><Icon size={13} /> {title}</p>
            <ul className="space-y-1.5">
                {items.map((it, i) => <li key={i} className="text-xs text-slate-600 flex items-start gap-1.5"><span className="shrink-0 mt-0.5" style={{ color }}>•</span>{it}</li>)}
            </ul>
        </div>
    );
}

// Shared before/after primitives (mirror Health Center)
function BeforeAfter({ label, before, after }: { label: string; before: string; after: string }) {
    if (!after || after === before) return null;
    return (
        <div className="surface p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">{label}</p>
            <div className="grid md:grid-cols-2 gap-4">
                <div className="rounded-xl p-3 bg-slate-50"><p className="text-[10px] font-bold text-slate-400 mb-1.5">BEFORE</p><p className="text-sm text-slate-400 leading-relaxed">{before || <span className="italic">empty</span>}</p></div>
                <div className="rounded-xl p-3" style={{ background: 'rgba(0,194,122,0.06)', border: '1px solid rgba(0,194,122,0.2)' }}><p className="text-[10px] font-bold mb-1.5 flex items-center gap-1" style={{ color: 'var(--success)' }}>AFTER <ArrowRight size={9} /></p><p className="text-sm text-slate-700 leading-relaxed">{after}</p></div>
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
                    const b = before[i];
                    return (
                        <div key={i}>
                            <p className="text-sm font-bold text-slate-700">{entry.role} <span className="text-slate-400 font-normal">· {entry.company}</span></p>
                            <div className="grid md:grid-cols-2 gap-3 mt-2">
                                <div className="rounded-xl p-3 bg-slate-50"><p className="text-[10px] font-bold text-slate-400 mb-1.5">BEFORE</p><ul className="space-y-1">{(b?.points || []).map((p: string, j: number) => <li key={j} className="text-xs text-slate-400 leading-snug">· {p}</li>)}{!(b?.points || []).length && <li className="text-xs italic text-slate-300">empty</li>}</ul></div>
                                <div className="rounded-xl p-3" style={{ background: 'rgba(0,194,122,0.06)', border: '1px solid rgba(0,194,122,0.2)' }}><p className="text-[10px] font-bold mb-1.5" style={{ color: 'var(--success)' }}>AFTER</p><ul className="space-y-1">{(entry.points || []).map((p: string, j: number) => <li key={j} className="text-xs text-slate-700 leading-snug">· {p}</li>)}</ul></div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Sparkles, ArrowLeft, Wand2, Check, X, RefreshCw, Layers,
    TrendingUp, ArrowRight, Star, ChevronRight,
} from 'lucide-react';
import api from '@/api/client';
import { ResumeResponse } from '@/types';
import AuthGuard from '@/components/AuthGuard';
import { TemplateRenderer } from '@/components/resume/TemplateRenderer';
import {
    TEMPLATES, recommendTemplate, projectedImpact, templateById,
    TemplateProfile, Recommendation,
} from '@/lib/templateIntelligence';

export default function TemplatesPage() {
    return (
        <AuthGuard>
            <Suspense fallback={<div className="h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}><Sparkles className="animate-pulse text-slate-300" /></div>}>
                <TemplateIntelligence />
            </Suspense>
        </AuthGuard>
    );
}

interface Diff { before: any; after: any }

function TemplateIntelligence() {
    const router = useRouter();
    const id = useSearchParams().get('id');

    const [resume, setResume] = useState<ResumeResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [rec, setRec] = useState<Recommendation | null>(null);
    const [selected, setSelected] = useState<TemplateProfile | null>(null);
    const [transforming, setTransforming] = useState(false);
    const [diff, setDiff] = useState<Diff | null>(null);
    const [applying, setApplying] = useState(false);
    const [done, setDone] = useState(false);
    const [error, setError] = useState('');

    const meta = (resume?.meta_data as any) || {};
    const jobRole = meta.job_role || '';
    const currentTemplate = templateById(resume?.template_id || 'minimal-pro');

    useEffect(() => {
        if (!id) { setLoading(false); return; }
        api.get<ResumeResponse>(`/resume/${id}`).then(r => {
            setResume(r.data);
            const rc = recommendTemplate({
                jobRole: (r.data.meta_data as any)?.job_role,
                experienceLevel: (r.data.meta_data as any)?.experience_level,
                industry: (r.data.meta_data as any)?.industry,
                content: r.data.parsed_content as any,
            });
            setRec(rc);
            setSelected(rc.template);
        }).catch(() => setError('Could not load resume.')).finally(() => setLoading(false));
    }, [id]);

    const transform = async () => {
        if (!resume || !selected) return;
        setTransforming(true); setError('');
        try {
            const r = await api.post<Diff>(`/resume/${resume.id}/transform-style`, {
                style_name: selected.name,
                style_directive: selected.styleDirective,
                template_id: selected.id,
            });
            setDiff(r.data);
        } catch (e: any) {
            const s = e?.response?.status, d = e?.response?.data?.detail;
            setError(s === 429 ? (d || 'AI quota exceeded — wait and retry.') : (d || 'Transformation failed.'));
        } finally { setTransforming(false); }
    };

    const applyAll = async () => {
        if (!resume || !diff || !selected) return;
        setApplying(true);
        try {
            const r = await api.patch<ResumeResponse>(`/resume/${resume.id}/bulk-apply`, { content: diff.after, template_id: selected.rendererId });
            setResume(r.data);
            setDiff(null); setDone(true);
            setTimeout(() => setDone(false), 2600);
        } catch { setError('Could not apply.'); }
        finally { setApplying(false); }
    };

    if (loading) return <div className="h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}><Sparkles className="animate-pulse text-slate-300" /></div>;
    if (!resume || !rec || !selected) return (
        <div className="h-screen flex flex-col items-center justify-center gap-3" style={{ background: 'var(--bg)' }}>
            <p className="text-slate-500">{error || 'No resume selected.'}</p>
            <button onClick={() => router.push('/')} className="text-sm font-bold" style={{ color: 'var(--primary)' }}>← Back to dashboard</button>
        </div>
    );

    const impact = projectedImpact(selected, resume.parsed_content as any, jobRole);
    const isRecommended = selected.id === rec.template.id;

    return (
        <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
            {/* Top bar */}
            <div className="h-14 flex items-center px-6 gap-3 sticky top-0 z-20" style={{ background: 'rgba(250,250,252,0.8)', backdropFilter: 'blur(12px)' }}>
                <button onClick={() => router.push('/')} className="flex items-center gap-1.5 text-slate-400 hover:text-slate-700 transition-colors text-sm"><ArrowLeft size={15} /> Back</button>
                <div className="flex-1 flex justify-center items-center gap-2">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'var(--primary)' }}><Layers size={13} className="text-white" /></div>
                    <span className="text-sm font-bold text-slate-800">Template Intelligence</span>
                </div>
                <button onClick={() => router.push(`/builder/scratch?id=${resume.id}`)} className="text-xs font-bold transition-colors" style={{ color: 'var(--primary)' }}>Open Editor →</button>
            </div>

            <main className="max-w-5xl mx-auto px-6 py-10 space-y-8">
                {/* RECOMMENDATION hero */}
                <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                    className="relative overflow-hidden rounded-3xl p-7 text-white" style={{ background: 'linear-gradient(135deg,#6D5DFC 0%,#8B7BFF 55%,#00D4FF 150%)' }}>
                    <div className="absolute -right-10 -top-10 w-44 h-44 rounded-full opacity-20 bg-white" />
                    <div className="relative">
                        <div className="flex items-center gap-2 mb-2"><Star size={14} /><span className="text-xs font-bold uppercase tracking-widest opacity-80">AI Recommended for you</span></div>
                        <div className="flex items-end gap-4 flex-wrap">
                            <p className="text-3xl font-black">{rec.template.name}</p>
                            <div className="px-3 py-1 rounded-full text-sm font-black" style={{ background: 'rgba(255,255,255,0.2)' }}>{rec.confidence}% confidence</div>
                        </div>
                        <p className="text-sm opacity-90 mt-2 max-w-xl">{rec.reason}</p>
                        <p className="text-xs opacity-75 mt-1">Best for: {rec.template.bestFor}</p>
                    </div>
                </motion.div>

                {/* Outcome-based template strip */}
                <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Resume strategies</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        {TEMPLATES.map(t => {
                            const active = selected.id === t.id;
                            const recommended = rec.template.id === t.id;
                            return (
                                <button key={t.id} onClick={() => { setSelected(t); setDiff(null); }}
                                    className="text-left p-4 rounded-2xl transition-all relative"
                                    style={active
                                        ? { background: 'white', boxShadow: `0 0 0 2px ${t.accent}, var(--shadow-md)` }
                                        : { background: 'white', boxShadow: 'var(--shadow-sm)' }}>
                                    {recommended && <span className="absolute top-2 right-2 text-[9px] font-black px-1.5 py-0.5 rounded-full text-white" style={{ background: t.accent }}>★ PICK</span>}
                                    <div className="w-8 h-8 rounded-lg mb-2 flex items-center justify-center" style={{ background: `${t.accent}18` }}><Layers size={15} style={{ color: t.accent }} /></div>
                                    <p className="text-sm font-bold text-slate-800">{t.name}</p>
                                    <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">{t.tagline}</p>
                                </button>
                            );
                        })}
                    </div>
                </motion.div>

                {/* IMPACT engine + live comparison */}
                <motion.div key={selected.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid lg:grid-cols-2 gap-6">
                    {/* Impact */}
                    <div className="surface p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Projected impact</p>
                                <p className="text-lg font-black text-slate-900">{selected.name}</p>
                            </div>
                            {isRecommended && <span className="text-[10px] font-black px-2 py-1 rounded-full" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>RECOMMENDED</span>}
                        </div>
                        <div className="space-y-3">
                            {[
                                ['ATS Score', impact.ats], ['Keyword Coverage', impact.keywords],
                                ['Readability', impact.readability], ['Leadership Signal', impact.leadership],
                            ].map(([label, v]: any) => {
                                const delta = v.next - v.now;
                                return (
                                    <div key={label} className="flex items-center gap-3">
                                        <span className="text-sm text-slate-600 w-36 shrink-0">{label}</span>
                                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden relative">
                                            <div className="h-full rounded-full absolute" style={{ width: `${v.now}%`, background: '#CBD5E1' }} />
                                            <motion.div className="h-full rounded-full absolute" style={{ background: selected.accent }} initial={{ width: `${v.now}%` }} animate={{ width: `${v.next}%` }} transition={{ duration: 0.6 }} />
                                        </div>
                                        <span className="text-xs font-bold w-16 text-right text-slate-700">{v.now}→{v.next}</span>
                                        <span className={`text-xs font-black w-8 ${delta > 0 ? 'text-emerald-500' : 'text-slate-300'}`}>{delta > 0 ? `+${delta}` : '—'}</span>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="mt-5 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                            <p className="text-xs text-slate-500"><strong className="text-slate-700">Who it's for:</strong> {selected.bestFor}</p>
                        </div>
                    </div>

                    {/* Live comparison preview */}
                    <div className="surface p-4">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Live preview</span>
                            <span className="text-[10px] text-slate-400">{currentTemplate?.name} → <strong style={{ color: selected.accent }}>{selected.name}</strong></span>
                        </div>
                        <div className="rounded-xl overflow-hidden bg-slate-100 h-72 overflow-y-auto">
                            {resume.parsed_content && (
                                <div className="origin-top scale-[0.62] w-[161%]">
                                    <div className="bg-white ats-preview">
                                        <TemplateRenderer content={resume.parsed_content as any} templateId={selected.rendererId} />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>

                {error && <p className="text-sm text-red-500 text-center">{error}</p>}

                {/* FLAGSHIP transform */}
                {!diff && (
                    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="text-center pt-2">
                        <button onClick={transform} disabled={transforming}
                            className="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl text-base font-black text-white transition-all hover:scale-[1.03] active:scale-95 disabled:opacity-60"
                            style={{ background: selected.accent, boxShadow: `0 12px 32px ${selected.accent}55` }}>
                            {transforming ? <><RefreshCw size={18} className="animate-spin" /> Restyling for {selected.name}…</> : <><Wand2 size={18} /> ✨ Transform Resume Style</>}
                        </button>
                        <p className="text-xs text-slate-400 mt-3">AI re-presents the <strong>same facts</strong> in {selected.name} style — tone, emphasis & leadership language. Nothing fabricated.</p>
                    </motion.div>
                )}

                {/* BEFORE/AFTER + explanation */}
                <AnimatePresence>
                    {diff && (
                        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2"><Sparkles size={18} style={{ color: selected.accent }} /> Restyled as {selected.name}</h2>
                            </div>

                            {/* Explanation: what/why/who/impact */}
                            <div className="grid sm:grid-cols-2 gap-3">
                                <ExplainCard title="What changed" body={`Tone, emphasis, and bullet framing shifted to a ${selected.name.toLowerCase()} style. Companies, roles, dates, and real metrics are untouched.`} color={selected.accent} />
                                <ExplainCard title="Why" body={selected.styleDirective} color={selected.accent} />
                                <ExplainCard title="Best for" body={selected.bestFor} color={selected.accent} />
                                <ExplainCard title="Expected impact" body={`ATS ${impact.ats.now}→${impact.ats.next}, Leadership ${impact.leadership.now}→${impact.leadership.next}, Keywords ${impact.keywords.now}→${impact.keywords.next}.`} color={selected.accent} />
                            </div>

                            <BeforeAfter label="Summary" before={diff.before.summary} after={diff.after.summary} accent={selected.accent} />
                            <BeforeAfterExperience before={diff.before.work_experience || []} after={diff.after.work_experience || []} accent={selected.accent} />

                            <div className="sticky bottom-4 flex gap-3 justify-center pt-2">
                                <button onClick={() => setDiff(null)} className="px-5 py-3 rounded-2xl text-sm font-bold text-slate-500 bg-white transition-all hover:bg-slate-50" style={{ boxShadow: 'var(--shadow-md)' }}><X size={14} className="inline mr-1" /> Discard</button>
                                <button onClick={applyAll} disabled={applying} className="px-7 py-3 rounded-2xl text-sm font-black text-white transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-60" style={{ background: 'var(--success)', boxShadow: '0 8px 24px rgba(0,194,122,0.35)' }}>
                                    {applying ? <><RefreshCw size={14} className="inline animate-spin mr-1.5" /> Applying…</> : <><Check size={15} className="inline mr-1.5" /> Apply {selected.name}</>}
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
                            <p className="font-black text-lg">Style applied!</p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function ExplainCard({ title, body, color }: { title: string; body: string; color: string }) {
    return (
        <div className="rounded-xl p-4" style={{ background: `${color}0A`, border: `1px solid ${color}22` }}>
            <p className="text-xs font-bold mb-1" style={{ color }}>{title}</p>
            <p className="text-xs text-slate-600 leading-relaxed">{body}</p>
        </div>
    );
}

function BeforeAfter({ label, before, after, accent }: { label: string; before: string; after: string; accent: string }) {
    if (!after || after === before) return null;
    return (
        <div className="surface p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">{label}</p>
            <div className="grid md:grid-cols-2 gap-4">
                <div className="rounded-xl p-3 bg-slate-50"><p className="text-[10px] font-bold text-slate-400 mb-1.5">BEFORE</p><p className="text-sm text-slate-400 leading-relaxed">{before || <span className="italic">empty</span>}</p></div>
                <div className="rounded-xl p-3" style={{ background: `${accent}0F`, border: `1px solid ${accent}33` }}><p className="text-[10px] font-bold mb-1.5 flex items-center gap-1" style={{ color: accent }}>AFTER <ArrowRight size={9} /></p><p className="text-sm text-slate-700 leading-relaxed">{after}</p></div>
            </div>
        </div>
    );
}

function BeforeAfterExperience({ before, after, accent }: { before: any[]; after: any[]; accent: string }) {
    if (!after.length) return null;
    return (
        <div className="surface p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Experience · restyled</p>
            <div className="space-y-4">
                {after.map((entry: any, i: number) => {
                    const b = before[i];
                    return (
                        <div key={i}>
                            <p className="text-sm font-bold text-slate-700">{entry.role} <span className="text-slate-400 font-normal">· {entry.company}</span></p>
                            <div className="grid md:grid-cols-2 gap-3 mt-2">
                                <div className="rounded-xl p-3 bg-slate-50"><p className="text-[10px] font-bold text-slate-400 mb-1.5">BEFORE</p><ul className="space-y-1">{(b?.points || []).map((p: string, j: number) => <li key={j} className="text-xs text-slate-400 leading-snug">· {p}</li>)}{!(b?.points || []).length && <li className="text-xs italic text-slate-300">empty</li>}</ul></div>
                                <div className="rounded-xl p-3" style={{ background: `${accent}0F`, border: `1px solid ${accent}33` }}><p className="text-[10px] font-bold mb-1.5" style={{ color: accent }}>AFTER</p><ul className="space-y-1">{(entry.points || []).map((p: string, j: number) => <li key={j} className="text-xs text-slate-700 leading-snug">· {p}</li>)}</ul></div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

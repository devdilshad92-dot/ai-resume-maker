'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Sparkles, ArrowLeft, RefreshCw, Target, TrendingUp,
    DollarSign, Brain, Map, Zap, CheckCircle2, Clock,
    Calendar, ChevronRight, ArrowRight, BookOpen, Award,
    Briefcase, AlertTriangle, Star, Rocket, Users,
    BarChart2, MessageSquare, Lock,
} from 'lucide-react';
import api from '@/api/client';
import { ResumeResponse } from '@/types';
import AuthGuard from '@/components/AuthGuard';
import {
    careerScores, CareerScores, CareerIntelligence, COACH_MODULES,
    SkillGap, RoadmapStep, ActionPlan, SalaryIntelligence,
    PromotionPath, InterviewQuestions,
} from '@/lib/careerIntelligence';
import { JobRoleAutocomplete } from '@/components/ui/JobRoleAutocomplete';

export default function CoachPage() {
    return (
        <AuthGuard>
            <Suspense fallback={<Loader />}>
                <CareerIntelligencePlatform />
            </Suspense>
        </AuthGuard>
    );
}

// ─── Tab definitions ──────────────────────────────────────────────────────────
type Tab = 'skills' | 'promotion' | 'salary' | 'interview' | 'roadmap' | 'actions';
const TABS: { id: Tab; label: string; icon: any }[] = [
    { id: 'skills',     label: 'Skill Gaps',  icon: Brain },
    { id: 'promotion',  label: 'Promotion',   icon: TrendingUp },
    { id: 'salary',     label: 'Salary',      icon: DollarSign },
    { id: 'interview',  label: 'Interview',   icon: MessageSquare },
    { id: 'roadmap',    label: 'Roadmap',     icon: Map },
    { id: 'actions',    label: 'Action Plan', icon: Zap },
];

// ─── Main platform ────────────────────────────────────────────────────────────
function CareerIntelligencePlatform() {
    const router = useRouter();
    const params = useSearchParams();
    const id = params.get('id');

    const [resume, setResume] = useState<ResumeResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [scores, setScores] = useState<CareerScores | null>(null);
    const [targetRole, setTargetRole] = useState('');
    const [jd, setJd] = useState('');
    const [showJd, setShowJd] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [intel, setIntel] = useState<CareerIntelligence | null>(null);
    const [activeTab, setActiveTab] = useState<Tab>('skills');
    const [error, setError] = useState('');

    useEffect(() => {
        if (!id) { setLoading(false); return; }
        api.get<ResumeResponse>(`/resume/${id}`)
            .then(r => {
                setResume(r.data);
                const level = (r.data.meta_data as any)?.experience_level || 'Mid';
                setScores(careerScores(r.data.parsed_content as any, level));
                const role = (r.data.meta_data as any)?.job_role || '';
                if (role) setTargetRole(role);
            })
            .catch(() => setError('Could not load resume.'))
            .finally(() => setLoading(false));
    }, [id]);

    const generate = async () => {
        if (!resume) return;
        setGenerating(true); setError(''); setIntel(null);
        try {
            const r = await api.post<CareerIntelligence>(
                `/career/intelligence/${resume.id}`,
                { target_role: targetRole, job_description: jd }
            );
            setIntel(r.data);
            setActiveTab('skills');
        } catch (e: any) {
            const s = e?.response?.status, d = e?.response?.data?.detail;
            setError(s === 429 ? (d || 'AI quota exceeded — wait and retry.') : (d || 'Generation failed.'));
        } finally { setGenerating(false); }
    };

    if (loading) return <Loader />;
    if (!resume || !scores) return (
        <div className="h-screen flex flex-col items-center justify-center gap-3" style={{ background: 'var(--bg)' }}>
            <p className="text-slate-500">{error || 'No resume selected.'}</p>
            <button onClick={() => router.push('/')} className="text-sm font-bold" style={{ color: 'var(--primary)' }}>← Back to dashboard</button>
        </div>
    );

    const jobRole = (resume.meta_data as any)?.job_role || 'Your Role';

    return (
        <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
            {/* Top bar */}
            <div className="h-14 flex items-center px-6 gap-3 sticky top-0 z-20"
                style={{ background: 'rgba(250,250,252,0.88)', backdropFilter: 'blur(14px)', borderBottom: '1px solid var(--border)' }}>
                <button onClick={() => router.push('/')} className="flex items-center gap-1.5 text-slate-400 hover:text-slate-700 transition-colors text-sm">
                    <ArrowLeft size={15} /> Back
                </button>
                <div className="flex-1 flex justify-center items-center gap-2">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'var(--primary)' }}>
                        <Rocket size={13} className="text-white" />
                    </div>
                    <span className="text-sm font-bold text-slate-800">Career Intelligence</span>
                </div>
                <button onClick={() => router.push(`/builder/scratch?id=${resume.id}`)} className="text-xs font-bold transition-colors" style={{ color: 'var(--primary)' }}>
                    Open Editor →
                </button>
            </div>

            <main className="max-w-4xl mx-auto px-6 py-10 space-y-8">

                {/* ── HERO: Career Score ──────────────────────────────────── */}
                <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                    className="relative overflow-hidden rounded-3xl p-8 text-white"
                    style={{ background: 'linear-gradient(135deg,#6D5DFC 0%,#8B7BFF 50%,#00D4FF 150%)' }}>
                    <div className="absolute -right-12 -top-12 w-56 h-56 rounded-full opacity-15 bg-white" />
                    <div className="absolute -left-8 -bottom-8 w-36 h-36 rounded-full opacity-10 bg-white" />
                    <div className="relative">
                        <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-1">Career Intelligence Platform</p>
                        <p className="text-xl font-black mb-1">{jobRole}</p>
                        <p className="text-sm opacity-70 mb-6">Here's where you stand — and exactly what to do next.</p>

                        <div className="flex flex-wrap items-start gap-6">
                            {/* Big score */}
                            <div className="flex items-center gap-4">
                                <CareerRing value={scores.overall} />
                                <div>
                                    <p className="text-[11px] uppercase tracking-widest opacity-70">Career Score</p>
                                    <p className="text-3xl font-black">{scores.overall}<span className="text-base opacity-60">/100</span></p>
                                </div>
                            </div>

                            {/* Sub-scores grid */}
                            <div className="grid grid-cols-3 sm:grid-cols-5 gap-x-5 gap-y-3 flex-1">
                                {[
                                    ['Market Readiness',    scores.marketReadiness],
                                    ['Promotion Ready',     scores.promotionReadiness],
                                    ['Leadership',          scores.leadershipReadiness],
                                    ['Interview Ready',     scores.interviewReadiness],
                                    ['Salary Potential',    scores.salaryPotential],
                                ].map(([label, val]) => (
                                    <div key={label as string}>
                                        <p className="text-2xl font-black">{val as number}<span className="text-xs opacity-60">%</span></p>
                                        <p className="text-[10px] uppercase tracking-wider opacity-65 leading-tight">{label as string}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Top opportunities */}
                        {scores.topOpportunities.length > 0 && (
                            <div className="mt-6 flex flex-wrap gap-2">
                                {scores.topOpportunities.map((opp, i) => (
                                    <span key={i} className="text-xs px-3 py-1.5 rounded-full font-medium flex items-center gap-1.5"
                                        style={{ background: 'rgba(255,255,255,0.18)' }}>
                                        <Zap size={10} /> {opp}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* ── GENERATE FORM ───────────────────────────────────────── */}
                <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}
                    className="surface p-6 space-y-4">
                    <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                            Target Role <span className="text-slate-300 font-normal normal-case">(what you're aiming for)</span>
                        </label>
                        <JobRoleAutocomplete value={targetRole} onChange={setTargetRole} placeholder="e.g. Senior DevOps Engineer, Staff Engineer, Director of Product" />
                    </div>

                    <button onClick={() => setShowJd(v => !v)} className="text-xs font-semibold flex items-center gap-1.5 transition-colors" style={{ color: 'var(--primary)' }}>
                        <ChevronRight size={13} className={`transition-transform ${showJd ? 'rotate-90' : ''}`} />
                        {showJd ? 'Hide' : 'Add'} target job description <span className="text-slate-400 font-normal">(improves interview questions)</span>
                    </button>

                    <AnimatePresence>
                        {showJd && (
                            <motion.textarea initial={{ height: 0, opacity: 0 }} animate={{ height: 120, opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                className="w-full bg-slate-50 rounded-2xl p-4 text-sm text-slate-700 placeholder-slate-300 outline-none resize-none"
                                placeholder="Paste a job description to get tailored interview questions and company-specific insights…"
                                value={jd} onChange={e => setJd(e.target.value)} style={{ minHeight: 0 }} />
                        )}
                    </AnimatePresence>

                    {error && <p className="text-sm text-red-500">{error}</p>}

                    <button onClick={generate} disabled={generating}
                        className="w-full py-4 rounded-2xl font-black text-sm text-white flex items-center justify-center gap-2.5 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60"
                        style={{ background: 'var(--primary)', boxShadow: '0 10px 28px rgba(109,93,252,0.35)' }}>
                        {generating
                            ? <><RefreshCw size={16} className="animate-spin" /> Generating your Career Intelligence Report…</>
                            : <><Sparkles size={16} /> Generate Full Intelligence Report</>}
                    </button>
                    {!intel && <p className="text-xs text-slate-400 text-center">AI analyses your resume across 6 career dimensions — takes ~15 seconds</p>}
                </motion.div>

                {/* ── INTELLIGENCE TABS ────────────────────────────────────── */}
                <AnimatePresence>
                    {intel && (
                        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
                            {/* Tab bar */}
                            <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1">
                                {TABS.map(t => {
                                    const Icon = t.icon;
                                    const active = activeTab === t.id;
                                    return (
                                        <button key={t.id} onClick={() => setActiveTab(t.id)}
                                            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0"
                                            style={active
                                                ? { background: 'var(--primary)', color: 'white' }
                                                : { background: 'white', color: '#94a3b8', border: '1px solid var(--border)' }}>
                                            <Icon size={13} /> {t.label}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Tab content */}
                            <AnimatePresence mode="wait">
                                <motion.div key={activeTab} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.18 }}>
                                    {activeTab === 'skills'    && <SkillGapPanel gaps={intel.skill_gaps} />}
                                    {activeTab === 'promotion' && <PromotionPanel promotion={intel.promotion} />}
                                    {activeTab === 'salary'    && <SalaryPanel salary={intel.salary} />}
                                    {activeTab === 'interview' && <InterviewPanel questions={intel.interview_questions} />}
                                    {activeTab === 'roadmap'   && <RoadmapPanel roadmap={intel.roadmap} currentRole={intel.promotion?.current_role || jobRole} />}
                                    {activeTab === 'actions'   && <ActionPlanPanel plan={intel.action_plan} />}
                                </motion.div>
                            </AnimatePresence>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── FUTURE MODULES ───────────────────────────────────────── */}
                <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Career Operating System — Coming Soon</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {COACH_MODULES.filter(m => m.status === 'coming_soon').map(m => (
                            <div key={m.id} className="surface p-4 flex items-start gap-3 opacity-60">
                                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--primary-light)' }}>
                                    <Lock size={14} style={{ color: 'var(--primary)' }} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-700">{m.name}</p>
                                    <p className="text-[11px] text-slate-400 mt-0.5">{m.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </main>
        </div>
    );
}

// ─── Section panels ───────────────────────────────────────────────────────────

function SkillGapPanel({ gaps }: { gaps: SkillGap[] }) {
    const priorityColor = { High: '#EF4444', Medium: '#F59E0B', Low: 'var(--success)' } as Record<string, string>;
    const difficultyColor = { Easy: 'var(--success)', Medium: '#F59E0B', Hard: '#EF4444' } as Record<string, string>;

    return (
        <div className="space-y-3">
            <SectionHeader icon={Brain} title="Skill Gap Intelligence" subtitle="Skills you need to close to get hired faster" />
            {(!gaps || gaps.length === 0) && <EmptyState text="No skill gaps identified — your resume looks well-rounded for this role." />}
            {gaps?.map((g, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    className="surface p-5 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0" style={{ background: `${priorityColor[g.priority]}18` }}>
                        <Brain size={16} style={{ color: priorityColor[g.priority] }} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="font-bold text-slate-800 text-sm">{g.skill}</span>
                            <Tag label={g.priority} color={priorityColor[g.priority]} />
                            <Tag label={g.category} color="var(--primary)" />
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                                <BarChart2 size={11} style={{ color: difficultyColor[g.difficulty] }} />
                                {g.difficulty} to learn
                            </span>
                            <span className="flex items-center gap-1">
                                <TrendingUp size={11} style={{ color: 'var(--success)' }} />
                                <span className="font-semibold" style={{ color: 'var(--success)' }}>{g.impact}</span>
                            </span>
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
    );
}

function PromotionPanel({ promotion }: { promotion: PromotionPath }) {
    if (!promotion) return <EmptyState text="Promotion data not available." />;
    const color = promotion.readiness_pct >= 70 ? 'var(--success)' : promotion.readiness_pct >= 40 ? '#F59E0B' : '#EF4444';
    return (
        <div className="space-y-4">
            <SectionHeader icon={TrendingUp} title="Promotion Readiness" subtitle="How ready you are to move to the next level" />

            {/* Readiness hero */}
            <div className="surface p-6 flex items-center gap-6">
                <div className="relative w-24 h-24 shrink-0">
                    <svg width="96" height="96" className="rotate-[-90deg]">
                        <circle cx="48" cy="48" r="38" fill="none" stroke="#E2E8F0" strokeWidth="8" />
                        <motion.circle cx="48" cy="48" r="38" fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
                            strokeDasharray={2 * Math.PI * 38}
                            initial={{ strokeDashoffset: 2 * Math.PI * 38 }}
                            animate={{ strokeDashoffset: 2 * Math.PI * 38 * (1 - promotion.readiness_pct / 100) }}
                            transition={{ duration: 1, ease: 'easeOut' }} />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-black" style={{ color }}>{promotion.readiness_pct}%</span>
                    </div>
                </div>
                <div className="flex-1">
                    <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
                        <span className="font-bold text-slate-800">{promotion.current_role || 'Current Role'}</span>
                        <ArrowRight size={14} />
                        <span className="font-bold" style={{ color: 'var(--primary)' }}>{promotion.target_role || 'Target Role'}</span>
                    </div>
                    <p className="text-xs text-slate-500">
                        {promotion.readiness_pct >= 70
                            ? 'You are promotion-ready. Focus on visibility and timing.'
                            : promotion.readiness_pct >= 40
                            ? 'Good foundation. Close the gaps below to accelerate.'
                            : 'Significant gaps remain. Use the action plan to close them.'}
                    </p>
                </div>
            </div>

            {/* Missing */}
            {promotion.missing?.length > 0 && (
                <div className="surface p-5">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5"><AlertTriangle size={13} style={{ color: '#F59E0B' }} /> What's holding you back</p>
                    <ul className="space-y-2">
                        {promotion.missing.map((m, i) => (
                            <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700">
                                <span className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: '#FEF3C7', color: '#B45309', fontSize: 9, fontWeight: 700 }}>{i + 1}</span>
                                {m}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Action plan */}
            {promotion.action_plan?.length > 0 && (
                <div className="surface p-5">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5"><Rocket size={13} style={{ color: 'var(--primary)' }} /> Recommended actions</p>
                    <ul className="space-y-2">
                        {promotion.action_plan.map((a, i) => (
                            <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700">
                                <CheckCircle2 size={15} className="shrink-0 mt-0.5" style={{ color: 'var(--primary)' }} />
                                {a}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

function SalaryPanel({ salary }: { salary: SalaryIntelligence }) {
    if (!salary) return <EmptyState text="Salary data not available." />;
    return (
        <div className="space-y-4">
            <SectionHeader icon={DollarSign} title="Salary Intelligence" subtitle="Market data and the levers that move your comp" />

            {/* Three ranges */}
            <div className="grid grid-cols-3 gap-3">
                {[
                    { label: 'Current Market Range', value: salary.current_range, color: '#64748B', bg: '#F1F5F9' },
                    { label: 'Your Likely Range', value: salary.likely_range, color: '#F59E0B', bg: '#FFFBEB' },
                    { label: 'Target Range', value: salary.target_range, color: 'var(--success)', bg: 'rgba(0,194,122,0.08)' },
                ].map(r => (
                    <div key={r.label} className="rounded-2xl p-4 text-center" style={{ background: r.bg }}>
                        <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: r.color }}>{r.label}</p>
                        <p className="text-base font-black leading-tight" style={{ color: r.color }}>{r.value}</p>
                    </div>
                ))}
            </div>

            {/* Boosters */}
            <div className="grid sm:grid-cols-3 gap-4">
                <BoosterCard icon={Brain} title="Skills that raise comp" items={salary.skill_boosters} color="var(--primary)" />
                <BoosterCard icon={Award} title="Certifications that pay" items={salary.cert_boosters} color="#F59E0B" />
                <BoosterCard icon={Briefcase} title="Career moves that pay" items={salary.career_moves} color="var(--success)" />
            </div>
        </div>
    );
}

function InterviewPanel({ questions }: { questions: InterviewQuestions }) {
    if (!questions) return <EmptyState text="Interview questions not available." />;
    const sections = [
        { key: 'behavioral',      label: 'Behavioral',        icon: Users,        color: 'var(--primary)', items: questions.behavioral },
        { key: 'technical',       label: 'Technical',          icon: Brain,        color: '#00D4FF',         items: questions.technical },
        { key: 'leadership',      label: 'Leadership',         icon: Star,         color: '#F59E0B',         items: questions.leadership },
        { key: 'company_specific',label: 'Company-Specific',   icon: Target,       color: 'var(--success)',  items: questions.company_specific },
    ] as const;

    return (
        <div className="space-y-4">
            <SectionHeader icon={MessageSquare} title="Interview Readiness" subtitle="Likely questions based on your resume and target role" />
            {sections.map(s => (
                s.items?.length > 0 && (
                    <div key={s.key} className="surface p-5">
                        <p className="text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5" style={{ color: s.color }}>
                            <s.icon size={13} /> {s.label}
                        </p>
                        <ol className="space-y-3">
                            {s.items.map((q, i) => (
                                <li key={i} className="flex items-start gap-3 text-sm text-slate-700">
                                    <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold text-white" style={{ background: s.color, minWidth: 20 }}>{i + 1}</span>
                                    {q}
                                </li>
                            ))}
                        </ol>
                    </div>
                )
            ))}
        </div>
    );
}

function RoadmapPanel({ roadmap, currentRole }: { roadmap: RoadmapStep[]; currentRole: string }) {
    if (!roadmap?.length) return <EmptyState text="Roadmap not available." />;
    return (
        <div className="space-y-4">
            <SectionHeader icon={Map} title="Career Roadmap" subtitle="Your step-by-step path from here to your target role" />
            <div className="relative pl-8">
                {/* Vertical line */}
                <div className="absolute left-3.5 top-5 bottom-5 w-0.5 bg-slate-100" />

                {/* Current role node */}
                <div className="relative mb-6 flex items-center gap-3">
                    <div className="absolute -left-8 w-7 h-7 rounded-full border-2 flex items-center justify-center bg-white" style={{ borderColor: 'var(--primary)' }}>
                        <div className="w-3 h-3 rounded-full" style={{ background: 'var(--primary)' }} />
                    </div>
                    <span className="text-sm font-bold text-slate-500 italic">NOW — {currentRole}</span>
                </div>

                {roadmap.map((step, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                        className="relative mb-6">
                        <div className="absolute -left-8 w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-black" style={{ background: 'var(--primary)' }}>
                            {i + 1}
                        </div>
                        <div className="surface p-5 ml-1">
                            <div className="flex items-start justify-between gap-3 mb-3">
                                <div>
                                    <p className="font-black text-slate-800">{step.role}</p>
                                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5"><Clock size={11} /> {step.timeline}</p>
                                </div>
                            </div>
                            <div className="grid sm:grid-cols-3 gap-3">
                                {step.required_skills.length > 0 && (
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Required Skills</p>
                                        <div className="flex flex-wrap gap-1">
                                            {step.required_skills.map((s, j) => <Chip key={j} label={s} color="var(--primary)" />)}
                                        </div>
                                    </div>
                                )}
                                {step.certifications.length > 0 && (
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Certifications</p>
                                        <div className="flex flex-wrap gap-1">
                                            {step.certifications.map((c, j) => <Chip key={j} label={c} color="#F59E0B" />)}
                                        </div>
                                    </div>
                                )}
                                {step.recommended_projects.length > 0 && (
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Projects</p>
                                        <div className="flex flex-wrap gap-1">
                                            {step.recommended_projects.map((p, j) => <Chip key={j} label={p} color="var(--success)" />)}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

function ActionPlanPanel({ plan }: { plan: ActionPlan }) {
    if (!plan) return <EmptyState text="Action plan not available." />;
    const columns = [
        { label: 'This Week',    icon: Zap,      color: '#EF4444', items: plan.this_week,    bg: 'rgba(239,68,68,0.06)' },
        { label: 'This Month',   icon: Calendar, color: '#F59E0B', items: plan.this_month,   bg: 'rgba(245,158,11,0.06)' },
        { label: 'This Quarter', icon: BookOpen, color: 'var(--primary)', items: plan.this_quarter, bg: 'rgba(109,93,252,0.06)' },
    ];
    return (
        <div className="space-y-4">
            <SectionHeader icon={Zap} title="AI Action Plan" subtitle="The most important things to do — now, soon, and next" />
            <div className="grid sm:grid-cols-3 gap-4">
                {columns.map(col => (
                    <div key={col.label} className="rounded-2xl p-5" style={{ background: col.bg }}>
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: `${col.color}22` }}>
                                <col.icon size={14} style={{ color: col.color }} />
                            </div>
                            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: col.color }}>{col.label}</span>
                        </div>
                        <ul className="space-y-3">
                            {col.items?.map((item, i) => (
                                <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700">
                                    <div className="w-4 h-4 rounded-full border-2 shrink-0 mt-0.5" style={{ borderColor: col.color }} />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Shared primitives ────────────────────────────────────────────────────────

function SectionHeader({ icon: Icon, title, subtitle }: { icon: any; title: string; subtitle: string }) {
    return (
        <div className="flex items-start gap-3 pb-1">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--primary-light)' }}>
                <Icon size={17} style={{ color: 'var(--primary)' }} />
            </div>
            <div>
                <p className="font-black text-slate-800">{title}</p>
                <p className="text-xs text-slate-500">{subtitle}</p>
            </div>
        </div>
    );
}

function Tag({ label, color }: { label: string; color: string }) {
    return (
        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: `${color}18`, color }}>
            {label}
        </span>
    );
}

function Chip({ label, color }: { label: string; color: string }) {
    return (
        <span className="text-[10px] px-2 py-0.5 rounded-lg font-medium" style={{ background: `${color}14`, color }}>
            {label}
        </span>
    );
}

function BoosterCard({ icon: Icon, title, items, color }: { icon: any; title: string; items: string[]; color: string }) {
    if (!items?.length) return null;
    return (
        <div className="surface p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5" style={{ color }}>
                <Icon size={12} /> {title}
            </p>
            <ul className="space-y-1.5">
                {items.map((it, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs text-slate-600">
                        <span className="w-1 h-1 rounded-full shrink-0" style={{ background: color }} />
                        {it}
                    </li>
                ))}
            </ul>
        </div>
    );
}

function EmptyState({ text }: { text: string }) {
    return <div className="surface p-8 text-center text-sm text-slate-400">{text}</div>;
}

function CareerRing({ value }: { value: number }) {
    const R = 34, C = 2 * Math.PI * R;
    return (
        <div className="relative w-20 h-20 shrink-0">
            <svg width="80" height="80" className="rotate-[-90deg]">
                <circle cx="40" cy="40" r={R} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="7" />
                <motion.circle cx="40" cy="40" r={R} fill="none" stroke="white" strokeWidth="7" strokeLinecap="round"
                    strokeDasharray={C} initial={{ strokeDashoffset: C }}
                    animate={{ strokeDashoffset: C * (1 - value / 100) }}
                    transition={{ duration: 1.1, ease: 'easeOut' }} />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-black">{value}</span>
            </div>
        </div>
    );
}

function Loader() {
    return (
        <div className="h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
            <Sparkles className="animate-pulse text-slate-300" size={24} />
        </div>
    );
}

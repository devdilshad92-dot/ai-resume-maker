'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Sparkles, ArrowLeft, CornerDownLeft, Check, Wand2, RefreshCw,
} from 'lucide-react';
import api from '@/api/client';
import { ResumeResponse } from '@/types';
import { JobRoleAutocomplete } from '@/components/ui/JobRoleAutocomplete';
import AuthGuard from '@/components/AuthGuard';

export default function InterviewPage() {
    return <AuthGuard><Interview /></AuthGuard>;
}

interface Msg { role: 'ai' | 'user'; text: string }

// ─── Interview script ─────────────────────────────────────────────────────────
const QUESTIONS = [
    { key: 'current_role', q: "Let's build your resume together. First — what's your current (or most recent) job title?", placeholder: 'e.g. Senior Software Engineer at Stripe' },
    { key: 'years', q: 'How many years of professional experience do you have?', placeholder: 'e.g. 6 years' },
    { key: 'biggest_achievement', q: "What's the achievement you're most proud of? Don't worry about wording — I'll polish it.", placeholder: 'e.g. Rebuilt our payments pipeline, cut latency in half' },
    { key: 'technologies', q: 'Which tools, technologies, or skills do you use most?', placeholder: 'e.g. Python, AWS, Kubernetes, React, SQL' },
    { key: 'team_size', q: 'Have you led or mentored anyone? If so, how many people?', placeholder: 'e.g. Led a team of 5 engineers (or "not yet")' },
    { key: 'certifications', q: 'Any certifications, degrees, or notable training?', placeholder: 'e.g. AWS Solutions Architect, B.Sc. Computer Science' },
    { key: 'target_companies', q: 'Finally — which companies or roles are you targeting? This helps me tune keywords.', placeholder: 'e.g. Amazon, Google, senior backend roles' },
];

function Interview() {
    const router = useRouter();
    const [phase, setPhase] = useState<'intro' | 'chat' | 'generating'>('intro');
    const [jobRole, setJobRole] = useState('');
    const [experience, setExperience] = useState('Mid');
    const [messages, setMessages] = useState<Msg[]>([]);
    const [step, setStep] = useState(0);
    const [input, setInput] = useState('');
    const [aiTyping, setAiTyping] = useState(false);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [error, setError] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Pick up intent stashed by the dashboard
    useEffect(() => {
        try {
            const intent = sessionStorage.getItem('ai_intent');
            if (intent) {
                sessionStorage.removeItem('ai_intent');
                const role = intent.replace(/^(create|build|make|generate|tailor|write)\s+(a|an|my)?\s*/i, '').replace(/\s*(resume|cv).*$/i, '').replace(/\s+for\s+.*$/i, '').trim();
                if (role && role.length < 60) setJobRole(role.replace(/^./, c => c.toUpperCase()));
                if (/senior|lead|principal|head|director/i.test(intent)) setExperience('Senior');
            }
        } catch {}
    }, []);

    useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }); }, [messages, aiTyping]);
    useEffect(() => { if (phase === 'chat') setTimeout(() => inputRef.current?.focus(), 300); }, [phase, step]);

    const askQuestion = (idx: number) => {
        setAiTyping(true);
        setTimeout(() => {
            setAiTyping(false);
            setMessages(m => [...m, { role: 'ai', text: QUESTIONS[idx].q }]);
        }, 700);
    };

    const startChat = () => {
        if (!jobRole.trim()) return;
        setPhase('chat');
        setTimeout(() => askQuestion(0), 400);
    };

    const submitAnswer = () => {
        if (!input.trim()) return;
        const q = QUESTIONS[step];
        const val = input.trim();
        setMessages(m => [...m, { role: 'user', text: val }]);
        setAnswers(a => ({ ...a, [q.key]: val }));
        setInput('');
        const next = step + 1;
        if (next < QUESTIONS.length) {
            setStep(next);
            askQuestion(next);
        } else {
            generate({ ...answers, [q.key]: val });
        }
    };

    const generate = async (finalAnswers: Record<string, string>) => {
        setPhase('generating');
        setError('');
        try {
            const res = await api.post<ResumeResponse>('/resume/ai-interview', {
                job_role: jobRole,
                experience_level: experience,
                industry: '',
                answers: finalAnswers,
            });
            router.push(`/builder/scratch?id=${res.data.id}`);
        } catch (e: any) {
            const s = e?.response?.status, d = e?.response?.data?.detail;
            setError(s === 429 ? (d || 'AI quota exceeded — wait a moment and retry.') : (d || 'Generation failed. Please try again.'));
            setPhase('chat');
        }
    };

    const progress = phase === 'chat' ? Math.round((step / QUESTIONS.length) * 100) : phase === 'generating' ? 100 : 0;

    return (
        <div className="h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
            {/* Top bar */}
            <div className="h-14 flex items-center px-6 gap-3 shrink-0" style={{ background: 'rgba(250,250,252,0.8)', backdropFilter: 'blur(12px)' }}>
                <button onClick={() => router.push('/')} className="flex items-center gap-1.5 text-slate-400 hover:text-slate-700 transition-colors text-sm">
                    <ArrowLeft size={15} /> Back
                </button>
                <div className="flex-1 flex justify-center">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'var(--primary)' }}><Sparkles size={13} className="text-white" /></div>
                        <span className="text-sm font-bold text-slate-800">AI Interview</span>
                    </div>
                </div>
                <div className="w-16 text-right">
                    {phase === 'chat' && <span className="text-xs font-bold text-slate-400">{step}/{QUESTIONS.length}</span>}
                </div>
            </div>
            {/* Progress bar */}
            <div className="h-0.5 shrink-0 bg-slate-100">
                <motion.div className="h-full" style={{ background: 'var(--primary)' }} initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.4 }} />
            </div>

            {/* ─── INTRO ─────────────────────────────────────────────────── */}
            {phase === 'intro' && (
                <div className="flex-1 flex items-center justify-center px-6">
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md text-center">
                        <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.1 }} className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-6" style={{ background: 'var(--primary-light)' }}>
                            <Wand2 size={28} style={{ color: 'var(--primary)' }} />
                        </motion.div>
                        <h1 className="text-3xl font-black text-slate-900 mb-2">Let AI interview you</h1>
                        <p className="text-slate-500 mb-8">Answer a few quick questions in plain language. AI turns them into a polished, ATS-optimized resume — no forms.</p>

                        <div className="surface-elevated p-5 text-left space-y-4" style={{ borderRadius: 'var(--radius-xl)' }}>
                            <div>
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">Target Role</label>
                                <JobRoleAutocomplete value={jobRole} onChange={setJobRole} placeholder="e.g. Senior Product Manager" />
                            </div>
                            <div>
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">Experience Level</label>
                                <div className="grid grid-cols-5 gap-1.5">
                                    {['Fresher', 'Junior', 'Mid', 'Senior', 'Lead'].map(l => (
                                        <button key={l} onClick={() => setExperience(l)} className="py-2 rounded-xl text-xs font-bold transition-all" style={experience === l ? { background: 'var(--primary)', color: 'white' } : { background: 'var(--bg)', color: '#94a3b8', border: '1px solid var(--border)' }}>{l}</button>
                                    ))}
                                </div>
                            </div>
                            <button onClick={startChat} disabled={!jobRole.trim()} className="w-full py-3.5 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40" style={{ background: 'var(--primary)' }}>
                                <Sparkles size={15} /> Start Interview
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* ─── CHAT ──────────────────────────────────────────────────── */}
            {phase === 'chat' && (
                <>
                    <div ref={scrollRef} className="flex-1 overflow-y-auto">
                        <div className="max-w-2xl mx-auto px-6 py-8 space-y-4">
                            <AnimatePresence>
                                {messages.map((m, i) => (
                                    <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        {m.role === 'ai' && (
                                            <div className="w-7 h-7 rounded-xl flex items-center justify-center mr-2 shrink-0 mt-0.5" style={{ background: 'var(--primary)' }}>
                                                <Sparkles size={13} className="text-white" />
                                            </div>
                                        )}
                                        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed max-w-[80%] ${m.role === 'user' ? 'text-white' : 'bg-white text-slate-700'}`} style={m.role === 'user' ? { background: 'var(--primary)' } : { boxShadow: 'var(--shadow-sm)' }}>
                                            {m.text}
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                            {aiTyping && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                                    <div className="w-7 h-7 rounded-xl flex items-center justify-center mr-2 shrink-0" style={{ background: 'var(--primary)' }}><Sparkles size={13} className="text-white" /></div>
                                    <div className="px-4 py-3 rounded-2xl bg-white flex gap-1" style={{ boxShadow: 'var(--shadow-sm)' }}>
                                        {[0, 150, 300].map(d => <span key={d} className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: `${d}ms` }} />)}
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    </div>

                    {/* Input */}
                    <div className="shrink-0 px-6 pb-6 pt-2">
                        <div className="max-w-2xl mx-auto">
                            {error && <p className="text-xs text-red-500 mb-2 text-center">{error}</p>}
                            <div className="surface-elevated p-2 flex items-center gap-2" style={{ borderRadius: 'var(--radius-xl)' }}>
                                <input
                                    ref={inputRef}
                                    className="flex-1 bg-transparent outline-none text-base text-slate-800 placeholder-slate-300 px-3 py-2"
                                    placeholder={aiTyping ? 'AI is typing…' : QUESTIONS[step]?.placeholder}
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && !aiTyping && submitAnswer()}
                                    disabled={aiTyping}
                                />
                                <button onClick={submitAnswer} disabled={!input.trim() || aiTyping} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-40" style={{ background: 'var(--primary)' }}>
                                    {step === QUESTIONS.length - 1 ? <>Finish <Check size={14} /></> : <>Next <CornerDownLeft size={14} /></>}
                                </button>
                            </div>
                            <p className="text-center text-[11px] text-slate-300 mt-2">Press Enter to continue · Be as brief as you like, AI fills the gaps</p>
                        </div>
                    </div>
                </>
            )}

            {/* ─── GENERATING ────────────────────────────────────────────── */}
            {phase === 'generating' && (
                <div className="flex-1 flex items-center justify-center px-6">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }} className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-6" style={{ background: 'var(--primary-light)' }}>
                            <Wand2 size={28} style={{ color: 'var(--primary)' }} />
                        </motion.div>
                        <h2 className="text-2xl font-black text-slate-900 mb-2">Writing your resume…</h2>
                        <div className="space-y-2 mt-6 text-left max-w-xs mx-auto">
                            {['Crafting your professional summary', 'Generating quantified achievements', 'Optimizing ATS keywords', 'Structuring your experience'].map((t, i) => (
                                <motion.div key={t} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.6 }} className="flex items-center gap-2 text-sm text-slate-500">
                                    <RefreshCw size={12} className="animate-spin" style={{ color: 'var(--primary)' }} /> {t}
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}

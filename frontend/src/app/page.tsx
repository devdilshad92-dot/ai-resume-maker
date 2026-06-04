'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Sparkles, ArrowRight, Check, ChevronDown, Star,
    Zap, Target, Brain, Map, FileText, TrendingUp,
    BarChart2, Rocket, Bot, DollarSign, Users,
    Shield, Menu, X as XIcon, MessageSquare,
} from 'lucide-react';

// ─── Design tokens ─────────────────────────────────────────────────────────────
const P = '#6D5DFC';    // primary
const PD = '#5646E0';   // primary dark
const G = '#00C27A';    // green / success
const C = '#00D4FF';    // cyan accent
const A = '#F59E0B';    // amber

const HERO_BG = [
    'radial-gradient(ellipse at 50% -5%, rgba(109,93,252,0.55) 0%, transparent 65%)',
    'radial-gradient(ellipse at 90% 40%, rgba(0,212,255,0.18) 0%, transparent 45%)',
    'radial-gradient(ellipse at 8% 75%, rgba(109,93,252,0.12) 0%, transparent 40%)',
    '#07061A',
].join(', ');

// ─── Feature definitions ────────────────────────────────────────────────────────
const FEATURES = [
    { icon: Bot,         label: 'AI Interview Builder',   desc: 'Answer 7 questions in plain language. AI writes a polished, ATS-ready resume in under 60 seconds.', color: P, accent: '#EEF0FF' },
    { icon: Zap,         label: 'Resume Health Center',   desc: 'Instant 6-dimension health score. One click rewrites every section with stronger language and metrics.', color: G, accent: '#ECFDF5' },
    { icon: Target,      label: 'Job Match Studio',       desc: 'Paste any job description. See your match %, skill gaps, recruiter perspective, and get a tailored resume.', color: C, accent: '#ECFEFF' },
    { icon: Rocket,      label: 'Career Intelligence',    desc: 'Skill gaps, promotion readiness, salary intel, interview prep, and a step-by-step career roadmap.', color: A, accent: '#FFFBEB' },
    { icon: FileText,    label: 'Template Intelligence',  desc: '5 ATS-optimized templates. AI rewrites your resume in the right tone for each layout style.', color: '#EC4899', accent: '#FDF2F8' },
    { icon: Brain,       label: 'AI Copilot',             desc: 'Live suggestions as you write. Smart rewrites, tone selector, and instant bullet improvements.', color: '#8B5CF6', accent: '#F5F3FF' },
];

const STEPS = [
    { n: '1', title: 'Upload or Answer 7 Questions', desc: 'Upload your existing resume or let AI interview you. Both paths take under 5 minutes.' },
    { n: '2', title: 'AI Optimizes Everything',      desc: 'AI scores your resume, fills gaps, rewrites weak bullets, and tailors it for your target role.' },
    { n: '3', title: 'Apply. Interview. Get Hired.',  desc: 'A stronger resume means more callbacks. Use Job Match Studio to tailor for every single application.' },
];

const STATS = [
    { value: '10K+',   label: 'Resumes Built' },
    { value: '47%',    label: 'More Callbacks' },
    { value: '+40 pts', label: 'Avg ATS Gain' },
    { value: '5 min',  label: 'To First Draft' },
];

const TESTIMONIALS = [
    { quote: "Finally an AI tool that actually understands what recruiters look for. My ATS score went from 31 to 84 in one click. Got an interview at Google the same week.", name: 'Priya Sharma', role: 'Software Engineer', tag: 'Now at Google' },
    { quote: "I was stuck at the same level for 3 years. The Career Intelligence feature showed me exactly what skills I was missing. Got promoted 4 months later.", name: 'Rahul Mehta', role: 'DevOps Engineer', tag: 'Promoted at Microsoft' },
    { quote: "The Job Match Studio is insane. I can tailor my resume to any job description in 30 seconds. Landed 4 interviews in one week.", name: 'Aisha Khan', role: 'Product Manager', tag: 'Now at Flipkart' },
];

const FAQS = [
    { q: 'Is there a free version?', a: 'Yes. The free plan includes 1 resume, the AI Interview Builder, and basic ATS scoring. No credit card required — ever.' },
    { q: 'How is this different from ChatGPT?', a: 'ChatGPT is a general AI. ResumeAI is purpose-built for job seekers — with deterministic ATS scoring, real-time job match analysis, career intelligence, and 5 templates optimized for real ATS systems.' },
    { q: 'Which ATS systems does this optimize for?', a: 'We optimize for all major ATS platforms: Workday, Greenhouse, Lever, iCIMS, Taleo, BambooHR, and SmartRecruiters. Our scoring is built on real parsing rules, not guesses.' },
    { q: 'Can I cancel my Pro subscription anytime?', a: 'Yes, cancel anytime — no questions asked. Your resumes remain accessible on the free plan.' },
    { q: 'Is my resume data secure?', a: 'All data is encrypted at rest and in transit. We never share your data with third parties or use it to train AI models.' },
];

type DemoTab = 'interview' | 'health' | 'match' | 'career';
const DEMO_TABS: { id: DemoTab; label: string }[] = [
    { id: 'interview', label: 'AI Interview' },
    { id: 'health',    label: 'Health Center' },
    { id: 'match',     label: 'Job Match' },
    { id: 'career',    label: 'Career Intel' },
];

// ─── Root component ─────────────────────────────────────────────────────────────
export default function LandingPage() {
    const router = useRouter();
    const [menuOpen, setMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        try { if (localStorage.getItem('token')) { router.replace('/dashboard'); return; } } catch {}
        const fn = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', fn, { passive: true });
        return () => window.removeEventListener('scroll', fn);
    }, [router]);

    // Value-first: send users directly to the AI Interview Builder.
    // No login required — they get a guest session automatically.
    const goStart = () => router.push('/builder/interview');

    return (
        <div style={{ fontFamily: "'Inter', sans-serif", background: '#fff', color: '#1E293B' }}>
            {/* NAV */}
            <nav className="fixed top-0 inset-x-0 z-50 transition-all duration-300"
                style={{ background: scrolled ? 'rgba(7,6,26,0.88)' : 'transparent', backdropFilter: scrolled ? 'blur(16px)' : 'none', borderBottom: scrolled ? '1px solid rgba(255,255,255,0.07)' : 'none' }}>
                <div className="max-w-6xl mx-auto px-6 h-16 flex items-center gap-6">
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/')}>
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: P }}>
                            <Sparkles size={16} className="text-white" />
                        </div>
                        <span className="font-black text-white text-lg tracking-tight">ResumeAI</span>
                    </div>
                    <div className="hidden md:flex items-center gap-1 ml-4">
                        {['Features', 'Pricing', 'Blog'].map(l => (
                            <a key={l} href={`#${l.toLowerCase()}`} className="px-3 py-1.5 rounded-lg text-sm font-medium text-white/60 hover:text-white transition-colors hover:bg-white/8">{l}</a>
                        ))}
                    </div>
                    <div className="flex-1" />
                    <div className="hidden md:flex items-center gap-3">
                        <button onClick={() => router.push('/login')} className="text-sm font-semibold text-white/70 hover:text-white transition-colors">Sign In</button>
                        <button onClick={goStart} className="px-4 py-2 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95"
                            style={{ background: P, boxShadow: `0 4px 14px rgba(109,93,252,0.45)` }}>
                            Try Free — No Sign-In
                        </button>
                    </div>
                    <button className="md:hidden text-white/70 hover:text-white" onClick={() => setMenuOpen(v => !v)}>
                        {menuOpen ? <XIcon size={22} /> : <Menu size={22} />}
                    </button>
                </div>
                <AnimatePresence>
                    {menuOpen && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                            className="md:hidden px-6 pb-5 pt-2 flex flex-col gap-3"
                            style={{ background: 'rgba(7,6,26,0.96)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                            {['Features', 'Pricing', 'Blog'].map(l => (
                                <a key={l} href={`#${l.toLowerCase()}`} onClick={() => setMenuOpen(false)} className="text-sm font-medium text-white/70 hover:text-white transition-colors py-1">{l}</a>
                            ))}
                            <div className="flex gap-3 pt-2">
                                <button onClick={() => router.push('/login')} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white/80 border border-white/10 hover:bg-white/5">Log In</button>
                                <button onClick={goStart} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white" style={{ background: P }}>Start Free</button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </nav>

            {/* HERO */}
            <section style={{ background: HERO_BG }}>
                <div className="max-w-5xl mx-auto px-6 pt-40 pb-32 text-center">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-8"
                            style={{ background: 'rgba(109,93,252,0.2)', color: '#A89BFF', border: '1px solid rgba(109,93,252,0.3)' }}>
                            <Sparkles size={11} /> Powered by Gemini 2.5 Flash &amp; Multi-Provider AI
                        </span>
                        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white leading-[1.05] mb-7">
                            Your Resume,<br />
                            <span style={{ background: 'linear-gradient(135deg, #A89BFF 0%, #00D4FF 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                                Reimagined by AI
                            </span>
                        </h1>
                        <p className="text-lg sm:text-xl text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed">
                            Build resumes, optimize for ATS, tailor for jobs, prepare for interviews,<br className="hidden sm:block" /> and grow your career — all in one AI-powered platform.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <button onClick={goStart}
                                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-black text-base text-white transition-all hover:scale-[1.03] active:scale-[0.98]"
                                style={{ background: P, boxShadow: '0 12px 32px rgba(109,93,252,0.5)' }}>
                                Build My Resume — Free <ArrowRight size={17} />
                            </button>
                            <a href="#demo" className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-bold text-sm text-white/80 transition-all hover:text-white hover:bg-white/8"
                                style={{ border: '1px solid rgba(255,255,255,0.15)' }}>
                                See How It Works
                            </a>
                        </div>
                        <p className="mt-5 text-sm text-white/35">No account required to start · Sign in only to save &amp; export</p>
                    </motion.div>

                    {/* Browser mockup */}
                    <motion.div initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.7 }}
                        className="relative mt-20 mx-auto max-w-3xl">
                        <div className="absolute inset-x-0 -bottom-20 h-40" style={{ background: 'linear-gradient(to top, #07061A, transparent)' }} />
                        <div className="rounded-2xl overflow-hidden" style={{ background: '#12102A', boxShadow: '0 40px 100px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.08)' }}>
                            {/* Browser chrome */}
                            <div className="h-10 flex items-center gap-2 px-4" style={{ background: '#0D0B21', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                <div className="flex gap-1.5">
                                    <div className="w-3 h-3 rounded-full" style={{ background: '#FF5F57' }} />
                                    <div className="w-3 h-3 rounded-full" style={{ background: '#FFBD2E' }} />
                                    <div className="w-3 h-3 rounded-full" style={{ background: '#28C840' }} />
                                </div>
                                <div className="flex-1 mx-3 h-6 rounded-md flex items-center px-3 text-xs" style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.35)' }}>
                                    app.resumeai.co/builder/interview
                                </div>
                            </div>
                            {/* Chat UI mockup */}
                            <div className="p-6" style={{ background: '#FAFAFC' }}>
                                <div className="flex items-center gap-2 mb-5">
                                    <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: P }}><Sparkles size={13} className="text-white" /></div>
                                    <span className="text-sm font-bold text-slate-800">AI Interview</span>
                                    <span className="ml-auto text-xs text-slate-400">3 / 7</span>
                                </div>
                                <div className="space-y-3 mb-4">
                                    {[
                                        { ai: true,  text: "What's your biggest achievement? Don't worry about wording — I'll polish it." },
                                        { ai: false, text: "Rebuilt our payments pipeline and cut transaction latency by 60%" },
                                        { ai: true,  text: "Excellent! That's a powerful, quantified achievement. Which tools and technologies do you use most?" },
                                    ].map((m, i) => (
                                        <div key={i} className={`flex ${m.ai ? 'justify-start' : 'justify-end'}`}>
                                            <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed max-w-sm`}
                                                style={m.ai ? { background: 'white', color: '#334155', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' } : { background: P, color: 'white' }}>
                                                {m.text}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex items-center gap-2 p-2 rounded-xl bg-white" style={{ border: '1px solid #E2E8F0' }}>
                                    <input readOnly className="flex-1 bg-transparent outline-none text-sm text-slate-800 px-2 placeholder-slate-300" placeholder="Python, AWS, Kubernetes, React…" />
                                    <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white" style={{ background: P }}>
                                        Next <ArrowRight size={12} />
                                    </button>
                                </div>
                                <div className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full rounded-full" style={{ width: '43%', background: `linear-gradient(90deg, ${P}, ${C})` }} />
                                </div>
                                <p className="text-center text-[11px] text-slate-400 mt-2">✨ AI is building your ATS-optimized resume in the background</p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* STATS BAR */}
            <section className="border-y" style={{ background: '#FAFAFC', borderColor: '#E8ECF0' }}>
                <div className="max-w-4xl mx-auto px-6 py-10 grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
                    {STATS.map(s => (
                        <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                            <p className="text-3xl sm:text-4xl font-black mb-1" style={{ color: P }}>{s.value}</p>
                            <p className="text-sm text-slate-500 font-medium">{s.label}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* PRODUCT DEMO */}
            <section id="demo" className="py-24" style={{ background: '#fff' }}>
                <div className="max-w-5xl mx-auto px-6">
                    <SectionBadge color={P}>Interactive Demo</SectionBadge>
                    <h2 className="text-4xl sm:text-5xl font-black text-slate-900 mt-3 mb-4 leading-tight">
                        See the product<br />in action
                    </h2>
                    <p className="text-slate-500 text-lg mb-10 max-w-xl">Every feature is purpose-built for one goal: help you land the job faster.</p>
                    <DemoSection />
                </div>
            </section>

            {/* FEATURES */}
            <section id="features" className="py-24" style={{ background: '#FAFAFC' }}>
                <div className="max-w-5xl mx-auto px-6">
                    <SectionBadge color={G}>Feature Suite</SectionBadge>
                    <h2 className="text-4xl sm:text-5xl font-black text-slate-900 mt-3 mb-4 leading-tight">
                        Everything you need<br />to get hired
                    </h2>
                    <p className="text-slate-500 text-lg mb-12 max-w-xl">Six AI-powered tools that cover the entire job search journey.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {FEATURES.map((f, i) => (
                            <motion.div key={f.label} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}
                                className="p-6 rounded-2xl transition-all hover:-translate-y-1 cursor-default"
                                style={{ background: 'white', border: '1px solid #E8ECF0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: f.accent }}>
                                    <f.icon size={19} style={{ color: f.color }} />
                                </div>
                                <h3 className="font-bold text-slate-900 mb-2">{f.label}</h3>
                                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* HOW IT WORKS */}
            <section className="py-24" style={{ background: '#fff' }}>
                <div className="max-w-4xl mx-auto px-6">
                    <SectionBadge color={C}>Simple Process</SectionBadge>
                    <h2 className="text-4xl sm:text-5xl font-black text-slate-900 mt-3 mb-16 leading-tight">
                        Resume built in<br />under 5 minutes
                    </h2>
                    <div className="grid sm:grid-cols-3 gap-10">
                        {STEPS.map((s, i) => (
                            <motion.div key={s.n} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                                <div className="text-6xl font-black mb-4" style={{ color: '#E8ECF0', letterSpacing: '-2px' }}>{s.n}</div>
                                <h3 className="font-bold text-slate-900 text-lg mb-2">{s.title}</h3>
                                <p className="text-slate-500 text-sm leading-relaxed">{s.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* TESTIMONIALS */}
            <section className="py-24" style={{ background: 'linear-gradient(135deg, #07061A 0%, #1A0F3C 100%)' }}>
                <div className="max-w-5xl mx-auto px-6">
                    <div className="text-center mb-14">
                        <SectionBadge color="#A89BFF">Success Stories</SectionBadge>
                        <h2 className="text-4xl sm:text-5xl font-black text-white mt-3 leading-tight">Candidates who got hired</h2>
                    </div>
                    <div className="grid sm:grid-cols-3 gap-5">
                        {TESTIMONIALS.map((t, i) => (
                            <motion.div key={i} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                                className="p-6 rounded-2xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                <div className="flex gap-0.5 mb-4">
                                    {[...Array(5)].map((_, j) => <Star key={j} size={14} fill="#F59E0B" style={{ color: '#F59E0B' }} />)}
                                </div>
                                <p className="text-white/80 text-sm leading-relaxed mb-5">"{t.quote}"</p>
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                                        style={{ background: `linear-gradient(135deg, ${P}, ${C})` }}>
                                        {t.name[0]}
                                    </div>
                                    <div>
                                        <p className="text-white font-semibold text-sm">{t.name}</p>
                                        <p className="text-white/50 text-xs">{t.role}</p>
                                    </div>
                                    <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(0,194,122,0.2)', color: '#4ADE80' }}>
                                        {t.tag}
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* PRICING */}
            <section id="pricing" className="py-24" style={{ background: '#FAFAFC' }}>
                <div className="max-w-5xl mx-auto px-6">
                    <div className="text-center mb-14">
                        <SectionBadge color={P}>Pricing</SectionBadge>
                        <h2 className="text-4xl sm:text-5xl font-black text-slate-900 mt-3 leading-tight">Simple, honest pricing</h2>
                        <p className="text-slate-500 mt-4 text-lg">Start free. Upgrade when you're ready.</p>
                    </div>
                    <PricingSection onStart={goStart} />
                </div>
            </section>

            {/* FAQ */}
            <section className="py-24" style={{ background: '#fff' }}>
                <div className="max-w-2xl mx-auto px-6">
                    <div className="text-center mb-12">
                        <SectionBadge color={C}>FAQ</SectionBadge>
                        <h2 className="text-4xl font-black text-slate-900 mt-3">Common questions</h2>
                    </div>
                    <FAQAccordion />
                </div>
            </section>

            {/* BOTTOM CTA */}
            <section className="py-28" style={{ background: 'linear-gradient(135deg, #6D5DFC 0%, #8B7BFF 60%, #00D4FF 160%)' }}>
                <div className="max-w-3xl mx-auto px-6 text-center">
                    <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                        <h2 className="text-4xl sm:text-5xl font-black text-white mb-5 leading-tight">
                            Your dream job is<br />one AI session away
                        </h2>
                        <p className="text-white/70 text-lg mb-10">10,000+ candidates have already built stronger resumes with ResumeAI. You're next.</p>
                        <button onClick={goStart}
                            className="inline-flex items-center gap-3 px-10 py-5 rounded-2xl font-black text-lg transition-all hover:scale-[1.03] active:scale-95"
                            style={{ background: 'white', color: P, boxShadow: '0 20px 50px rgba(0,0,0,0.25)' }}>
                            <Sparkles size={20} /> Start Building — It's Free
                        </button>
                        <p className="mt-5 text-white/50 text-sm">No credit card · Free forever plan · Cancel anytime</p>
                    </motion.div>
                </div>
            </section>

            {/* FOOTER */}
            <footer style={{ background: '#07061A', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="max-w-5xl mx-auto px-6 py-16">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-10 mb-12">
                        <div className="col-span-2 sm:col-span-1">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: P }}>
                                    <Sparkles size={15} className="text-white" />
                                </div>
                                <span className="font-black text-white text-lg">ResumeAI</span>
                            </div>
                            <p className="text-white/40 text-sm leading-relaxed">The AI-powered career platform that helps you get hired faster.</p>
                        </div>
                        {[
                            { title: 'Product', links: ['AI Interview', 'Resume Health', 'Job Match', 'Career Intel', 'Templates'] },
                            { title: 'Company', links: ['About', 'Blog', 'Careers', 'Press'] },
                            { title: 'Legal', links: ['Privacy', 'Terms', 'Security', 'Cookies'] },
                        ].map(col => (
                            <div key={col.title}>
                                <p className="text-white/60 font-bold text-xs uppercase tracking-wider mb-4">{col.title}</p>
                                <ul className="space-y-2">
                                    {col.links.map(l => <li key={l}><a href="#" className="text-white/40 hover:text-white/70 text-sm transition-colors">{l}</a></li>)}
                                </ul>
                            </div>
                        ))}
                    </div>
                    <div className="border-t pt-8 flex flex-col sm:flex-row items-center justify-between gap-4" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                        <p className="text-white/30 text-sm">© 2025 ResumeAI. All rights reserved.</p>
                        <p className="text-white/20 text-xs">Built with Gemini 2.5 Flash · FastAPI · Next.js</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}

// ─── Pricing section ────────────────────────────────────────────────────────────
function PricingSection({ onStart }: { onStart: () => void }) {
    const [yearly, setYearly] = useState(false);

    const plans = [
        {
            name: 'Free',
            price: '₹0',
            period: 'forever',
            desc: 'Perfect for getting started',
            cta: 'Start Free',
            primary: false,
            features: ['1 resume', 'AI Interview Builder', 'Basic ATS score', '5 AI credits / day', '3 template styles'],
        },
        {
            name: 'Pro',
            price: yearly ? '₹399' : '₹499',
            period: yearly ? '/month, billed yearly' : '/month',
            desc: 'For serious job seekers',
            cta: 'Start Pro Trial',
            primary: true,
            badge: 'Most Popular',
            save: yearly ? 'Save 20%' : undefined,
            features: ['Unlimited resumes', 'Job Match Studio', 'Resume Health Center', 'Career Intelligence', 'Template Intelligence', 'Cover Letter Studio', 'Unlimited AI credits', 'Priority AI & support'],
        },
        {
            name: 'Lifetime',
            price: '₹4,999',
            period: 'one-time',
            desc: 'Pay once, use forever',
            cta: 'Get Lifetime Access',
            primary: false,
            features: ['Everything in Pro', 'Future features included', 'Priority support forever', 'Early access to beta features'],
        },
    ];

    return (
        <div className="space-y-6">
            {/* Toggle */}
            <div className="flex justify-center mb-10">
                <div className="flex items-center gap-3 p-1 rounded-2xl" style={{ background: 'white', border: '1px solid #E2E8F0' }}>
                    {['Monthly', 'Yearly'].map(o => (
                        <button key={o} onClick={() => setYearly(o === 'Yearly')}
                            className="px-5 py-2 rounded-xl text-sm font-bold transition-all"
                            style={yearly === (o === 'Yearly') ? { background: P, color: 'white' } : { color: '#94A3B8' }}>
                            {o} {o === 'Yearly' && <span className="text-[10px] font-black ml-1" style={{ color: yearly ? '#A8F0D4' : G }}>-20%</span>}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-5">
                {plans.map((plan, i) => (
                    <motion.div key={plan.name} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                        className="relative p-7 rounded-2xl flex flex-col"
                        style={plan.primary
                            ? { background: `linear-gradient(135deg, ${P} 0%, #8B7BFF 100%)`, boxShadow: '0 20px 50px rgba(109,93,252,0.4)' }
                            : { background: 'white', border: '1px solid #E2E8F0', boxShadow: '0 4px 16px rgba(0,0,0,0.05)' }}>
                        {plan.badge && (
                            <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[11px] font-black text-white"
                                style={{ background: A, boxShadow: '0 4px 12px rgba(245,158,11,0.45)' }}>{plan.badge}</span>
                        )}
                        <div className="mb-6">
                            <div className="flex items-center justify-between mb-1">
                                <p className={`font-bold text-lg ${plan.primary ? 'text-white' : 'text-slate-900'}`}>{plan.name}</p>
                                {plan.save && <span className="text-[11px] font-black px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}>{plan.save}</span>}
                            </div>
                            <p className={`text-xs mb-4 ${plan.primary ? 'text-white/60' : 'text-slate-500'}`}>{plan.desc}</p>
                            <div className="flex items-end gap-1">
                                <span className={`text-4xl font-black ${plan.primary ? 'text-white' : 'text-slate-900'}`}>{plan.price}</span>
                                <span className={`text-sm mb-1.5 ${plan.primary ? 'text-white/60' : 'text-slate-500'}`}>{plan.period}</span>
                            </div>
                        </div>
                        <ul className="space-y-2.5 flex-1 mb-7">
                            {plan.features.map(f => (
                                <li key={f} className="flex items-center gap-2.5 text-sm">
                                    <Check size={14} className="shrink-0" style={{ color: plan.primary ? 'rgba(255,255,255,0.8)' : G }} />
                                    <span className={plan.primary ? 'text-white/85' : 'text-slate-600'}>{f}</span>
                                </li>
                            ))}
                        </ul>
                        <button onClick={onStart}
                            className="w-full py-3.5 rounded-xl font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
                            style={plan.primary
                                ? { background: 'white', color: P, boxShadow: '0 4px 14px rgba(0,0,0,0.15)' }
                                : { background: P, color: 'white', boxShadow: '0 4px 14px rgba(109,93,252,0.35)' }}>
                            {plan.cta}
                        </button>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

// ─── Interactive product demo ───────────────────────────────────────────────────
function DemoSection() {
    const [tab, setTab] = useState<DemoTab>('interview');

    return (
        <div className="rounded-3xl overflow-hidden" style={{ border: '1px solid #E2E8F0', boxShadow: '0 20px 60px rgba(0,0,0,0.08)' }}>
            {/* Tab bar */}
            <div className="flex overflow-x-auto" style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                {DEMO_TABS.map(t => (
                    <button key={t.id} onClick={() => setTab(t.id)}
                        className="px-6 py-4 text-sm font-bold whitespace-nowrap transition-all shrink-0 border-b-2"
                        style={tab === t.id
                            ? { color: P, borderBottomColor: P, background: 'white' }
                            : { color: '#94A3B8', borderBottomColor: 'transparent' }}>
                        {t.label}
                    </button>
                ))}
            </div>
            {/* Tab content */}
            <AnimatePresence mode="wait">
                <motion.div key={tab} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.18 }}>
                    {tab === 'interview' && <DemoInterview />}
                    {tab === 'health'    && <DemoHealth />}
                    {tab === 'match'     && <DemoMatch />}
                    {tab === 'career'    && <DemoCareer />}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

function DemoInterview() {
    return (
        <div className="p-8 grid sm:grid-cols-2 gap-8 items-center" style={{ background: 'white' }}>
            <div>
                <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: P }}>AI Interview Builder</p>
                <h3 className="text-2xl font-black text-slate-900 mb-3">Talk to AI. Get a resume.</h3>
                <p className="text-slate-500 leading-relaxed mb-5">Answer 7 conversational questions. No forms, no templates to fill. AI writes your complete, ATS-optimized resume in under 60 seconds.</p>
                <ul className="space-y-2">
                    {['Generates quantified achievements from plain answers', 'Injects ATS keywords for your target role', 'Produces polished bullets with strong action verbs'].map(f => (
                        <li key={f} className="flex items-center gap-2 text-sm text-slate-600">
                            <Check size={14} style={{ color: G }} /> {f}
                        </li>
                    ))}
                </ul>
            </div>
            <div className="rounded-2xl p-5" style={{ background: '#FAFAFC', border: '1px solid #E2E8F0' }}>
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: P }}><Bot size={12} className="text-white" /></div>
                    <span className="text-xs font-bold text-slate-600">AI Interview · Step 4/7</span>
                </div>
                <div className="space-y-3 text-sm">
                    <div className="flex justify-start"><div className="px-3 py-2 rounded-xl bg-white text-slate-700 max-w-xs" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>Which tools and technologies do you use most?</div></div>
                    <div className="flex justify-end"><div className="px-3 py-2 rounded-xl text-white max-w-xs" style={{ background: P }}>Python, AWS, Kubernetes, Terraform, React</div></div>
                    <div className="flex justify-start"><div className="px-3 py-2 rounded-xl bg-white text-slate-700 max-w-xs" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>Great stack! Have you led or mentored anyone?</div></div>
                </div>
                <div className="mt-4 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: '57%', background: `linear-gradient(90deg, ${P}, ${C})` }} />
                </div>
            </div>
        </div>
    );
}

function DemoHealth() {
    return (
        <div className="p-8 grid sm:grid-cols-2 gap-8 items-center" style={{ background: 'white' }}>
            <div>
                <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: G }}>Resume Health Center</p>
                <h3 className="text-2xl font-black text-slate-900 mb-3">Instant resume diagnosis.</h3>
                <p className="text-slate-500 leading-relaxed mb-5">Get a 6-dimension health score in milliseconds. One click rewrites your entire resume with stronger language, better metrics, and more keywords.</p>
                <ul className="space-y-2">
                    {['ATS Score, Impact, Readability, Leadership, Keywords, Completeness', 'AI rewrites all sections — you review before/after', 'Applied in one click with full rollback'].map(f => (
                        <li key={f} className="flex items-center gap-2 text-sm text-slate-600">
                            <Check size={14} style={{ color: G }} /> {f}
                        </li>
                    ))}
                </ul>
            </div>
            <div className="rounded-2xl p-5" style={{ background: '#FAFAFC', border: '1px solid #E2E8F0' }}>
                <div className="flex items-center justify-between mb-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Resume Strength</p>
                    <span className="text-2xl font-black" style={{ color: G }}>78</span>
                </div>
                {[['ATS Score', 82, G], ['Keyword Coverage', 71, A], ['Impact', 68, A], ['Leadership', 55, '#EF4444'], ['Readability', 88, G]].map(([l, v, c]) => (
                    <div key={l as string} className="mb-2.5">
                        <div className="flex justify-between text-xs mb-1"><span className="text-slate-500">{l as string}</span><span className="font-bold" style={{ color: c as string }}>{v as number}</span></div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${v as number}%`, background: c as string }} />
                        </div>
                    </div>
                ))}
                <button className="mt-4 w-full py-2 rounded-xl text-xs font-bold text-white" style={{ background: G }}>✨ Improve Entire Resume</button>
            </div>
        </div>
    );
}

function DemoMatch() {
    return (
        <div className="p-8 grid sm:grid-cols-2 gap-8 items-center" style={{ background: 'white' }}>
            <div>
                <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: C }}>Job Match Studio</p>
                <h3 className="text-2xl font-black text-slate-900 mb-3">Tailor for any job in 30 seconds.</h3>
                <p className="text-slate-500 leading-relaxed mb-5">Paste any job description. AI extracts requirements, scores your match, explains skill gaps, and rewrites your resume to fit the role.</p>
                <ul className="space-y-2">
                    {['Match score + skill gap analysis', 'Recruiter perspective (what they\'ll like, reject, flag)', 'One-click tailored resume with before/after diff'].map(f => (
                        <li key={f} className="flex items-center gap-2 text-sm text-slate-600">
                            <Check size={14} style={{ color: G }} /> {f}
                        </li>
                    ))}
                </ul>
            </div>
            <div className="rounded-2xl p-5" style={{ background: '#FAFAFC', border: '1px solid #E2E8F0' }}>
                <div className="text-center mb-4">
                    <p className="text-4xl font-black" style={{ color: P }}>87%</p>
                    <p className="text-xs text-slate-500">Match Score · Top 13% of applicants</p>
                </div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Required Skills</p>
                <div className="flex flex-wrap gap-1.5 mb-4">
                    {[['AWS', true], ['Python', true], ['Docker', true], ['Terraform', false], ['Helm', false]].map(([s, has]) => (
                        <span key={s as string} className="text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1"
                            style={has ? { background: 'rgba(0,194,122,0.12)', color: G } : { background: '#FEF3C7', color: '#B45309' }}>
                            {has && <Check size={9} />}{s as string}
                        </span>
                    ))}
                </div>
                <div className="rounded-xl p-3" style={{ background: '#FFF7ED', border: '1px solid #FED7AA' }}>
                    <p className="text-[10px] font-bold text-amber-700 mb-1">Gaps holding you back</p>
                    <p className="text-xs text-amber-800">Terraform — required for IaC responsibilities in this role</p>
                </div>
            </div>
        </div>
    );
}

function DemoCareer() {
    return (
        <div className="p-8 grid sm:grid-cols-2 gap-8 items-center" style={{ background: 'white' }}>
            <div>
                <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: A }}>Career Intelligence</p>
                <h3 className="text-2xl font-black text-slate-900 mb-3">Your career operating system.</h3>
                <p className="text-slate-500 leading-relaxed mb-5">Six intelligence surfaces in one report: skill gaps, promotion readiness, salary benchmarks, interview prep, career roadmap, and a weekly action plan.</p>
                <ul className="space-y-2">
                    {['Data-driven skill gap analysis with hiring impact', 'Salary benchmarks + what skills raise your comp', 'Personalized roadmap: current role → dream role'].map(f => (
                        <li key={f} className="flex items-center gap-2 text-sm text-slate-600">
                            <Check size={14} style={{ color: G }} /> {f}
                        </li>
                    ))}
                </ul>
            </div>
            <div className="rounded-2xl p-5" style={{ background: '#FAFAFC', border: '1px solid #E2E8F0' }}>
                <div className="flex items-center justify-between mb-4">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Career Score</p>
                    <span className="text-3xl font-black" style={{ color: P }}>73</span>
                </div>
                {[['Market Readiness', 82, P], ['Promotion Ready', 65, A], ['Interview Ready', 79, G], ['Salary Potential', 71, C]].map(([l, v, c]) => (
                    <div key={l as string} className="mb-2">
                        <div className="flex justify-between text-xs mb-1"><span className="text-slate-500">{l as string}</span><span className="font-bold" style={{ color: c as string }}>{v as number}%</span></div>
                        <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${v as number}%`, background: c as string }} />
                        </div>
                    </div>
                ))}
                <div className="mt-4 rounded-xl p-3" style={{ background: 'rgba(109,93,252,0.06)', border: '1px solid rgba(109,93,252,0.15)' }}>
                    <p className="text-[10px] font-bold mb-1" style={{ color: P }}>Top Opportunity</p>
                    <p className="text-xs text-slate-600">Learn Terraform → <span style={{ color: G }}>+12% hiring probability</span></p>
                </div>
            </div>
        </div>
    );
}

// ─── FAQ Accordion ──────────────────────────────────────────────────────────────
function FAQAccordion() {
    const [open, setOpen] = useState<number | null>(0);
    return (
        <div className="space-y-3">
            {FAQS.map((f, i) => (
                <div key={i} className="rounded-2xl overflow-hidden" style={{ border: '1px solid #E2E8F0' }}>
                    <button onClick={() => setOpen(open === i ? null : i)}
                        className="w-full flex items-center justify-between px-6 py-4 text-left bg-white hover:bg-slate-50 transition-colors">
                        <span className="font-semibold text-slate-900 text-sm">{f.q}</span>
                        <ChevronDown size={16} className="shrink-0 text-slate-400 transition-transform" style={{ transform: open === i ? 'rotate(180deg)' : 'none' }} />
                    </button>
                    <AnimatePresence>
                        {open === i && (
                            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} style={{ overflow: 'hidden' }}>
                                <p className="px-6 pb-5 text-sm text-slate-500 leading-relaxed bg-white">{f.a}</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            ))}
        </div>
    );
}

// ─── Shared utilities ───────────────────────────────────────────────────────────
function SectionBadge({ color, children }: { color: string; children: React.ReactNode }) {
    return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
            style={{ background: `${color}14`, color }}>
            <Sparkles size={10} /> {children}
        </span>
    );
}

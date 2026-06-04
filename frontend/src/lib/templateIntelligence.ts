/**
 * Template Intelligence System.
 *
 * NOT a gallery — a recommendation engine. Outcome-based templates carry metadata,
 * scoring profiles, and AI transformation directives so the system can answer
 * "which template should I use?" automatically, project impact before switching,
 * and rewrite the resume's *style* (not facts) to match.
 *
 * Future-proof: adding Google/Amazon/Meta/Netflix/OpenAI presets is just another
 * entry in TEMPLATES — no architecture change.
 */
import { ResumeContent, textOf, atsScore, leadershipScore, readabilityScore, keywordCoverage, ACTION_VERBS, LEADERSHIP_SIGNALS } from './resumeInsights';

export interface TemplateProfile {
    id: string;                 // outcome id, e.g. "devops-elite"
    rendererId: string;         // maps to TemplateRenderer layout
    name: string;               // outcome-based name
    tagline: string;
    bestFor: string;
    accent: string;
    styleDirective: string;     // instruction for AI style transformation
    /** how this template tends to shift each metric (additive deltas, pre-clamp) */
    impact: { ats: number; keywords: number; readability: number; leadership: number };
    /** recommendation signals */
    roleKeywords: string[];
    seniority: string[];        // experience levels it suits
    industries: string[];
    contentSignal: 'technical' | 'leadership' | 'balanced' | 'entry';
}

export const TEMPLATES: TemplateProfile[] = [
    {
        id: 'ats-maximum', rendererId: 'modern-ats', name: 'ATS Maximum', accent: '#00C27A',
        tagline: 'Maximum parser compatibility', bestFor: 'Anyone applying through online portals and ATS filters',
        styleDirective: 'Plain, keyword-dense, ATS-first. Front-load role-specific keywords, avoid figurative language.',
        impact: { ats: 12, keywords: 9, readability: 4, leadership: 0 },
        roleKeywords: [], seniority: ['Fresher', 'Junior', 'Mid', 'Senior', 'Lead'], industries: [], contentSignal: 'balanced',
    },
    {
        id: 'devops-elite', rendererId: 'tech-focused', name: 'DevOps Elite', accent: '#00D4FF',
        tagline: 'Infrastructure & reliability focus', bestFor: 'DevOps, SRE, Platform & Cloud engineers',
        styleDirective: 'Emphasize automation, reliability, scale, uptime, and cloud stack. Quantify infra impact (latency, cost, deploys).',
        impact: { ats: 7, keywords: 11, readability: 3, leadership: 2 },
        roleKeywords: ['devops', 'sre', 'platform', 'cloud', 'infrastructure', 'reliability', 'kubernetes', 'aws', 'ci/cd'],
        seniority: ['Mid', 'Senior', 'Lead'], industries: ['Cloud & Infrastructure', 'Cybersecurity', 'Software & SaaS'], contentSignal: 'technical',
    },
    {
        id: 'technical-architect', rendererId: 'tech-focused', name: 'Technical Architect', accent: '#6D5DFC',
        tagline: 'Systems depth & architecture', bestFor: 'Staff/Principal engineers and architects',
        styleDirective: 'Emphasize system design, architecture decisions, scale, and technical leadership. Keep depth high.',
        impact: { ats: 6, keywords: 9, readability: 2, leadership: 6 },
        roleKeywords: ['architect', 'staff', 'principal', 'backend', 'distributed', 'systems', 'engineer'],
        seniority: ['Senior', 'Lead'], industries: ['Software & SaaS', 'AI & Machine Learning'], contentSignal: 'technical',
    },
    {
        id: 'executive-leadership', rendererId: 'leadership', name: 'Executive Leadership', accent: '#8B5CF6',
        tagline: 'Strategy, P&L & org impact', bestFor: 'Directors, VPs, and senior leaders',
        styleDirective: 'Executive tone. Lead with strategy, business outcomes, P&L, org scale, and stakeholder influence. Minimize low-level tasks.',
        impact: { ats: 4, keywords: 5, readability: 6, leadership: 14 },
        roleKeywords: ['director', 'vp', 'head', 'chief', 'lead', 'manager', 'principal'],
        seniority: ['Senior', 'Lead'], industries: [], contentSignal: 'leadership',
    },
    {
        id: 'product-manager-pro', rendererId: 'leadership', name: 'Product Manager Pro', accent: '#EC4899',
        tagline: 'Outcomes, metrics & roadmap', bestFor: 'Product Managers and Product Leaders',
        styleDirective: 'Frame around product outcomes, metrics, user impact, and cross-functional leadership. Tie work to business KPIs.',
        impact: { ats: 6, keywords: 7, readability: 7, leadership: 9 },
        roleKeywords: ['product', 'pm', 'product manager', 'growth', 'strategy'],
        seniority: ['Mid', 'Senior', 'Lead'], industries: [], contentSignal: 'leadership',
    },
    {
        id: 'startup-growth', rendererId: 'minimal-pro', name: 'Startup Growth', accent: '#F59E0B',
        tagline: 'Range, ownership & velocity', bestFor: 'Generalists and early-stage / high-growth startup roles',
        styleDirective: 'Emphasize ownership, breadth, speed, and 0→1 impact. Show range across functions and bias for action.',
        impact: { ats: 5, keywords: 6, readability: 8, leadership: 5 },
        roleKeywords: ['founder', 'founding', 'startup', 'generalist', 'full stack', 'fullstack'],
        seniority: ['Junior', 'Mid', 'Senior'], industries: ['Software & SaaS', 'Fintech', 'AI & Machine Learning'], contentSignal: 'balanced',
    },
    {
        id: 'consulting-professional', rendererId: 'minimal-pro', name: 'Consulting Professional', accent: '#0EA5E9',
        tagline: 'Structured, client-impact framing', bestFor: 'Consulting, strategy, and client-facing roles',
        styleDirective: 'Structured, results-first consulting tone. Quantify client impact, scope, and stakeholder outcomes.',
        impact: { ats: 6, keywords: 6, readability: 9, leadership: 7 },
        roleKeywords: ['consultant', 'consulting', 'strategy', 'analyst', 'advisory'],
        seniority: ['Junior', 'Mid', 'Senior', 'Lead'], industries: ['Management Consulting', 'Legal'], contentSignal: 'balanced',
    },
    {
        id: 'fresher-launch', rendererId: 'fresher-grad', name: 'Fresher Launch', accent: '#10B981',
        tagline: 'Projects & potential forward', bestFor: 'New graduates and early-career candidates',
        styleDirective: 'Lead with education, projects, internships, and skills. Frame potential and learning velocity.',
        impact: { ats: 8, keywords: 7, readability: 6, leadership: 1 },
        roleKeywords: ['intern', 'graduate', 'junior', 'entry', 'associate', 'trainee'],
        seniority: ['Fresher', 'Junior'], industries: [], contentSignal: 'entry',
    },
];

export function templateById(id: string): TemplateProfile | undefined {
    return TEMPLATES.find(t => t.id === id) || TEMPLATES.find(t => t.rendererId === id);
}

export interface RecommendContext {
    jobRole?: string;
    experienceLevel?: string;
    industry?: string;
    content?: ResumeContent | null;
}
export interface Recommendation {
    template: TemplateProfile;
    confidence: number;
    reason: string;
    ranked: { template: TemplateProfile; score: number }[];
}

/** Deterministic recommender — instant, explainable. */
export function recommendTemplate(ctx: RecommendContext): Recommendation {
    const role = (ctx.jobRole || '').toLowerCase();
    const level = ctx.experienceLevel || 'Mid';
    const industry = ctx.industry || '';
    const text = textOf(ctx.content).toLowerCase();
    const techDensity = ACTION_VERBS.length ? new Set((text.match(/[a-z+#.]{3,}/g) || []).filter(w => ['aws','kubernetes','docker','python','terraform','react','sql','java','go','ci/cd','cloud','api','linux'].includes(w))).size : 0;
    const leadDensity = LEADERSHIP_SIGNALS.filter(s => text.includes(s)).length;

    const scored = TEMPLATES.map(t => {
        let s = 0;
        const reasons: string[] = [];
        if (t.roleKeywords.some(k => role.includes(k))) { s += 40; reasons.push('role match'); }
        if (t.seniority.includes(level)) { s += 18; }
        if (t.industries.length && t.industries.includes(industry)) { s += 16; reasons.push('industry fit'); }
        if (t.contentSignal === 'technical' && techDensity >= 3) { s += 22; reasons.push('technical depth'); }
        if (t.contentSignal === 'leadership' && leadDensity >= 2) { s += 22; reasons.push('leadership signals'); }
        if (t.contentSignal === 'entry' && (level === 'Fresher' || level === 'Junior')) { s += 20; }
        if (t.id === 'ats-maximum') s += 10; // safe baseline
        return { template: t, score: s, reasons };
    }).sort((a, b) => b.score - a.score);

    const top = scored[0];
    const maxPossible = 96;
    const confidence = Math.max(62, Math.min(96, Math.round(60 + (top.score / maxPossible) * 36)));

    const bits: string[] = [];
    if (role) bits.push(`targeting ${ctx.jobRole}`);
    if (top.template.contentSignal === 'technical' && techDensity >= 3) bits.push('strong technical stack');
    if (top.template.contentSignal === 'leadership' && leadDensity >= 2) bits.push('clear leadership signals');
    if (level) bits.push(`${level.toLowerCase()}-level experience`);
    if (industry) bits.push(`${industry} focus`);
    const reason = bits.length ? `${bits.slice(0, 3).join(', ')}.` : 'Balanced profile suited to a clean, ATS-safe layout.';

    return { template: top.template, confidence, reason: reason.charAt(0).toUpperCase() + reason.slice(1), ranked: scored.map(({ template, score }) => ({ template, score })) };
}

export interface ProjectedImpact {
    ats: { now: number; next: number };
    keywords: { now: number; next: number };
    readability: { now: number; next: number };
    leadership: { now: number; next: number };
}
const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

/** Project a template's effect on the resume's metrics (deterministic). */
export function projectedImpact(t: TemplateProfile, content: ResumeContent | undefined | null, jobRole = ''): ProjectedImpact {
    const ats = atsScore(content), kw = keywordCoverage(content, jobRole), rd = readabilityScore(content), ld = leadershipScore(content);
    return {
        ats: { now: ats, next: clamp(ats + t.impact.ats) },
        keywords: { now: kw, next: clamp(kw + t.impact.keywords) },
        readability: { now: rd, next: clamp(rd + t.impact.readability) },
        leadership: { now: ld, next: clamp(ld + t.impact.leadership) },
    };
}

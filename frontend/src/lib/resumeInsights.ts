/**
 * Resume Insights Engine — the single source of truth for all resume scoring.
 *
 * Every product surface (Command Center, Workspace, Health Engine, Job Match)
 * imports from here. Do NOT re-implement scoring anywhere else — extend this file.
 */

// ─── Shared content shape ──────────────────────────────────────────────────────
export interface Skill { name: string; level?: string; years?: number }
export interface WorkEntry { company: string; role: string; duration: string; points: string[] }
export interface EduEntry { institution: string; degree: string; year: string; gpa?: string }
export interface ProjectEntry { name: string; description: string; technologies: string[]; link?: string }

export interface ResumeContent {
    full_name?: string;
    contact_info?: { email?: string; phone?: string; linkedin?: string };
    summary?: string;
    skills?: (string | Skill)[];
    work_experience?: WorkEntry[];
    education?: EduEntry[];
    projects?: ProjectEntry[];
}

export interface SectionScore { content: number; keywords: number; impact: number }
export interface HealthReport {
    overall: number;
    ats: number;
    readiness: number;
    keywordCoverage: number;
    impact: number;
    leadership: number;
    readability: number;
    completeness: number;
    percentile: number;
    potentialAtsGain: number;
    missingSignals: string[];
}

// ─── Lexicons ──────────────────────────────────────────────────────────────────
export const ACTION_VERBS = [
    'led','built','created','developed','designed','implemented','managed','launched',
    'delivered','achieved','improved','increased','reduced','generated','spearheaded',
    'established','transformed','accelerated','optimized','streamlined','architected',
    'scaled','drove','expanded','founded','grew','negotiated','secured','mentored',
    'coached','oversaw','coordinated','executed','pioneered','revamped','automated',
    'migrated','integrated','deployed','engineered','shipped','refactored','directed',
    'recruited','onboarded','resolved','identified','analysed','analyzed',
];
export const LEADERSHIP_SIGNALS = [
    'led','managed','mentored','coached','directed','oversaw','spearheaded','founded',
    'head of','team of','cross-functional','stakeholder','strategy','roadmap','hired',
    'built a team','p&l','budget','reports','direct reports',
];
export const WEAK_PHRASES = [
    'responsible for','helped with','worked on','assisted with','involved in',
    'participated in','contributed to','tasked with','duties include',
];
export const METRIC_PATTERNS = [/\d+\s*%/, /\$[\d,]+/, /\d+[xX]/, /\d+\+/, /\b[1-9]\d+\b/];

// ─── Primitives ────────────────────────────────────────────────────────────────
export function textOf(c: any): string {
    if (!c) return '';
    if (typeof c === 'string') return c;
    if (Array.isArray(c)) return c.map(textOf).join(' ');
    if (typeof c === 'object') return Object.values(c).map(textOf).join(' ');
    return String(c);
}
export function wordCount(t: string): number { return t.trim() ? t.trim().split(/\s+/).length : 0; }
export function readTime(t: string): number { return Math.ceil(wordCount(t) / 200); }
export function skillName(s: string | Skill): string { return typeof s === 'string' ? s : s?.name ?? ''; }
export function countMetrics(content: any): number {
    const t = textOf(content);
    return METRIC_PATTERNS.reduce((n, r) => n + (r.test(t) ? 1 : 0), 0);
}

// ─── Per-section scoring ───────────────────────────────────────────────────────
export function scoreContent(id: string, content: any): number {
    if (!content) return 0;
    switch (id) {
        case 'summary': {
            const w = wordCount(typeof content === 'string' ? content : textOf(content));
            if (!w) return 0;
            if (w < 15) return 20;
            if (w < 30) return 55;
            if (w <= 80) return 100;
            if (w <= 120) return 80;
            return 60;
        }
        case 'skills': {
            const n = Array.isArray(content) ? content.filter((s: any) => skillName(s).trim()).length : 0;
            if (!n) return 0;
            if (n < 3) return 30;
            if (n < 6) return 60;
            if (n < 10) return 85;
            return 100;
        }
        case 'work_experience': {
            if (!Array.isArray(content) || !content.length) return 0;
            const base = Math.min(content.length * 25, 50);
            const bullets = content.reduce((a: number, e: any) =>
                a + Math.min((e.points || []).filter((p: string) => p?.trim().length > 5).length * 8, 25), 0) / content.length;
            const fields = content.filter((e: any) => e.company && e.role && e.duration).length / content.length * 25;
            return Math.round(Math.min(base + bullets + fields, 100));
        }
        case 'education': {
            if (!Array.isArray(content) || !content.length) return 0;
            const complete = content.filter((e: any) => e.institution && e.degree && e.year).length;
            return Math.round(Math.min(40 + (complete / content.length) * 60, 100));
        }
        case 'projects': {
            if (!Array.isArray(content) || !content.length) return 0;
            const d = content.filter((e: any) => (e.description || '').length > 30).length / content.length;
            const t = content.filter((e: any) => (e.technologies || []).length > 0).length / content.length;
            return Math.round(Math.min(Math.min(content.length * 20, 40) + d * 35 + t * 25, 100));
        }
        default: return 0;
    }
}

export function scoreKeywords(id: string, content: any, jobRole = ''): number {
    if (!content) return 0;
    const t = textOf(content).toLowerCase();
    if (!t.trim()) return 0;
    let s = Math.min(ACTION_VERBS.filter(v => t.includes(v)).length * 8, 40);
    if (jobRole) {
        const rw = jobRole.toLowerCase().split(/\s+/).filter(w => w.length > 3);
        s += Math.round((rw.filter(w => t.includes(w)).length / Math.max(rw.length, 1)) * 35);
    }
    if (id === 'skills' && Array.isArray(content)) s += Math.min(content.length * 3, 25);
    return Math.round(Math.min(Math.max(0, s - WEAK_PHRASES.filter(p => t.includes(p)).length * 12), 100));
}

export function scoreImpact(content: any): number {
    if (!content) return 0;
    const text = textOf(content);
    if (!text.trim()) return 0;
    const low = text.toLowerCase();
    const m = METRIC_PATTERNS.filter(p => p.test(text)).length;
    const v = ACTION_VERBS.filter(x => low.includes(x)).length;
    const weak = WEAK_PHRASES.filter(p => low.includes(p)).length;
    return Math.round(Math.min(Math.max(0, Math.min(m * 18, 54) + Math.min(v * 7, 28) + (m > 0 && v > 0 ? 18 : 0) - weak * 15), 100));
}

export function sectionScore(id: string, content: any, jobRole = ''): SectionScore {
    return { content: scoreContent(id, content), keywords: scoreKeywords(id, content, jobRole), impact: scoreImpact(content) };
}

// ─── Whole-resume metrics ──────────────────────────────────────────────────────
const SECTION_IDS = ['summary', 'skills', 'work_experience', 'education', 'projects'];

export function overallScore(parsed: ResumeContent | undefined | null, jobRole = ''): number {
    if (!parsed) return 0;
    const avg = SECTION_IDS.map(id => {
        const q = sectionScore(id, (parsed as any)[id], jobRole);
        return (q.content + q.keywords + q.impact) / 3;
    });
    return Math.round(avg.reduce((a, b) => a + b, 0) / SECTION_IDS.length);
}

export function readiness(p: ResumeContent | undefined | null): number {
    if (!p) return 0;
    let s = 0;
    if ((p.summary?.length || 0) > 50) s += 25;
    if ((p.skills?.length || 0) >= 3) s += 20;
    if ((p.work_experience?.length || 0) > 0) s += 30;
    if ((p.education?.length || 0) > 0) s += 10;
    if ((p.projects?.length || 0) > 0) s += 15;
    return Math.min(s, 100);
}

export function atsScore(p: ResumeContent | undefined | null): number {
    const t = textOf(p).toLowerCase();
    if (!t.trim()) return 0;
    const v = Math.min(ACTION_VERBS.filter(x => t.includes(x)).length * 6, 50);
    const m = Math.min(countMetrics(p) * 12, 50);
    return Math.min(v + m, 100);
}

export function leadershipScore(p: ResumeContent | undefined | null): number {
    const t = textOf(p).toLowerCase();
    if (!t.trim()) return 0;
    return Math.min(LEADERSHIP_SIGNALS.filter(x => t.includes(x)).length * 14, 100);
}

export function readabilityScore(p: ResumeContent | undefined | null): number {
    if (!p) return 0;
    const bullets = (p.work_experience || []).flatMap(w => w.points || []);
    if (!bullets.length && !(p.summary || '').trim()) return 0;
    const longBullets = bullets.filter(b => wordCount(b) > 28).length;
    const weak = WEAK_PHRASES.filter(ph => textOf(p).toLowerCase().includes(ph)).length;
    return Math.round(Math.max(0, 100 - longBullets * 10 - weak * 8));
}

export function keywordCoverage(p: ResumeContent | undefined | null, jobRole = ''): number {
    const t = textOf(p).toLowerCase();
    if (!t.trim()) return 0;
    const verbs = Math.min(ACTION_VERBS.filter(v => t.includes(v)).length * 5, 60);
    const roleHit = jobRole ? (jobRole.toLowerCase().split(/\s+/).filter(w => w.length > 3).every(w => t.includes(w)) ? 40 : 20) : 20;
    return Math.min(verbs + roleHit, 100);
}

export function missingSignals(p: ResumeContent | undefined | null): string[] {
    if (!p) return [];
    const out: string[] = [];
    if (countMetrics(p) < 2) out.push('Quantifiable metrics');
    if (leadershipScore(p) < 30) out.push('Leadership impact');
    if ((p.skills?.length || 0) < 6) out.push('Industry keywords');
    if ((p.summary?.length || 0) < 50) out.push('Strong summary');
    const verbsUsed = ACTION_VERBS.filter(v => textOf(p.work_experience).toLowerCase().includes(v)).length;
    if (verbsUsed < 3) out.push('Action verbs');
    return out;
}

export function percentileVsApplicants(score: number): number {
    return Math.min(95, Math.round(38 + score * 0.58));
}
export function potentialAtsGain(p: ResumeContent | undefined | null): number {
    return Math.min(Math.round((100 - atsScore(p)) * 0.65), 24);
}

/** Full health report — the canonical payload for the Resume Health Engine (Phase 3). */
export function healthReport(p: ResumeContent | undefined | null, jobRole = ''): HealthReport {
    const overall = overallScore(p, jobRole);
    return {
        overall,
        ats: atsScore(p),
        readiness: readiness(p),
        keywordCoverage: keywordCoverage(p, jobRole),
        impact: scoreImpact(p),
        leadership: leadershipScore(p),
        readability: readabilityScore(p),
        completeness: readiness(p),
        percentile: percentileVsApplicants(overall),
        potentialAtsGain: potentialAtsGain(p),
        missingSignals: missingSignals(p),
    };
}

// ─── Job-match keyword gap (Phase 4 foundation) ────────────────────────────────
const STOP = new Set(['the','and','for','with','you','your','our','are','will','have','this','that','from','they','their','a','an','to','of','in','on','as','is','be','or','at','by','we','it','an']);

export function extractKeywords(text: string, limit = 25): string[] {
    const freq = new Map<string, number>();
    (text.toLowerCase().match(/[a-z][a-z+#.\-]{2,}/g) || []).forEach(w => {
        if (STOP.has(w) || w.length < 3) return;
        freq.set(w, (freq.get(w) || 0) + 1);
    });
    return [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit).map(([w]) => w);
}

export interface JobGap { matched: string[]; missing: string[]; score: number }
export function keywordGaps(p: ResumeContent | undefined | null, jobDescription: string): JobGap {
    const resumeText = textOf(p).toLowerCase();
    const jdKeywords = extractKeywords(jobDescription);
    if (!jdKeywords.length) return { matched: [], missing: [], score: 0 };
    const matched = jdKeywords.filter(k => resumeText.includes(k));
    const missing = jdKeywords.filter(k => !resumeText.includes(k));
    const score = Math.round((matched.length / jdKeywords.length) * 100);
    return { matched, missing: missing.slice(0, 12), score };
}

/**
 * Full numeric Job Match report — deterministic, instant (no AI).
 * The AI layer supplies the qualitative extraction / recruiter view separately.
 */
export interface JobMatchReport {
    match: number;
    keywordCoverage: number;
    leadershipMatch: number;
    technicalMatch: number;
    experienceMatch: number;
    atsCompatibility: number;
    percentile: number;
    potentialGain: number;
    matchedKeywords: string[];
    missingKeywords: string[];
}
export function jobMatchReport(p: ResumeContent | undefined | null, jobDescription: string, jobRole = ''): JobMatchReport {
    const gap = keywordGaps(p, jobDescription);
    const jdLower = jobDescription.toLowerCase();
    const resumeLower = textOf(p).toLowerCase();

    // Leadership match: how much of the JD's leadership demand the resume meets
    const jdLeadership = LEADERSHIP_SIGNALS.filter(s => jdLower.includes(s));
    const metLeadership = jdLeadership.filter(s => resumeLower.includes(s));
    const leadershipMatch = jdLeadership.length
        ? Math.round((metLeadership.length / jdLeadership.length) * 100)
        : leadershipScore(p);

    // Technical match ~ keyword coverage weighted toward tech-looking tokens
    const technicalMatch = gap.score;

    // Experience match from completeness of work history
    const experienceMatch = Math.min(readiness(p), 100);

    return {
        match: gap.score,
        keywordCoverage: gap.score,
        leadershipMatch,
        technicalMatch,
        experienceMatch,
        atsCompatibility: atsScore(p),
        percentile: percentileVsApplicants(gap.score),
        potentialGain: Math.min(100 - gap.score, 30),
        matchedKeywords: gap.matched.slice(0, 16),
        missingKeywords: gap.missing,
    };
}

/**
 * Career Intelligence Engine — deterministic scoring layer.
 *
 * AI supplies the qualitative data (skill gaps, salary ranges, roadmap, questions).
 * This module supplies instant, explainable numeric scores that don't need an AI call.
 *
 * Plugin-ready: future modules (Interview Coach, Salary Negotiation, Job Search Agent,
 * LinkedIn Coach, Networking Coach) import from here and extend the registry below.
 */
import {
    ResumeContent, textOf, atsScore, leadershipScore, readabilityScore,
    LEADERSHIP_SIGNALS, ACTION_VERBS, METRIC_PATTERNS, wordCount,
} from './resumeInsights';

// ─── Career Score components ───────────────────────────────────────────────────
export interface CareerScores {
    overall: number;
    marketReadiness: number;
    promotionReadiness: number;
    leadershipReadiness: number;
    interviewReadiness: number;
    salaryPotential: number;
    topOpportunities: string[];
}

export function careerScores(p: ResumeContent | null | undefined, level = 'Mid'): CareerScores {
    if (!p) return { overall: 0, marketReadiness: 0, promotionReadiness: 0, leadershipReadiness: 0, interviewReadiness: 0, salaryPotential: 0, topOpportunities: [] };

    const text = textOf(p).toLowerCase();
    const skills = (p.skills || []).length;
    const exp = (p.work_experience || []).length;
    const hasSummary = (p.summary || '').length > 50;
    const metricCount = METRIC_PATTERNS.reduce((n, r) => n + (r.test(textOf(p)) ? 1 : 0), 0);
    const verbCount = ACTION_VERBS.filter(v => text.includes(v)).length;
    const leaderCount = LEADERSHIP_SIGNALS.filter(s => text.includes(s)).length;
    const bulletCount = (p.work_experience || []).reduce((n, e: any) => n + (e.points || []).filter((pt: string) => pt?.trim().length > 5).length, 0);

    const levelBonus = { Fresher: 0, Junior: 5, Mid: 10, Senior: 18, Lead: 24 }[level] || 10;

    const marketReadiness = Math.min(100, Math.round(
        (hasSummary ? 20 : 0) + Math.min(skills * 5, 25) + Math.min(exp * 15, 30) + Math.min(verbCount * 3, 15) + levelBonus * 0.5
    ));

    const promotionReadiness = Math.min(100, Math.round(
        Math.min(leaderCount * 12, 40) + Math.min(metricCount * 10, 30) + (exp >= 2 ? 15 : exp * 7) + levelBonus * 0.8
    ));

    const leadershipReadiness = Math.min(100, Math.round(leadershipScore(p) * 0.7 + Math.min(leaderCount * 8, 30)));

    const interviewReadiness = Math.min(100, Math.round(
        (hasSummary ? 20 : 0) + Math.min(bulletCount * 4, 40) + Math.min(metricCount * 8, 24) + Math.min(skills * 3, 16)
    ));

    const salaryPotential = Math.min(100, Math.round(
        levelBonus * 2 + Math.min(skills * 3, 20) + Math.min(leaderCount * 6, 24) + Math.min(metricCount * 8, 24) + (p.education && (p.education as any[]).length > 0 ? 10 : 0)
    ));

    const overall = Math.round((marketReadiness + promotionReadiness + leadershipReadiness + interviewReadiness + salaryPotential) / 5);

    const opps: string[] = [];
    if (metricCount < 2) opps.push('Add quantifiable metrics to bullets');
    if (leaderCount < 2) opps.push('Highlight leadership & team impact');
    if (skills < 6) opps.push('Expand skills with role-specific keywords');
    if (!hasSummary) opps.push('Write a strong professional summary');
    if (bulletCount < 6) opps.push('Add more achievement bullets to experience');
    if ((p.projects || []).length === 0) opps.push('Add project portfolio');

    return { overall, marketReadiness, promotionReadiness, leadershipReadiness, interviewReadiness, salaryPotential, topOpportunities: opps.slice(0, 4) };
}

// ─── Career Intelligence payload (returned by the AI call) ────────────────────
export interface SkillGap {
    skill: string;
    category: 'Technology' | 'Leadership' | 'Certification' | 'Methodology' | 'Soft Skill';
    priority: 'High' | 'Medium' | 'Low';
    difficulty: 'Easy' | 'Medium' | 'Hard';
    impact: string; // e.g. "+12% hiring probability"
}
export interface RoadmapStep {
    role: string;
    timeline: string;
    required_skills: string[];
    certifications: string[];
    recommended_projects: string[];
}
export interface ActionPlan {
    this_week: string[];
    this_month: string[];
    this_quarter: string[];
}
export interface InterviewQuestions {
    behavioral: string[];
    technical: string[];
    leadership: string[];
    company_specific: string[];
}
export interface SalaryIntelligence {
    current_range: string;
    likely_range: string;
    target_range: string;
    skill_boosters: string[];
    cert_boosters: string[];
    career_moves: string[];
}
export interface PromotionPath {
    current_role: string;
    target_role: string;
    readiness_pct: number;
    missing: string[];
    action_plan: string[];
}
export interface CareerIntelligence {
    skill_gaps: SkillGap[];
    promotion: PromotionPath;
    salary: SalaryIntelligence;
    interview_questions: InterviewQuestions;
    roadmap: RoadmapStep[];
    action_plan: ActionPlan;
}

// ─── Plugin registry — future coaches extend this ─────────────────────────────
export interface CoachModule {
    id: string;
    name: string;
    status: 'live' | 'coming_soon';
    description: string;
    route?: string;
}
export const COACH_MODULES: CoachModule[] = [
    { id: 'career',          name: 'Career Intelligence',  status: 'live',         description: 'Skills, promotion, salary & roadmap', route: '/coach' },
    { id: 'interview',       name: 'Interview Coach',      status: 'coming_soon',  description: 'Real-time interview prep & mock Q&A' },
    { id: 'salary',          name: 'Salary Negotiation',   status: 'coming_soon',  description: 'Data-driven offer analysis & scripts' },
    { id: 'job_search',      name: 'Job Search Agent',     status: 'coming_soon',  description: 'Targeted application strategy' },
    { id: 'linkedin',        name: 'LinkedIn Coach',       status: 'coming_soon',  description: 'Profile optimization & outreach' },
    { id: 'networking',      name: 'Networking Coach',     status: 'coming_soon',  description: 'Connection strategy & messaging' },
];

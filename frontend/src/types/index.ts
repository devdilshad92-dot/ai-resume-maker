export interface User {
    id: number;
    email: string;
    full_name?: string;
}

export interface Resume {
    id: number;
    file_path?: string;
    parsed_content?: any;
    raw_text?: string;
    template_id: string;
    is_draft: boolean;
    meta_data?: any;
    created_at: string;
}

export type ResumeResponse = Resume;

export interface JobDescription {
    id: number;
    text_content: string;
    position: string;
    company: string;
    created_at: string;
}

export interface Application {
    id: number;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    generated_content?: any;
    ats_score?: number;
    ats_feedback?: ATSFeedback;
    template_id: string;
    created_at: string;
}

export interface ResumeContent {
    full_name: string;
    contact_info: {
        email: string;
        phone?: string;
        linkedin?: string;
    };
    summary: string;
    work_experience: Array<{
        company: string;
        role: string;
        duration: string;
        points: string[];
    }>;
    skills: string[];
    education: Array<{
        institution: string;
        degree: string;
        year: string;
    }>;
    projects?: Array<{
        name: string;
        description: string;
    }>;
}

export interface ATSFeedback {
    score: number;
    match_percentage: number;
    missing_keywords: string[];
    feedback: string[];
    improvement_tips: string[];
}
export interface Template {
    id: string;
    name: string;
    description: string;
    category: string;
    preview_url?: string;
}

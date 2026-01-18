import React from 'react';
import { ResumeContent } from '../../types';

interface TemplateRendererProps {
    content: ResumeContent;
    templateId: string;
}

export const TemplateRenderer: React.FC<TemplateRendererProps> = ({ content, templateId }) => {
    // Shared styles based on templateId
    const getBaseStyles = () => {
        switch (templateId) {
            case 'minimal-pro':
                return "font-serif text-[11pt] leading-relaxed max-w-[800px] mx-auto p-12 bg-white";
            case 'modern-ats':
                return "font-sans text-[10pt] leading-tight max-w-[800px] mx-auto p-10 bg-white";
            case 'tech-focused':
                return "font-mono text-[9pt] leading-snug max-w-[800px] mx-auto p-8 bg-white";
            case 'fresher-grad':
                return "font-sans text-[11pt] leading-normal max-w-[800px] mx-auto p-12 bg-white";
            default:
                return "font-sans text-[11pt] leading-relaxed max-w-[800px] mx-auto p-12 bg-white";
        }
    };

    const renderHeader = () => {
        const isCentered = ['minimal-pro', 'fresher-grad'].includes(templateId);
        return (
            <header className={`border-b-2 border-slate-900 pb-4 mb-6 ${isCentered ? 'text-center' : 'text-left'}`}>
                <h1 className="text-3xl font-bold uppercase tracking-tighter mb-1">{content.full_name}</h1>
                <div className={`flex flex-wrap gap-3 text-sm font-medium text-slate-600 ${isCentered ? 'justify-center' : ''}`}>
                    <span>{content.contact_info.email}</span>
                    {content.contact_info.phone && <span>• {content.contact_info.phone}</span>}
                    {content.contact_info.linkedin && <span>• {content.contact_info.linkedin}</span>}
                </div>
            </header>
        );
    };

    const renderSectionHeader = (title: string) => {
        const isModern = templateId === 'modern-ats';
        const isTech = templateId === 'tech-focused';
        
        return (
            <h3 className={`font-bold uppercase tracking-widest mb-3 pb-1 border-b ${
                isModern ? 'text-lg border-slate-300' : 
                isTech ? 'text-sm bg-slate-100 px-2' : 
                'text-sm border-slate-800'
            }`}>
                {title}
            </h3>
        );
    };

    return (
        <div className={getBaseStyles()} id="resume-render-area">
            {renderHeader()}

            {/* Summary */}
            {content.summary && (
                <section className="mb-6">
                    {renderSectionHeader("Professional Summary")}
                    <p className="text-justify leading-relaxed">{content.summary}</p>
                </section>
            )}

            {/* Experience */}
            {content.work_experience?.length > 0 && (
                <section className="mb-6">
                    {renderSectionHeader("Work Experience")}
                    <div className="space-y-4">
                        {content.work_experience.map((job, i) => (
                            <div key={i} className="break-inside-avoid">
                                <div className="flex justify-between items-baseline font-bold mb-1">
                                    <h4 className="text-base">{job.company}</h4>
                                    <span className="text-sm italic font-normal">{job.duration}</span>
                                </div>
                                <div className="text-sm font-semibold text-slate-700 italic mb-2">{job.role}</div>
                                <ul className="list-disc list-outside ml-5 space-y-1">
                                    {job.points.map((pt, j) => (
                                        <li key={j} className="text-sm leading-snug">{pt}</li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Skills */}
            {content.skills?.length > 0 && (
                <section className="mb-6">
                    {renderSectionHeader("Expertise & Skills")}
                    <div className="flex flex-wrap gap-x-4 gap-y-2">
                        {content.skills.map((skill, i) => (
                            <span key={i} className="text-sm">• {skill}</span>
                        ))}
                    </div>
                </section>
            )}

            {/* Education */}
            {content.education?.length > 0 && (
                <section className="mb-6">
                    {renderSectionHeader("Education")}
                    <div className="space-y-3">
                        {content.education.map((edu, i) => (
                            <div key={i} className="flex justify-between items-baseline">
                                <div>
                                    <h4 className="font-bold text-sm">{edu.institution}</h4>
                                    <p className="text-sm italic">{edu.degree}</p>
                                </div>
                                <span className="text-sm font-medium">{edu.year}</span>
                            </div>
                        ))}
                    </div>
                </section>
            )}

             {/* Projects */}
             {content.projects && content.projects.length > 0 && (
                <section className="mb-6">
                    {renderSectionHeader("Key Projects")}
                    <div className="space-y-3">
                        {content.projects.map((proj, i) => (
                            <div key={i}>
                                <h4 className="font-bold text-sm">{proj.name}</h4>
                                <p className="text-sm leading-snug">{proj.description}</p>
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
};

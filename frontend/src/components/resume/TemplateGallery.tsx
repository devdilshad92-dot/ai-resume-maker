import React, { useState, memo } from 'react';
import { Card, CardContent } from '../ui/Card';
import { TemplateRenderer } from './TemplateRenderer';
import { Check, Layout, ZoomIn, ShieldCheck } from 'lucide-react';
import { Button } from '../ui/Button';
import { motion, AnimatePresence } from 'framer-motion';

interface Template {
    id: string;
    name: string;
    description: string;
    category: string;
}

interface Props {
    templates: Template[];
    selectedId: string;
    onSelect: (id: string) => void;
}

const SAMPLE_CONTENT = {
    full_name: "Alex Sterling",
    contact_info: {
        email: "alex.sterling@example.com",
        phone: "+1 (555) 123-4567",
        linkedin: "linkedin.com/in/alexsterling"
    },
    summary: "Dedicated Professional with 10+ years of experience in delivering high-impact solutions. Proven track record of optimizing workflows and leading cross-functional teams to success.",
    work_experience: [
        {
            company: "Tech Giant Inc.",
            role: "Senior Solutions Architect",
            duration: "2019 - Present",
            points: [
                "Led team of 15 engineers to develop core platform features.",
                "Reduced infrastructure costs by 30% through strategic migration.",
                "Implemented CI/CD pipelines increasing deployment frequency by 200%."
            ]
        }
    ],
    skills: ["Strategic Planning", "Team Leadership", "Cloud Computing", "Stakeholder Management"],
    education: [
        {
            institution: "Global University",
            degree: "B.S. in Computer Science",
            year: "2015"
        }
    ]
};

const TemplateCard = memo(({ template: t, selectedId, onSelect, onPreview }: { 
    template: Template, 
    selectedId: string, 
    onSelect: (id: string) => void,
    onPreview: (id: string) => void
}) => (
    <Card 
        className={`relative overflow-hidden cursor-pointer transition-all duration-500 group border-[1.5px] ${
            selectedId === t.id 
                ? 'ring-4 ring-primary/10 border-primary shadow-2xl bg-white scale-[1.02]' 
                : 'hover:shadow-xl border-slate-200 hover:border-slate-300 bg-white'
        }`}
        onClick={() => onSelect(t.id)}
    >
        {selectedId === t.id && (
            <div className="absolute top-4 right-4 bg-primary text-white p-1 rounded-full z-20 shadow-lg animate-in zoom-in duration-300">
                <Check size={16} />
            </div>
        )}
        
        <CardContent className="p-0">
            {/* Preview Area (Scaled Down) */}
            <div className="h-72 overflow-hidden relative bg-slate-50 border-b border-slate-100 flex items-start justify-center">
                <div className="absolute inset-0 z-10 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center backdrop-blur-[2px]">
                    <Button 
                        variant="secondary" 
                        size="sm" 
                        onClick={(e) => {
                            e.stopPropagation();
                            onPreview(t.id);
                        }}
                        className="shadow-2xl bg-white text-slate-900 hover:bg-slate-50 transition-transform scale-90 group-hover:scale-100"
                    >
                        <ZoomIn size={16} className="mr-2" />
                        Quick Preview
                    </Button>
                </div>
                <div className="origin-top scale-[0.4] p-4 pointer-events-none transition-transform duration-500 group-hover:scale-[0.42]">
                    <TemplateRenderer content={SAMPLE_CONTENT as any} templateId={t.id} />
                </div>
            </div>
            
            <div className="p-5">
                <div className="flex justify-between items-start mb-3">
                    <div>
                        <h3 className="font-bold text-slate-900 group-hover:text-primary transition-colors">{t.name}</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.category}</p>
                    </div>
                    <div className="flex items-center gap-1 bg-green-50 text-green-700 px-2 py-0.5 rounded text-[10px] font-bold border border-green-100 shadow-sm">
                        <ShieldCheck size={12} />
                        ATS PRO
                    </div>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{t.description}</p>
            </div>
        </CardContent>
    </Card>
));

export const TemplateGallery = ({ templates, selectedId, onSelect }: Props) => {
    const [previewId, setPreviewId] = useState<string | null>(null);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {templates.map((t) => (
                    <TemplateCard 
                        key={t.id}
                        template={t}
                        selectedId={selectedId}
                        onSelect={onSelect}
                        onPreview={setPreviewId}
                    />
                ))}
            </div>

            {/* Expanded Modal Preview */}
            <AnimatePresence>
                {previewId && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
                            onClick={() => setPreviewId(null)}
                        />
                        <motion.div 
                            initial={{ y: 50, opacity: 0, scale: 0.95 }}
                            animate={{ y: 0, opacity: 1, scale: 1 }}
                            exit={{ y: 50, opacity: 0, scale: 0.95 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="relative w-full max-w-5xl h-[90vh] bg-white rounded-[2rem] shadow-2xl flex flex-col overflow-hidden"
                        >
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white z-10 shadow-sm">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                                        <Layout />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-slate-900 tracking-tight">
                                            {templates.find(t => t.id === previewId)?.name}
                                        </h2>
                                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                                            <span>Full Preview</span>
                                            <span className="text-slate-200">|</span>
                                            <span className="flex items-center gap-1 text-green-600">
                                                <ShieldCheck size={12} /> Optimized for ATS
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <Button variant="ghost" onClick={() => setPreviewId(null)} className="rounded-full h-12 w-12 p-0">
                                    ✕
                                </Button>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto bg-slate-100/50 p-8 md:p-16">
                                <div className="bg-white shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] mx-auto max-w-[800px] rounded-sm transform transition-transform">
                                    <TemplateRenderer content={SAMPLE_CONTENT as any} templateId={previewId} />
                                </div>
                            </div>
                            
                            <div className="p-8 border-t border-slate-100 flex justify-between items-center bg-white/80 backdrop-blur-md">
                                <p className="text-sm text-slate-500 font-medium max-w-sm">
                                    This template ensures your content is indexed correctly by all enterprise applicant tracking systems.
                                </p>
                                <div className="flex gap-4">
                                    <Button variant="outline" size="lg" onClick={() => setPreviewId(null)} className="rounded-xl px-8">
                                        Keep Looking
                                    </Button>
                                    <Button size="lg" onClick={() => {
                                        onSelect(previewId);
                                        setPreviewId(null);
                                    }} className="bg-primary hover:bg-primary-dark rounded-xl px-10 shadow-xl shadow-primary/20">
                                        Select Template
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

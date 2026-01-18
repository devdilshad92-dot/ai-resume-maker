import { useState } from 'react';
import { Card, CardContent } from '../ui/Card';
import { TemplateRenderer } from './TemplateRenderer';
import { Check, Layout, ZoomIn } from 'lucide-react';
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
    summary: "Dedicated Professional with 5+ years of experience in delivering high-impact solutions. Proven track record of optimizing workflows and leading cross-functional teams to success.",
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

export const TemplateGallery = ({ templates, selectedId, onSelect }: Props) => {
    const [previewId, setPreviewId] = useState<string | null>(null);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {templates.map((t) => (
                    <Card 
                        key={t.id}
                        className={`relative overflow-hidden cursor-pointer transition-all duration-300 group ${
                            selectedId === t.id 
                                ? 'ring-2 ring-primary border-primary shadow-xl bg-primary/5' 
                                : 'hover:shadow-lg border-slate-200'
                        }`}
                        onClick={() => onSelect(t.id)}
                    >
                        {selectedId === t.id && (
                            <div className="absolute top-2 right-2 bg-primary text-white p-1 rounded-full z-10">
                                <Check size={14} />
                            </div>
                        )}
                        
                        <CardContent className="p-0">
                            {/* Preview Area (Scaled Down) */}
                            <div className="h-64 overflow-hidden relative bg-slate-50 border-b border-slate-100">
                                <div className="absolute inset-0 z-10 bg-gradient-to-t from-white/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Button 
                                        variant="secondary" 
                                        size="sm" 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setPreviewId(t.id);
                                        }}
                                        className="shadow-xl"
                                    >
                                        <ZoomIn size={14} className="mr-2" />
                                        Zoom Preview
                                    </Button>
                                </div>
                                <div className="origin-top scale-[0.35] p-4 pointer-events-none">
                                    <TemplateRenderer content={SAMPLE_CONTENT as any} templateId={t.id} />
                                </div>
                            </div>
                            
                            <div className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-bold text-slate-900">{t.name}</h3>
                                    <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500 px-2 py-0.5 rounded">
                                        ATS Safe
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500 line-clamp-2">{t.description}</p>
                            </div>
                        </CardContent>
                    </Card>
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
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                            onClick={() => setPreviewId(null)}
                        />
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
                        >
                            <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <Layout className="text-primary" />
                                    <div>
                                        <h2 className="font-bold text-slate-900">{templates.find(t => t.id === previewId)?.name}</h2>
                                        <p className="text-xs text-slate-500">Full Preview with Sample Data</p>
                                    </div>
                                </div>
                                <Button variant="ghost" onClick={() => setPreviewId(null)}>Close</Button>
                            </div>
                            <div className="flex-1 overflow-y-auto bg-slate-50 p-12">
                                <div className="bg-white shadow-2xl mx-auto border border-slate-200">
                                    <TemplateRenderer content={SAMPLE_CONTENT as any} templateId={previewId} />
                                </div>
                            </div>
                            <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-white">
                                <Button variant="outline" onClick={() => setPreviewId(null)}>Cancel</Button>
                                <Button onClick={() => {
                                    onSelect(previewId);
                                    setPreviewId(null);
                                }}>Apply This Template</Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

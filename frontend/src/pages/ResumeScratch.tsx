import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
    ChevronRight, ChevronLeft, Sparkles, Plus,
    Briefcase, GraduationCap, Code, 
    FileText, Layout, CheckCircle2, AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { Navbar } from '../components/layout/Navbar';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ResumeResponse, Template } from '../types';

import { JobRoleAutocomplete } from '../components/ui/JobRoleAutocomplete';
import { TemplateGallery } from '../components/resume/TemplateGallery';

const ResumeScratch = () => {
    const navigate = useNavigate();
    const [page, setPage] = useState<'setup' | 'builder' | 'success'>('setup');
    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);
    const [resume, setResume] = useState<ResumeResponse | null>(null);
    const [templates, setTemplates] = useState<Template[]>([]);
    
    // Setup Data
    const [setupData, setSetupData] = useState({
        job_role: '',
        experience_level: 'Junior',
        industry: '',
        template_id: 'minimal-pro'
    });

    const [suggestions, setSuggestions] = useState<{suggestions: string[], tips: string[]}>({
        suggestions: [],
        tips: []
    });

    useEffect(() => {
        const fetchTemplates = async () => {
            try {
                const res = await api.get<Template[]>('resume/templates');
                setTemplates(res.data);
            } catch (err) {
                console.error("Failed to fetch templates");
            }
        };
        fetchTemplates();
    }, []);

    const handleCreateScratch = async () => {
        setLoading(true);
        try {
            const res = await api.post<ResumeResponse>('resume/scratch', setupData);
            setResume(res.data);
            setPage('builder');
        } catch (err) {
            alert("Failed to initialize resume builder");
        } finally {
            setLoading(false);
        }
    };

    const updateSection = async (sectionName: string, content: any) => {
        if (!resume) return;
        try {
            const res = await api.patch<ResumeResponse>(`resume/${resume.id}/update-section`, {
                section_name: sectionName,
                content: content
            });
            setResume(res.data);
        } catch (err) {
            console.error("Update failed");
        }
    };

    const getAiSuggestions = async (sectionName: string) => {
        if (!resume || !setupData.job_role) return;
        setAiLoading(true);
        try {
            const currentContent = resume.parsed_content?.[sectionName];
            const res = await api.post('resume/ai-assistant', {
                section_name: sectionName,
                current_content: currentContent,
                job_role: setupData.job_role,
                experience_level: setupData.experience_level,
                industry: setupData.industry
            });
            setSuggestions(res.data);
        } catch (err) {
            console.error("AI Assistant failed");
        } finally {
            setAiLoading(false);
        }
    };

    const sections = [
        { id: 'summary', name: 'Professional Summary', icon: FileText, type: 'text' },
        { id: 'skills', name: 'Core Skills', icon: Code, type: 'list' },
        { id: 'work_experience', name: 'Work Experience', icon: Briefcase, type: 'array' },
        { id: 'education', name: 'Education', icon: GraduationCap, type: 'array' },
        { id: 'projects', name: 'Key Projects', icon: Layout, type: 'array' }
    ];

    if (page === 'setup') {
        return (
            <div className="min-h-screen bg-slate-50">
                <Navbar />
                <main className="mx-auto max-w-5xl px-4 py-16">
                    <div className="text-center mb-12">
                        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
                            Build Your Dream Resume 
                        </h1>
                        <p className="text-lg text-slate-500 max-w-2xl mx-auto">
                            Answer 3 quick questions and let our AI handle the formatting and keyword optimization.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Side: Setup Questions */}
                        <div className="lg:col-span-1">
                            <Card className="p-8 shadow-xl border-slate-100">
                                <div className="space-y-8">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">Target Job Role</label>
                                        <JobRoleAutocomplete 
                                            value={setupData.job_role} 
                                            onChange={val => setSetupData({...setupData, job_role: val})}
                                            placeholder="e.g. Senior Software Engineer"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">Experience Level</label>
                                        <select 
                                            className="w-full p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white transition-all"
                                            value={setupData.experience_level}
                                            onChange={e => setSetupData({...setupData, experience_level: e.target.value})}
                                        >
                                            <option>Fresher</option>
                                            <option>Junior</option>
                                            <option>Mid</option>
                                            <option>Senior</option>
                                            <option>Lead</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">Industry</label>
                                        <select 
                                            className="w-full p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white transition-all font-medium text-slate-900"
                                            value={setupData.industry}
                                            onChange={e => setSetupData({...setupData, industry: e.target.value})}
                                        >
                                            <option value="">Select Industry</option>
                                            <option>Technology</option>
                                            <option>Fintech & Finance</option>
                                            <option>Healthcare & Pharma</option>
                                            <option>E-commerce & Retail</option>
                                            <option>Education & EdTech</option>
                                            <option>Marketing & Advertising</option>
                                            <option>Real Estate</option>
                                            <option>Manufacturing</option>
                                            <option>Logistics & Supply Chain</option>
                                            <option>Energy & Utilities</option>
                                            <option>Entertainment & Media</option>
                                            <option>Hospitality & Travel</option>
                                            <option>Non-Profit</option>
                                            <option>Other</option>
                                        </select>
                                    </div>

                                    <div className="pt-4">
                                        <Button 
                                            size="lg" 
                                            onClick={handleCreateScratch} 
                                            disabled={!setupData.job_role || loading}
                                            className="w-full h-14 rounded-xl shadow-xl shadow-indigo-600/20 bg-indigo-600"
                                        >
                                            {loading ? 'Initializing...' : 'Start Building'}
                                            <ChevronRight className="ml-2" />
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        {/* Right Side: Template Gallery */}
                        <div className="lg:col-span-2">
                             <div className="mb-4 flex items-center justify-between">
                                <h2 className="font-bold text-slate-900 text-lg">Pick Your Style</h2>
                                <span className="text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                                    {templates.length} Templates Available
                                </span>
                             </div>
                             <TemplateGallery 
                                templates={templates} 
                                selectedId={setupData.template_id}
                                onSelect={id => setSetupData({...setupData, template_id: id})}
                             />
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    const currentSection = sections[step];

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <Navbar />
            
            <div className="flex-1 flex overflow-hidden">
                {/* Left Sidebar: Navigation */}
                <div className="w-80 bg-white border-r border-slate-200 flex flex-col">
                    <div className="p-6 border-b border-slate-100">
                        <h2 className="font-bold text-slate-900">Resume Sections</h2>
                        <p className="text-xs text-slate-500">Incomplete sections are marked in gray</p>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {sections.map((s, i) => (
                            <button
                                key={s.id}
                                onClick={() => setStep(i)}
                                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                                    step === i 
                                        ? 'bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-200' 
                                        : 'text-slate-500 hover:bg-slate-50'
                                }`}
                            >
                                <div className={`p-2 rounded-md ${step === i ? 'bg-white shadow-sm' : 'bg-slate-100'}`}>
                                    <s.icon size={18} />
                                </div>
                                <span className="text-sm font-semibold">{s.name}</span>
                                {resume?.parsed_content?.[s.id]?.length > 0 && <CheckCircle2 size={16} className="ml-auto text-green-500" />}
                            </button>
                        ))}
                    </div>
                    <div className="p-6 border-t border-slate-100 bg-slate-50/50">
                        <Button variant="outline" className="w-full bg-white" onClick={() => navigate('/dashboard')}>
                            Save Draft
                        </Button>
                    </div>
                </div>

                {/* Center: Editor */}
                <div className="flex-1 overflow-y-auto bg-white">
                    <div className="max-w-3xl mx-auto px-8 py-12">
                        <div className="mb-10 flex justify-between items-center">
                            <div>
                                <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-2 block">Step {step + 1} of 5</span>
                                <h1 className="text-3xl font-bold text-slate-900">{currentSection.name}</h1>
                            </div>
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => getAiSuggestions(currentSection.id)}
                                disabled={aiLoading}
                                className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 font-bold"
                            >
                                <Sparkles size={16} className="mr-2" />
                                {aiLoading ? 'Thinking...' : 'AI Assist'}
                            </Button>
                        </div>

                        {/* Summary Editor */}
                        {currentSection.id === 'summary' && (
                            <div className="space-y-6">
                                <textarea 
                                    className="w-full h-64 p-6 rounded-2xl border-2 border-slate-100 bg-slate-50 focus:bg-white focus:border-indigo-500 outline-none transition-all text-lg leading-relaxed shadow-inner"
                                    placeholder="Write a brief professional overview..."
                                    value={resume?.parsed_content?.summary || ''}
                                    onChange={e => updateSection('summary', e.target.value)}
                                />
                                <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex gap-3 text-sm text-amber-800 italic">
                                    <AlertCircle size={18} className="shrink-0" />
                                    Tip: Mention your most relevant achievement from the last year here.
                                </div>
                            </div>
                        )}

                        {/* Array/List editors would go here - simplified for this demo step */}
                        {currentSection.id !== 'summary' && (
                            <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-2xl">
                                <p className="text-slate-400 mb-4">Section Editor for <b>{currentSection.name}</b></p>
                                <Button variant="outline" onClick={() => updateSection(currentSection.id, ["Sample Item"])}>
                                    Initialize Section
                                </Button>
                            </div>
                        )}

                        {/* Floating AI Suggestions */}
                        {suggestions.suggestions.length > 0 && (
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-12 p-8 bg-slate-900 rounded-3xl text-white shadow-2xl"
                            >
                                <div className="flex items-center gap-2 mb-6">
                                    <Sparkles className="text-indigo-400" size={20} />
                                    <h3 className="font-bold">AI Recommended Phrases</h3>
                                </div>
                                <div className="grid gap-4">
                                    {suggestions.suggestions.map((s, i) => (
                                        <button 
                                            key={i}
                                            className="text-left p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group relative"
                                            onClick={() => {
                                                if(currentSection.id === 'summary') {
                                                    const current = resume?.parsed_content?.summary || '';
                                                    updateSection('summary', current + " " + s);
                                                }
                                            }}
                                        >
                                            <p className="text-sm pr-8">{s}</p>
                                            <Plus className="absolute right-4 top-4 text-white/20 group-hover:text-white transition-colors" size={16} />
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        <div className="fixed bottom-10 right-10 flex gap-4">
                            {step > 0 && (
                                <Button variant="outline" onClick={() => setStep(step - 1)} className="bg-white px-8 h-12 rounded-full shadow-xl">
                                    <ChevronLeft className="mr-2" /> Previous
                                </Button>
                            )}
                            <Button onClick={() => step < 4 ? setStep(step + 1) : navigate('/dashboard')} className="px-10 h-12 rounded-full shadow-xl shadow-primary/20 bg-indigo-600">
                                {step === 4 ? 'Finalize Resume' : 'Save & Continue'}
                                <ChevronRight className="ml-2" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Right: Preview Rail */}
                <div className="w-1/3 bg-slate-100 flex flex-col p-8 overflow-hidden">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-slate-600 text-sm uppercase tracking-widest">Live Preview</h3>
                        <div className="flex gap-1">
                             <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                             <span className="text-[10px] font-bold text-slate-400 uppercase">Saving...</span>
                        </div>
                    </div>
                    <div className="flex-1 bg-white shadow-2xl rounded-sm border border-slate-200 overflow-y-auto p-8 origin-top scale-[0.85] w-[117%] -translate-x-[8%]">
                         {/* Minimal Preview Mockup */}
                         <div className="max-w-2xl mx-auto space-y-6 text-slate-800">
                            <div className="text-center border-b pb-4">
                                <h1 className="text-2xl font-bold uppercase">{resume?.parsed_content?.full_name || 'Your Name'}</h1>
                                <p className="text-xs text-slate-500 mt-1">{resume?.parsed_content?.contact_info?.email}</p>
                            </div>
                            
                            <section>
                                <h4 className="text-[10px] font-bold border-b mb-2 uppercase tracking-widest text-slate-400">Professional Summary</h4>
                                <p className="text-[11px] leading-relaxed italic">{resume?.parsed_content?.summary || 'No summary yet...'}</p>
                            </section>

                            <section>
                                <h4 className="text-[10px] font-bold border-b mb-2 uppercase tracking-widest text-slate-400">Core Competencies</h4>
                                <div className="flex flex-wrap gap-1">
                                    {resume?.parsed_content?.skills?.map((s: string, i: number) => (
                                        <span key={i} className="text-[9px] bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">{s}</span>
                                    ))}
                                </div>
                            </section>

                            <div className="text-center mt-20">
                                <Layout className="mx-auto text-slate-200 mb-2" size={32} />
                                <p className="text-[10px] text-slate-300">More sections will appear as you type</p>
                            </div>
                         </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResumeScratch;

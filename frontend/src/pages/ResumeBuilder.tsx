import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Loader2, Check, ChevronRight, Briefcase, Zap, FileText } from 'lucide-react';
import api from '../api/client';
import { Navbar } from '../components/layout/Navbar';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { ATSScoreView } from '../components/resume/ATSScoreView';
import { Resume, JobDescription, Application } from '../types';

const ResumeBuilder = () => {
    const [step, setStep] = useState(1);
    const [file, setFile] = useState<File | null>(null);
    const [resumeData, setResumeData] = useState<Resume | null>(null);
    const [jobDesc, setJobDesc] = useState('');
    const [jobData, setJobData] = useState<JobDescription | null>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<Application | null>(null);
    const [progress, setProgress] = useState(0);
    
    // Polling Ref to avoid stale closures or memory leaks
    const pollIdRef = useRef<number | null>(null);
    const activeAppIdRef = useRef<number | null>(null);

    // Cleanup polling on unmount
    useEffect(() => {
        return () => {
             // Use window.clearInterval to avoid NodeJS type confusion
            if (pollIdRef.current) window.clearInterval(pollIdRef.current);
        };
    }, []);

    // Simulate progress bar visual
    useEffect(() => {
        let interval: number; // Browser based interval
        if (loading && step === 3) {
            setProgress(0);
            interval = window.setInterval(() => {
                setProgress(prev => (prev < 90 ? prev + 5 : prev)); 
            }, 800);
        } else {
            setProgress(100);
        }
        return () => window.clearInterval(interval);
    }, [loading, step]);

    const pollApplicationStatus = useCallback(async (appId: number) => {
        activeAppIdRef.current = appId;
        
        pollIdRef.current = window.setInterval(async () => {
             try {
                const appRes = await api.get<Application>(`/resume/application/${appId}`);
                const appData = appRes.data;
                
                if (appData.status === 'completed') {
                    if (pollIdRef.current) clearInterval(pollIdRef.current);
                    
                    // Parse JSON content if it's a string
                    if (typeof appData.generated_content === 'string') {
                        try {
                            appData.generated_content = JSON.parse(appData.generated_content);
                        } catch (e) {
                            console.error("JSON Parse error", e);
                        }
                    }
                    
                    setResult(appData);
                    setLoading(false);
                    setStep(4);
                } else if (appData.status === 'failed') {
                    if (pollIdRef.current) clearInterval(pollIdRef.current);
                    setLoading(false);
                    alert("Resume generation failed on server. Please try again.");
                }
            } catch (err) {
                console.error("Polling error", err);
                // Optionally handle max retries here
            }
        }, 2000);
    }, []);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return;
        setLoading(true);
        const f = e.target.files[0];
        setFile(f);
        
        const formData = new FormData();
        formData.append('file', f);
        
        try {
            const res = await api.post<Resume>('/resume/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setResumeData(res.data);
            setLoading(false);
            setStep(2);
        } catch (err) {
            console.error(err);
            setLoading(false);
            alert("Upload failed. Please ensure file is valid.");
            setFile(null);
        }
    };

    const submitJob = async () => {
        if (!jobDesc) return;
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('text_content', jobDesc);
            formData.append('position', 'Target Role'); 
            formData.append('company', 'Target Company');
            
            const res = await api.post<JobDescription>('/resume/job', formData);
            setJobData(res.data);
            setLoading(false);
            setStep(3);
        } catch (err) {
            setLoading(false);
            alert("Job submission failed");
        }
    };

    const generateResume = async () => {
        if (!resumeData || !jobData) return;
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('resume_id', String(resumeData.id));
            formData.append('job_id', String(jobData.id));
            
            const res = await api.post<Application>('/resume/generate', formData);
            const appId = res.data.id;
            
            // Start polling
            pollApplicationStatus(appId);
            
        } catch (err) {
            setLoading(false);
            alert("Failed to start generation.");
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
            <Navbar />
            
            <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
                {/* Stepper */}
                <div className="mb-12">
                    <div className="flex justify-between items-center max-w-2xl mx-auto relative">
                        {/* Connecting Line */}
                        <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-200 -z-10 -translate-y-1/2 rounded-full"></div>
                        <div className="absolute top-1/2 left-0 h-1 bg-primary -z-10 -translate-y-1/2 rounded-full transition-all duration-500" style={{ width: `${((step - 1) / 3) * 100}%` }}></div>
                        
                        {[1, 2, 3, 4].map((s) => (
                            <div key={s} className="flex flex-col items-center bg-slate-50 px-2 group">
                                <div 
                                    className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                                        step >= s 
                                            ? 'border-primary bg-primary text-white shadow-lg shadow-primary/30 scale-110' 
                                            : 'border-slate-300 bg-white text-slate-400 group-hover:border-slate-400'
                                    }`}
                                >
                                    {step > s ? <Check size={20} /> : <span className="text-sm font-bold">{s}</span>}
                                </div>
                                <span className={`mt-2 text-xs font-semibold uppercase tracking-wide transition-colors ${step >= s ? 'text-primary' : 'text-slate-400'}`}>
                                    {['Upload', 'Target', 'Generate', 'Result'][s-1]}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="relative mx-auto">
                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div 
                                key="step1"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="mx-auto max-w-xl"
                            >
                                <Card className="p-8 shadow-2xl border-0 ring-1 ring-slate-100">
                                    <div className="text-center mb-8">
                                        <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">Upload Resume</h2>
                                        <p className="text-slate-500">Supported formats: PDF, DOCX (Max 5MB)</p>
                                    </div>
                                    
                                    <label className={`relative group flex flex-col items-center justify-center w-full h-80 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300 ${loading ? 'opacity-50 pointer-events-none' : 'hover:border-primary/50 hover:bg-slate-50 border-slate-300'}`}>
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                                            <div className="bg-primary/5 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform duration-300">
                                                {loading ? <Loader2 className="w-10 h-10 text-primary animate-spin" /> : <Upload className="w-10 h-10 text-primary" />}
                                            </div>
                                            <p className="mb-2 text-lg font-semibold text-slate-700">
                                                {file ? file.name : "Click to upload or drag and drop"}
                                            </p>
                                            <p className="text-sm text-slate-500">
                                                {file ? "File selected" : "Get started with your existing CV"}
                                            </p>
                                        </div>
                                        <input type="file" className="hidden" onChange={handleFileUpload} accept=".pdf,.docx" disabled={loading} />
                                    </label>
                                </Card>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div 
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="mx-auto max-w-2xl"
                            >
                                <Card className="p-8 shadow-xl border-0">
                                    <div className="mb-6">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                                                <Briefcase size={24} />
                                            </div>
                                            <h2 className="text-2xl font-bold text-slate-900">Target Job Details</h2>
                                        </div>
                                        <p className="text-slate-600">Paste the full job description. The AI will analyze keywords and requirements.</p>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="relative">
                                            <textarea 
                                                className="w-full h-80 p-5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none transition-all outline-none font-mono text-sm leading-relaxed"
                                                placeholder="Paste Job Description here..."
                                                value={jobDesc}
                                                onChange={(e) => setJobDesc(e.target.value)}
                                            />
                                            <div className="absolute bottom-4 right-4 text-xs text-slate-400 bg-white px-2 py-1 rounded-md shadow-sm border border-slate-100">
                                                {jobDesc.length} chars
                                            </div>
                                        </div>
                                        
                                        <div className="flex justify-between items-center pt-4">
                                            <Button variant="ghost" onClick={() => setStep(1)}>
                                                Back
                                            </Button>
                                            <Button 
                                                onClick={submitJob} 
                                                disabled={loading || !jobDesc}
                                                size="lg"
                                                className="shadow-lg shadow-primary/20"
                                            >
                                                {loading && <Loader2 className="animate-spin mr-2 h-4 w-4"/>}
                                                Analyze & Next
                                                <ChevronRight className="ml-2 h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div 
                                key="step3"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="mx-auto max-w-xl text-center py-12"
                            >
                                <div className="mb-8 relative inline-flex">
                                     <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full animate-pulse"></div>
                                     <div className="relative bg-white p-6 rounded-full shadow-xl">
                                         <Loader2 className="w-16 h-16 text-primary animate-spin" />
                                     </div>
                                </div>
                                
                                <h2 className="text-3xl font-bold text-slate-900 mb-4">Crafting Your Masterpiece</h2>
                                <p className="text-lg text-slate-500 mb-8 max-w-md mx-auto">
                                    Our AI is analyzing the job description, extracting keywords, and optimizing your resume bullet points.
                                </p>

                                <div className="w-full max-w-md mx-auto bg-slate-200 rounded-full h-2.5 overflow-hidden">
                                    <div 
                                        className="bg-primary h-2.5 rounded-full transition-all duration-500 ease-out" 
                                        style={{ width: `${progress}%` }}
                                    ></div>
                                </div>

                                <div className="mt-12">
                                     {/* Just a large button to trigger if user lands here manually, but usually auto-triggered or state-based */}
                                    {!loading && (
                                        <Button onClick={generateResume} size="lg" className="px-8 text-lg h-14 rounded-full shadow-primary/25 shadow-xl">
                                           Start Generation
                                        </Button>
                                    )}
                                     {loading && (
                                        <p className="text-sm text-slate-400 mt-4 animate-pulse">This usually takes about 20-30 seconds...</p>
                                     )}
                                </div>
                                <div className="hidden">{/* Trigger generation immediately if entering this step directly via state flow */}
                                    {step === 3 && !loading && !result && <span ref={() => generateResume()}></span>}
                                </div>
                            </motion.div>
                        )}

                        {step === 4 && result && (
                            <motion.div 
                                key="step4"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-12rem)]"
                            >
                                {/* Left: Preview */}
                                <div className="lg:col-span-8 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden flex flex-col h-full">
                                    <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                        <h3 className="font-semibold text-slate-700">Resume Preview</h3>
                                        <div className="flex gap-2">
                                            <Button variant="outline" size="sm">Download PDF</Button>
                                            <Button variant="outline" size="sm" className="opacity-75 cursor-not-allowed text-slate-500 bg-slate-50" title="Pro Feature">
                                                <Zap className="h-3 w-3 mr-1 text-slate-400" />
                                                DOCX <span className="ml-1 text-[10px] uppercase font-bold tracking-wider bg-slate-200 text-slate-600 px-1 rounded">Pro</span>
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
                                        <div className="bg-white shadow-sm min-h-[1000px] w-full max-w-[800px] mx-auto p-12 ats-preview border border-slate-100">
                                            {/* Render JSON as Clean HTML Resume */}
                                            {result.generated_content && typeof result.generated_content === 'object' && (
                                                <div className="space-y-6">
                                                    <div className="text-center border-b pb-6">
                                                        <h1 className="text-3xl font-bold uppercase tracking-wide text-slate-900">{(result.generated_content as any).full_name || "Your Name"}</h1>
                                                        <div className="flex justify-center gap-4 mt-2 text-sm text-slate-600">
                                                             <span>{(result.generated_content as any).contact_info?.email || "email@example.com"}</span>
                                                        </div>
                                                    </div>
                                                    
                                                    <section>
                                                        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 border-b border-slate-300 pb-1 mb-3">Professional Summary</h3>
                                                        <p className="text-sm text-slate-800 leading-relaxed">{(result.generated_content as any).summary}</p>
                                                    </section>

                                                    <section>
                                                        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 border-b border-slate-300 pb-1 mb-3">Work Experience</h3>
                                                        <div className="space-y-4">
                                                            {(result.generated_content as any).work_experience?.map((job: any, i: number) => (
                                                                <div key={i}>
                                                                    <div className="flex justify-between items-baseline mb-1">
                                                                        <h4 className="font-bold text-slate-900">{job.role}</h4>
                                                                        <span className="text-sm text-slate-600 font-medium">{job.duration}</span>
                                                                    </div>
                                                                    <div className="text-sm text-slate-700 font-medium mb-2">{job.company}</div>
                                                                    <ul className="list-disc list-outside ml-4 space-y-1 text-sm text-slate-700">
                                                                        {job.points?.map((pt: string, j: number) => (
                                                                            <li key={j}>{pt}</li>
                                                                        ))}
                                                                    </ul>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </section>
                                                    
                                                     <section>
                                                        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 border-b border-slate-300 pb-1 mb-3">Skills</h3>
                                                        <div className="flex flex-wrap gap-2">
                                                            {(result.generated_content as any).skills?.map((skill: string, i: number) => (
                                                                <span key={i} className="text-sm text-slate-800 bg-slate-100 px-2 py-1 rounded">{skill}</span>
                                                            ))}
                                                        </div>
                                                    </section>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Right: Feedback */}
                                <div className="lg:col-span-4 space-y-6 h-full overflow-y-auto pr-1">
                                    <ATSScoreView score={result.ats_score || 0} feedback={result.ats_feedback} />
                                    
                                    <Card className="border-slate-200 shadow-sm relative overflow-hidden group">
                                         <div className="absolute inset-0 bg-slate-100/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
                                                <div className="bg-white px-4 py-2 rounded-full shadow-lg border border-slate-200 flex items-center gap-2">
                                                    <Zap size={14} className="fill-amber-400 text-amber-500" />
                                                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">Premium Feature</span>
                                                </div>
                                         </div>
                                         <CardContent className="p-6 opacity-40">
                                            <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                                                <FileText size={18} /> AI Cover Letter
                                            </h3>
                                            <p className="text-sm text-slate-600 mb-4">Automatically generate a tailored cover letter for this job application.</p>
                                            <Button variant="outline" className="w-full" size="sm">Generate Letter</Button>
                                         </CardContent>
                                    </Card>

                                    <Card className="bg-gradient-to-br from-indigo-600 to-purple-700 cursor-pointer hover:shadow-xl hover:shadow-indigo-500/20 transition-all duration-300 border-0 text-white shadow-lg relative overflow-hidden">
                                        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                                        <CardContent className="p-6 relative z-10">
                                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/50 border border-indigo-400/50 text-[10px] uppercase font-bold tracking-wider mb-4 text-white">
                                                <Zap size={10} className="fill-white" />
                                                Launch Offer
                                            </div>
                                            <h3 className="font-bold text-lg mb-2">Upgrade to Pro</h3>
                                            <p className="text-indigo-100 text-sm mb-4">Get unlimited AI generations, premium templates, and LinkedIn optimization.</p>
                                            <Button variant="secondary" className="w-full bg-white text-indigo-600 hover:bg-slate-50 border-0 font-bold">
                                                Unlock Everything
                                            </Button>
                                        </CardContent>
                                    </Card>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
};

export default ResumeBuilder;

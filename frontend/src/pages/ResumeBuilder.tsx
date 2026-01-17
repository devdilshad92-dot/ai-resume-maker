import { useState } from 'react';
import api from '../api/client';
import { motion } from 'framer-motion';
import { Upload, FileText, Check, Loader2, ArrowRight } from 'lucide-react';

const ResumeBuilder = () => {
    const [step, setStep] = useState(1);
    const [file, setFile] = useState<File | null>(null);
    const [resumeData, setResumeData] = useState<any>(null); // From upload
    const [jobDesc, setJobDesc] = useState('');
    const [jobData, setJobData] = useState<any>(null); // From job submit
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null); // Final application result

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return;
        setLoading(true);
        const f = e.target.files[0];
        setFile(f);
        
        const formData = new FormData();
        formData.append('file', f);
        
        try {
            const res = await api.post('/resume/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setResumeData(res.data);
            setLoading(false);
            setStep(2);
        } catch (err) {
            console.error(err);
            setLoading(false);
            alert("Upload failed");
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
            
            const res = await api.post('/resume/job', formData);
            setJobData(res.data);
            setLoading(false);
            setStep(3);
        } catch (err) {
            setLoading(false);
            alert("Job submission failed");
        }
    };

    const generateResume = async () => {
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('resume_id', resumeData.id);
            formData.append('job_id', jobData.id);
            
            // 1. Kick off generation
            const res = await api.post('/resume/generate', formData);
            const appId = res.data.id;
            
            // 2. Poll for status
            const pollInterval = setInterval(async () => {
                try {
                    const appRes = await api.get(`/resume/application/${appId}`);
                    const appData = appRes.data;
                    
                    if (appData.status === 'completed') {
                        clearInterval(pollInterval);
                        
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
                        clearInterval(pollInterval);
                        setLoading(false);
                        alert("Resume generation failed. Please try again.");
                    }
                } catch (err) {
                    // Ignore transient errors
                    console.error("Polling error", err);
                }
            }, 2000); // Check every 2 seconds
            
        } catch (err) {
            setLoading(false);
            console.error(err);
            alert("Generation failed to start");
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                {/* Progress Steps */}
                <div className="mb-8 flex justify-center">
                   <div className="flex items-center space-x-4">
                        {[1, 2, 3, 4].map((s) => (
                            <div key={s} className={`flex items-center justify-center w-10 h-10 rounded-full font-bold transition-all ${step >= s ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                                {step > s ? <Check className="w-6 h-6" /> : s}
                            </div>
                        ))}
                   </div>
                </div>

                <div className="bg-white shadow-2xl rounded-3xl overflow-hidden min-h-[500px] p-8">
                    {step === 1 && (
                        <div className="flex flex-col items-center justify-center h-full py-20">
                            <h2 className="text-2xl font-bold mb-6">Upload your Resume</h2>
                            <label className="flex flex-col items-center justify-center w-full max-w-lg h-64 border-2 border-dashed border-indigo-300 rounded-xl cursor-pointer bg-indigo-50 hover:bg-indigo-100 transition">
                                {loading ? <Loader2 className="animate-spin w-12 h-12 text-indigo-600" /> : <Upload className="w-12 h-12 text-indigo-500 mb-2" />}
                                <span className="text-indigo-600 font-medium">{loading ? "Processing..." : "Click to upload (PDF/DOCX)"}</span>
                                <input type="file" className="hidden" onChange={handleFileUpload} accept=".pdf,.docx" disabled={loading} />
                            </label>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="flex flex-col h-full">
                            <h2 className="text-2xl font-bold mb-4">Paste Job Description</h2>
                            <textarea 
                                className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none mb-4"
                                placeholder="Paste the full job description here..."
                                value={jobDesc}
                                onChange={(e) => setJobDesc(e.target.value)}
                            />
                            <div className="flex justify-end">
                                <button 
                                    onClick={submitJob}
                                    disabled={loading || !jobDesc}
                                    className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center"
                                >
                                    {loading && <Loader2 className="animate-spin mr-2 w-4 h-4"/>}
                                    Next Step
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="flex flex-col items-center justify-center h-full py-20 text-center">
                            <h2 className="text-3xl font-bold mb-4">Ready to Generate</h2>
                             <p className="text-gray-600 mb-8 max-w-lg">
                                We have your resume and the job description. Our AI will now analyze and rewrite your resume to match the role perfectly.
                            </p>
                            <button 
                                onClick={generateResume}
                                disabled={loading}
                                className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full text-xl font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition flex items-center"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="animate-spin mr-3 w-6 h-6"/> Generating...
                                    </>
                                ) : (
                                    <>
                                        Generate Magic Resume <ArrowRight className="ml-2 w-6 h-6"/>
                                    </>
                                )}
                            </button>
                        </div>
                    )}

                    {step === 4 && result && (
                        <div className="flex flex-col h-full">
                            <div className="flex justify-between items-center mb-6 border-b pb-4">
                                <h2 className="text-2xl font-bold text-gray-800">Result</h2>
                                <div className="flex items-center bg-green-100 text-green-800 px-4 py-2 rounded-full font-bold text-lg">
                                    ATS Score: {result.ats_score}/100
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full overflow-hidden">
                                <div className="overflow-y-auto max-h-[600px] border p-4 rounded-lg bg-gray-50">
                                    <h3 className="font-bold mb-2 text-indigo-600">Generated Resume Content (JSON/Raw)</h3>
                                    <pre className="whitespace-pre-wrap text-xs bg-white p-2 rounded border border-gray-200">
                                        {/* Ideally parse this JSON and render a nice resume preview */}
                                        {result.generated_content} 
                                    </pre>
                                </div>
                                <div className="overflow-y-auto max-h-[600px]">
                                    <h3 className="font-bold mb-4 text-indigo-600">ATS Feedback</h3>
                                    <div className="space-y-4">
                                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                                            <h4 className="font-semibold text-blue-800">Feedback</h4>
                                            <ul className="list-disc pl-5 mt-2 space-y-1 text-sm text-blue-700">
                                               {/* Basic rendering of feedback JSON if possible, simplified here */}
                                               {JSON.stringify(result.ats_feedback, null, 2)}
                                            </ul>
                                        </div>
                                    </div>
                                    <div className="mt-6">
                                        <button className="w-full py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800">
                                            Export to PDF
                                        </button>
                                         <button className="w-full py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 mt-3">
                                            Export to DOCX
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ResumeBuilder;

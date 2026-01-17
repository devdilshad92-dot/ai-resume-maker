import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, Plus, Upload, CheckCircle } from 'lucide-react';

const Dashboard = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Navbar */}
            <nav className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <FileText className="h-8 w-8 text-indigo-600" />
                            <span className="ml-2 text-xl font-bold text-gray-900">AI Resume Maker</span>
                        </div>
                        <div className="flex items-center">
                            <button 
                                onClick={() => { localStorage.removeItem('token'); navigate('/login'); }}
                                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
                        Create your perfect resume with AI
                    </h1>
                    <p className="mt-5 max-w-xl mx-auto text-xl text-gray-500">
                        Upload your existing resume, paste a job description, and let our AI tailor it to perfection.
                    </p>
                    <div className="mt-8">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => navigate('/builder')}
                            className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-full text-white bg-indigo-600 hover:bg-indigo-700 md:py-4 md:text-lg shadow-lg"
                        >
                            <Plus className="mr-2 h-5 w-5" />
                            Start New Resume
                        </motion.button>
                    </div>
                </div>
                
                {/* Visual Steps */}
                <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                    <StepCard 
                        icon={<Upload className="h-8 w-8 text-indigo-500"/>}
                        title="1. Upload Resume"
                        desc="Upload your current CV in PDF or DOCX format."
                    />
                    <StepCard 
                        icon={<FileText className="h-8 w-8 text-indigo-500"/>}
                        title="2. Add Job Description"
                        desc="Paste the job description you are applying for."
                    />
                    <StepCard 
                        icon={<CheckCircle className="h-8 w-8 text-indigo-500"/>}
                        title="3. Get Tailored CV"
                        desc="Receive an ATS-optimized resume in seconds."
                    />
                </div>
            </main>
        </div>
    );
};

const StepCard = ({icon, title, desc}: {icon: any, title: string, desc: string}) => (
    <div className="bg-white overflow-hidden shadow rounded-lg p-6 text-center hover:shadow-xl transition-shadow duration-300">
        <div className="flex justify-center mb-4 bg-indigo-50 p-3 rounded-full w-16 h-16 mx-auto items-center">
            {icon}
        </div>
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        <p className="mt-2 text-base text-gray-500">{desc}</p>
    </div>
);

export default Dashboard;

import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { FileText, Plus, ArrowRight, Zap, Target, Layout } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';

const Dashboard = () => {
    const navigate = useNavigate();

    const stats = [
        { label: "Resumes Created", value: "3" },
        { label: "Jobs Applied", value: "12" },
        { label: "Avg ATS Score", value: "78" },
    ];

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            <Navbar />

            <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
                {/* Hero Section */}
                <div className="mb-12 flex flex-col md:flex-row justify-between items-end gap-6">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                            Dashboard
                        </h1>
                        <p className="mt-2 text-lg text-slate-500">
                            Manage your resumes and track your job applications.
                        </p>
                    </div>
                    <Button 
                        size="lg" 
                        onClick={() => navigate('/builder')} 
                        className="shadow-lg shadow-primary/25"
                    >
                        <Plus className="mr-2 h-5 w-5" />
                        Create New Resume
                    </Button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 mb-10">
                    {stats.map((stat, i) => (
                        <Card key={i} className="border-0 shadow-sm ring-1 ring-slate-100">
                            <CardContent className="p-6">
                                <dt className="truncate text-sm font-medium text-slate-500">{stat.label}</dt>
                                <dd className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{stat.value}</dd>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Features / Empty State */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 mb-4">Recent Resumes</h2>
                        <div className="space-y-4">
                            {/* Empty State / First Time User Experience */}
                            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                                <div className="mx-auto h-16 w-16 rounded-full bg-indigo-50 flex items-center justify-center mb-4">
                                    <Target className="h-8 w-8 text-indigo-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-slate-900 mb-2">You haven't built a resume yet</h3>
                                <p className="text-slate-500 mb-6 max-w-sm mx-auto">
                                    Candidates who use our AI templates are <strong>3x more likely</strong> to pass ATS checks.
                                </p>
                                <Button size="lg" onClick={() => navigate('/builder')} className="shadow-xl shadow-primary/20 w-full sm:w-auto">
                                    <Plus className="mr-2 h-5 w-5" />
                                    Build Your First Resume
                                </Button>
                                <p className="mt-4 text-xs text-slate-400">Takes less than 2 minutes</p>
                            </div>

                            {/* Social Proof Banner */}
                            <div className="pt-8 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
                                <p className="text-center text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">
                                    Trusted by candidates at
                                </p>
                                <div className="flex justify-center gap-8 items-center">
                                     {/* Simple Text Logos for Demo */}
                                    <span className="font-bold text-slate-600 text-lg">Google</span>
                                    <span className="font-bold text-slate-600 text-lg">Amazon</span>
                                    <span className="font-bold text-slate-600 text-lg">Netflix</span>
                                    <span className="font-bold text-slate-600 text-lg">Uber</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h2 className="text-xl font-bold text-slate-900 mb-4">Why ResumeAI?</h2>
                        <div className="grid gap-4">
                            {[
                                { icon: Zap, title: "Instant Optimization", desc: "Our AI rewrites your bullets in seconds." },
                                { icon: Target, title: "ATS Friendly", desc: "Guaranteed to pass Applicant Tracking Systems." },
                                { icon: Layout, title: "Professional Templates", desc: "Clean, modern, and recruiter-approved layouts." }
                            ].map((item, i) => (
                                <Card key={i} className="border-slate-100 bg-white shadow-sm">
                                    <CardContent className="flex items-start gap-4 p-5">
                                        <div className="rounded-md bg-indigo-50 p-2 text-primary">
                                            <item.icon size={20} />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-slate-900">{item.title}</h3>
                                            <p className="text-sm text-slate-500 mt-1">{item.desc}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;

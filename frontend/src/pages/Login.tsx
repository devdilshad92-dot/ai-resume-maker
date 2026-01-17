import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../api/client';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { FileText } from 'lucide-react';
import { Card } from '../components/ui/Card';

const Login = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            if (isLogin) {
                const formData = new FormData();
                formData.append('username', email);
                formData.append('password', password);
                const res = await api.post('/auth/login', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                localStorage.setItem('token', res.data.access_token);
                navigate('/');
            } else {
                await api.post('/auth/signup', { email, password, full_name: fullName });
                setIsLogin(true); // Switch to login after signup
                setError('');
                alert("Account created successfully. Please login.");
            }
        } catch (err: any) {
            setError(err.response?.data?.detail || 'An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
            <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-[400px]"
            >
                <div className="flex flex-col items-center mb-8">
                     <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white mb-4 shadow-lg shadow-primary/30">
                        <FileText size={28} className="stroke-[2.5]" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900">ResumeAI</h1>
                    <p className="text-slate-500">Build your career, faster.</p>
                </div>

                <Card className="p-8 shadow-xl border-slate-200">
                    <h2 className="text-xl font-bold text-slate-900 mb-6 text-center">
                        {isLogin ? 'Welcome back' : 'Create your account'}
                    </h2>

                    {error && <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-md text-sm font-medium">{error}</div>}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {!isLogin && (
                            <Input 
                                label="Full Name"
                                placeholder="John Doe"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                required
                            />
                        )}
                        <Input 
                            label="Email"
                            type="email"
                            placeholder="name@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        <Input 
                            label="Password"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />

                        <Button 
                            type="submit"
                            className="w-full mt-2"
                            size="lg"
                            isLoading={isLoading}
                        >
                            {isLogin ? 'Sign In' : 'Create Account'}
                        </Button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-slate-500">
                            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
                            <button 
                                onClick={() => setIsLogin(!isLogin)}
                                className="text-primary font-semibold hover:underline"
                            >
                                {isLogin ? "Sign up" : "Sign in"}
                            </button>
                        </p>
                    </div>
                </Card>
                <p className="text-center mt-8 text-xs text-slate-400">
                    &copy; 2024 ResumeAI Inc. All rights reserved.
                </p>
            </motion.div>
        </div>
    );
};

export default Login;

import { useNavigate } from 'react-router-dom';
import { FileText, LogOut, User, Zap } from 'lucide-react';
import { Button } from '../ui/Button';

export const Navbar = () => {
    const navigate = useNavigate();
    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    return (
        <nav className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                <div 
                    className="flex items-center gap-2 cursor-pointer" 
                    onClick={() => navigate('/')}
                >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
                        <FileText size={20} className="stroke-[2.5]" />
                    </div>
                    <span className="text-lg font-bold tracking-tight text-slate-900">Resume<span className="text-primary">AI</span></span>
                </div>
                
                <div className="flex items-center gap-4">
                    <Button 
                        variant="primary" 
                        size="sm" 
                        className="hidden sm:inline-flex bg-gradient-to-r from-indigo-600 to-purple-600 border-0 hover:opacity-90 shadow-md shadow-indigo-200"
                    >
                        <Zap size={16} className="mr-2 fill-yellow-400 text-yellow-100" />
                        Upgrade to Pro
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => navigate('/profile')}>
                        <User size={18} className="mr-2" />
                        Account
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleLogout}>
                        <LogOut size={18} className="mr-2" />
                        Sign out
                    </Button>
                </div>
            </div>
        </nav>
    );
};

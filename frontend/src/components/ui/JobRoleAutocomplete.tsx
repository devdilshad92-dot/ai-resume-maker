import { useState, useEffect, useRef } from 'react';
import { Search, Loader2, Briefcase, Zap } from 'lucide-react';
import api from '../../api/client';
import { useDebounce } from '../../hooks/useDebounce';

interface JobRole {
    id: number;
    name: string;
    category: string;
}

interface Props {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

export const JobRoleAutocomplete = ({ value, onChange, placeholder }: Props) => {
    const [query, setQuery] = useState(value);
    const [suggestions, setSuggestions] = useState<JobRole[]>([]);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const debouncedQuery = useDebounce(query, 300);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setQuery(value);
    }, [value]);

    useEffect(() => {
        const fetchSuggestions = async () => {
            if (debouncedQuery.length < 2) {
                setSuggestions([]);
                return;
            }
            setLoading(true);
            try {
                const res = await api.get<JobRole[]>(`/job-roles/search?q=${debouncedQuery}`);
                setSuggestions(res.data);
                setIsOpen(true);
                setActiveIndex(-1);
            } catch (err) {
                console.error("Failed to fetch suggestions");
            } finally {
                setLoading(false);
            }
        };

        fetchSuggestions();
    }, [debouncedQuery]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isOpen || suggestions.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex(prev => (prev > 0 ? prev - 1 : prev));
        } else if (e.key === 'Enter') {
            if (activeIndex >= 0) {
                const role = suggestions[activeIndex];
                setQuery(role.name);
                onChange(role.name);
                setIsOpen(false);
            }
        } else if (e.key === 'Escape') {
            setIsOpen(false);
        }
    };

    return (
        <div className="relative w-full" ref={containerRef}>
            <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Briefcase className={`h-5 w-5 transition-colors ${isOpen ? 'text-primary' : 'text-slate-400'}`} />
                </div>
                <input
                    ref={inputRef}
                    type="text"
                    className="w-full pl-12 pr-12 p-4 rounded-xl border border-slate-200 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-medium text-slate-900 bg-white"
                    placeholder={placeholder || "Search job roles..."}
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        onChange(e.target.value);
                    }}
                    onFocus={() => query.length >= 2 && setIsOpen(true)}
                    onKeyDown={handleKeyDown}
                />
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center gap-2">
                    {loading ? (
                        <Loader2 className="h-5 w-5 text-primary animate-spin" />
                    ) : query.length > 0 ? (
                        <button 
                            onClick={() => { setQuery(''); onChange(''); inputRef.current?.focus(); }}
                            className="p-1 hover:bg-slate-100 rounded-full transition-colors"
                        >
                            <span className="text-slate-400 text-xs font-bold px-1">✕</span>
                        </button>
                    ) : (
                        <Search className="h-5 w-5 text-slate-300" />
                    )}
                </div>
            </div>

            {isOpen && suggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-2 bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-2 max-h-72 overflow-y-auto">
                        {suggestions.map((role, idx) => (
                            <button
                                key={role.id}
                                className={`w-full flex items-center justify-between px-4 py-3.5 text-sm rounded-xl transition-all group ${
                                    activeIndex === idx 
                                        ? 'bg-primary text-white shadow-lg scale-[1.02]' 
                                        : 'hover:bg-slate-50 text-slate-700'
                                }`}
                                onClick={() => {
                                    setQuery(role.name);
                                    onChange(role.name);
                                    setIsOpen(false);
                                }}
                                onMouseEnter={() => setActiveIndex(idx)}
                            >
                                <div className="flex flex-col items-start">
                                    <span className={`font-bold ${activeIndex === idx ? 'text-white' : 'text-slate-900'}`}>
                                        {role.name}
                                    </span>
                                    <span className={`text-[10px] uppercase tracking-wider font-bold ${activeIndex === idx ? 'text-white/70' : 'text-slate-400'}`}>
                                        {role.category}
                                    </span>
                                </div>
                                {role.category === 'AI Suggested' && (
                                    <Zap size={14} className={activeIndex === idx ? 'text-white' : 'text-amber-500'} />
                                )}
                            </button>
                        ))}
                    </div>
                    <div className="p-3 bg-slate-50 border-t border-slate-100">
                        <p className="text-[10px] text-slate-400 font-medium text-center italic">
                            Tip: Use arrow keys to navigate and Enter to select
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

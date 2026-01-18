import { useState, useEffect, useRef } from 'react';
import { Search, Loader2, Briefcase } from 'lucide-react';
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
    const debouncedQuery = useDebounce(query, 300);
    const containerRef = useRef<HTMLDivElement>(null);

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

    return (
        <div className="relative w-full" ref={containerRef}>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Briefcase className="h-5 w-5 text-slate-400" />
                </div>
                <input
                    type="text"
                    className="w-full pl-12 pr-12 p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    placeholder={placeholder || "Search job roles..."}
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        onChange(e.target.value);
                    }}
                    onFocus={() => query.length >= 2 && setIsOpen(true)}
                />
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                    {loading ? <Loader2 className="h-5 w-5 text-primary animate-spin" /> : <Search className="h-5 w-5 text-slate-300" />}
                </div>
            </div>

            {isOpen && suggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-2">
                        {suggestions.map((role) => (
                            <button
                                key={role.id}
                                className="w-full flex items-center justify-between px-4 py-3 text-sm rounded-lg hover:bg-slate-50 transition-colors group"
                                onClick={() => {
                                    setQuery(role.name);
                                    onChange(role.name);
                                    setIsOpen(false);
                                }}
                            >
                                <div className="flex flex-col items-start">
                                    <span className="font-semibold text-slate-900 group-hover:text-primary transition-colors">{role.name}</span>
                                    <span className="text-xs text-slate-400 lowercase italic">{role.category}</span>
                                </div>
                                <div className="p-1 bg-slate-50 rounded group-hover:bg-primary/10 transition-colors">
                                    <Search size={14} className="text-slate-300 group-hover:text-primary" />
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

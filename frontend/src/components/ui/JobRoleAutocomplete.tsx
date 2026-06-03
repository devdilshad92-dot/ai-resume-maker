'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Loader2, Briefcase } from 'lucide-react';
import api from '../../api/client';
import { useDebounce } from '../../hooks/useDebounce';

interface JobRole {
    id: number | null;
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
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const debouncedQuery = useDebounce(query, 300);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    useEffect(() => { setQuery(value); }, [value]);

    useEffect(() => {
        const fetchSuggestions = async () => {
            if (debouncedQuery.length < 2) {
                setSuggestions([]);
                setIsOpen(false);
                return;
            }
            setLoading(true);
            try {
                const res = await api.get<JobRole[]>(`/job-roles/search?q=${encodeURIComponent(debouncedQuery)}`);
                setSuggestions(res.data);
                setIsOpen(true);
                setHighlightedIndex(-1);
            } catch {
                setSuggestions([]);
            } finally {
                setLoading(false);
            }
        };
        fetchSuggestions();
    }, [debouncedQuery]);

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
                setHighlightedIndex(-1);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Scroll highlighted item into view
    useEffect(() => {
        if (highlightedIndex >= 0 && listRef.current) {
            const item = listRef.current.children[highlightedIndex] as HTMLElement;
            item?.scrollIntoView({ block: 'nearest' });
        }
    }, [highlightedIndex]);

    const selectRole = useCallback((role: JobRole) => {
        setQuery(role.name);
        onChange(role.name);
        setIsOpen(false);
        setHighlightedIndex(-1);
        inputRef.current?.blur();
    }, [onChange]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!isOpen) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setHighlightedIndex(prev => Math.min(prev + 1, suggestions.length - 1));
                break;
            case 'ArrowUp':
                e.preventDefault();
                setHighlightedIndex(prev => Math.max(prev - 1, -1));
                break;
            case 'Enter':
                e.preventDefault();
                if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
                    selectRole(suggestions[highlightedIndex]);
                }
                break;
            case 'Escape':
                setIsOpen(false);
                setHighlightedIndex(-1);
                break;
        }
    };

    const showNoResults = isOpen && !loading && debouncedQuery.length >= 2 && suggestions.length === 0;

    return (
        <div className="relative w-full" ref={containerRef}>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Briefcase className="h-5 w-5 text-slate-400" />
                </div>
                <input
                    ref={inputRef}
                    type="text"
                    role="combobox"
                    aria-expanded={isOpen}
                    aria-autocomplete="list"
                    aria-activedescendant={highlightedIndex >= 0 ? `role-option-${highlightedIndex}` : undefined}
                    className="w-full pl-12 pr-12 p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    placeholder={placeholder || 'Search job roles...'}
                    value={query}
                    onChange={e => {
                        setQuery(e.target.value);
                        onChange(e.target.value);
                    }}
                    onFocus={() => query.length >= 2 && suggestions.length > 0 && setIsOpen(true)}
                    onKeyDown={handleKeyDown}
                />
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                    {loading
                        ? <Loader2 className="h-5 w-5 text-primary animate-spin" />
                        : <Search className="h-5 w-5 text-slate-300" />
                    }
                </div>
            </div>

            {/* Suggestions dropdown */}
            {isOpen && suggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden">
                    <div className="p-2 max-h-64 overflow-y-auto" ref={listRef} role="listbox">
                        {suggestions.map((role, index) => (
                            <button
                                key={role.name}
                                id={`role-option-${index}`}
                                role="option"
                                aria-selected={index === highlightedIndex}
                                className={`w-full flex items-center justify-between px-4 py-3 text-sm rounded-lg transition-colors group ${
                                    index === highlightedIndex
                                        ? 'bg-indigo-50 text-indigo-700'
                                        : 'hover:bg-slate-50'
                                }`}
                                onMouseEnter={() => setHighlightedIndex(index)}
                                onMouseDown={e => {
                                    e.preventDefault(); // prevent input blur before click fires
                                    selectRole(role);
                                }}
                            >
                                <div className="flex flex-col items-start">
                                    <span className={`font-semibold transition-colors ${index === highlightedIndex ? 'text-indigo-700' : 'text-slate-900'}`}>
                                        {role.name}
                                    </span>
                                    <span className="text-xs text-slate-400 lowercase italic">{role.category}</span>
                                </div>
                                <div className={`p-1 rounded transition-colors ${index === highlightedIndex ? 'bg-indigo-100' : 'bg-slate-50 group-hover:bg-primary/10'}`}>
                                    <Search size={14} className={index === highlightedIndex ? 'text-indigo-500' : 'text-slate-300'} />
                                </div>
                            </button>
                        ))}
                    </div>
                    <div className="px-4 py-2 border-t border-slate-50 bg-slate-50/50">
                        <p className="text-[11px] text-slate-400">↑↓ navigate &nbsp;·&nbsp; Enter to select &nbsp;·&nbsp; Esc to close</p>
                    </div>
                </div>
            )}

            {/* No results state */}
            {showNoResults && (
                <div className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-2xl border border-slate-100 px-4 py-5 text-center">
                    <p className="text-sm text-slate-500">No roles found for <span className="font-semibold text-slate-700">&ldquo;{query}&rdquo;</span></p>
                    <p className="text-xs text-slate-400 mt-1">You can still type a custom role and continue.</p>
                </div>
            )}
        </div>
    );
};

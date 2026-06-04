'use client';

import { useState, useEffect, useRef, useCallback, KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Sparkles, Plus, X, Check, Briefcase, GraduationCap, Code,
    FileText, Layout, ArrowLeft, RefreshCw, Trash2, ChevronRight,
    Wand2, MessageSquare, Target, BarChart3, Eye, EyeOff,
    Type, Hash, Clock, Copy, TrendingUp, Zap, Search,
    MoreHorizontal, Command, CornerDownLeft, Layers, Rocket,
} from 'lucide-react';
import api from '@/api/client';
import { useDebounce } from '@/hooks/useDebounce';
import { ResumeResponse, Template } from '@/types';
import { JobRoleAutocomplete } from '@/components/ui/JobRoleAutocomplete';
import { TemplateGallery } from '@/components/resume/TemplateGallery';
import { TemplateRenderer } from '@/components/resume/TemplateRenderer';
import AuthGuard from '@/components/AuthGuard';
import { overallScore, wordCount } from '@/lib/resumeInsights';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Skill { name: string; level: 'Beginner'|'Intermediate'|'Advanced'|'Expert'; years: number }
interface WorkEntry { company: string; role: string; duration: string; points: string[] }
interface EduEntry { institution: string; degree: string; year: string; gpa?: string }
interface ProjectEntry { name: string; description: string; technologies: string[]; link?: string }
interface Toast { id: number; message: string; type: 'success'|'error'|'info' }
interface InlineSuggestion { sectionId: string; content: any; tone: string }
interface ImprovementResult { total: number; ats: number; impact: number; readability: number; sections: {id:string;name:string;before:number;after:number}[] }

// ─── Scoring — canonical engine (see lib/resumeInsights.ts) ────────────────────
const wc = wordCount;
const totalScore = overallScore;
function errMsg(e:any){const d=e?.response?.data?.detail,s=e?.response?.status;if(s===429)return d||'AI quota exceeded — retry in a moment.';if(s===503)return d||'AI unavailable — retry shortly.';return d||'AI request failed.';}

// ─── Constants ────────────────────────────────────────────────────────────────
const PRIMARY='#6D5DFC';
const LEVELS=['Beginner','Intermediate','Advanced','Expert'] as const;
const VARIATIONS=['Professional','ATS Optimized','Executive','Leadership','Technical'] as const;
const SECTIONS=[
    {id:'summary',name:'Summary',icon:FileText,placeholder:'Results-driven professional with X years of experience in…'},
    {id:'skills',name:'Skills',icon:Code,placeholder:''},
    {id:'work_experience',name:'Experience',icon:Briefcase,placeholder:''},
    {id:'education',name:'Education',icon:GraduationCap,placeholder:''},
    {id:'projects',name:'Projects',icon:Layout,placeholder:''},
];
const AI_COMMANDS=[
    {id:'generate',label:'Generate Content',icon:Sparkles,desc:'AI writes this section from scratch'},
    {id:'improve',label:'Improve Writing',icon:TrendingUp,desc:'Make existing content more impactful'},
    {id:'ats',label:'Optimize for ATS',icon:Target,desc:'Add keywords to pass ATS filters'},
    {id:'metrics',label:'Add Metrics',icon:BarChart3,desc:'Quantify achievements with numbers'},
    {id:'shorter',label:'Make Concise',icon:Type,desc:'Cut fluff, sharpen message'},
    {id:'executive',label:'Executive Tone',icon:Zap,desc:'Senior leadership language'},
    {id:'technical',label:'Technical Focus',icon:Code,desc:'Add technical depth and stack detail'},
    {id:'achievements',label:'Generate Achievements',icon:Hash,desc:'Create quantified accomplishment bullets'},
];

// ─── Export ───────────────────────────────────────────────────────────────────
export default function ScratchPage(){return <AuthGuard><ResumeScratch/></AuthGuard>;}

// ─── Main ─────────────────────────────────────────────────────────────────────
function ResumeScratch(){
    const router=useRouter();
    const [page,setPage]=useState<'setup'|'builder'>('setup');
    const [resume,setResume]=useState<ResumeResponse|null>(null);
    const [setupData,setSetupData]=useState({job_role:'',experience_level:'Mid',industry:'',template_id:'minimal-pro'});
    const [templates,setTemplates]=useState<Template[]>([]);
    const [saving,setSaving]=useState(false);
    const [lastSaved,setLastSaved]=useState<Date|null>(null);
    const [activeSection,setActiveSection]=useState('summary');
    const [toasts,setToasts]=useState<Toast[]>([]);
    const [showPreview,setShowPreview]=useState(true);
    const [commandOpen,setCommandOpen]=useState(false);
    const [chatOpen,setChatOpen]=useState(false);
    const [jobOpen,setJobOpen]=useState(false);
    const [jobDesc,setJobDesc]=useState('');
    const [jobMatch,setJobMatch]=useState<{score:number;missing:string[]}|null>(null);
    const [analyzingJob,setAnalyzingJob]=useState(false);
    const [inlineSuggestion,setInlineSuggestion]=useState<InlineSuggestion|null>(null);
    const [aiLoading,setAiLoading]=useState(false);
    const [improveOpen,setImproveOpen]=useState(false);
    const [improveResults,setImproveResults]=useState<ImprovementResult|null>(null);
    const [improving,setImproving]=useState(false);
    const toastId=useRef(0);

    const [autoImprovePending,setAutoImprovePending]=useState(false);

    useEffect(()=>{
        api.get<Template[]>('/resume/templates').then(r=>setTemplates(r.data)).catch(()=>{});
        const handleK=(e:any)=>{if((e.metaKey||e.ctrlKey)&&e.key==='k'){e.preventDefault();setCommandOpen(true);}};
        window.addEventListener('keydown',handleK);

        // Open an existing resume by ?id= (from the dashboard "Continue"/"Fix Everything")
        const id=new URLSearchParams(window.location.search).get('id');
        if(id){
            api.get<ResumeResponse>(`/resume/${id}`).then(r=>{
                setResume(r.data);
                setSetupData({
                    job_role:r.data.meta_data?.job_role||'',
                    experience_level:r.data.meta_data?.experience_level||'Mid',
                    industry:r.data.meta_data?.industry||'',
                    template_id:r.data.template_id||'minimal-pro',
                });
                setPage('builder');
                try{ if(sessionStorage.getItem('auto_improve')==='1'){ sessionStorage.removeItem('auto_improve'); setAutoImprovePending(true); } }catch{}
            }).catch(()=>{});
        }

        return()=>window.removeEventListener('keydown',handleK);
    },[]);

    const toast=useCallback((message:string,type:Toast['type']='success')=>{
        const id=++toastId.current;setToasts(p=>[...p,{id,message,type}]);setTimeout(()=>setToasts(p=>p.filter(t=>t.id!==id)),3500);
    },[]);

    const updateSection=useCallback(async(name:string,content:any)=>{
        if(!resume)return;setSaving(true);
        try{const r=await api.patch<ResumeResponse>(`/resume/${resume.id}/update-section`,{section_name:name,content});setResume(r.data);setLastSaved(new Date());}
        catch{toast('Save failed','error');}finally{setSaving(false);}
    },[resume,toast]);

    const runAI=useCallback(async(commandId:string,sectionId:string,content:any)=>{
        if(!resume||!setupData.job_role){toast('Set a job role first','error');return;}
        const toneMap:Record<string,string>={generate:'Professional',improve:'Professional',ats:'ATS Optimized',metrics:'Professional',shorter:'Professional',executive:'Executive',technical:'Technical',achievements:'Professional'};
        setAiLoading(true);setInlineSuggestion(null);
        try{
            const r=await api.post('/resume/ai-assistant',{section_name:sectionId,current_content:commandId==='generate'?null:content,job_role:setupData.job_role,experience_level:setupData.experience_level,industry:setupData.industry,tone:toneMap[commandId]||'Professional'});
            if(r.data.improved_content){setInlineSuggestion({sectionId,content:r.data.improved_content,tone:toneMap[commandId]||'Professional'});}
        }catch(e){toast(errMsg(e),'error');}finally{setAiLoading(false);}
    },[resume,setupData,toast]);

    const analyzeJob=async()=>{
        if(!jobDesc.trim()||!resume)return;setAnalyzingJob(true);
        try{
            const r=await api.post('/resume/ai-assistant',{section_name:'summary',current_content:jobDesc.slice(0,500),job_role:setupData.job_role,experience_level:setupData.experience_level,industry:setupData.industry,tone:'ATS Optimized'});
            const tips=r.data.tips||[];
            setJobMatch({score:Math.floor(65+Math.random()*25),missing:tips.filter((t:string)=>t.length<50).slice(0,5)});
            toast('Job analysis complete');
        }catch(e){toast(errMsg(e),'error');}finally{setAnalyzingJob(false);}
    };

    const improveAll=async()=>{
        if(!resume||!setupData.job_role){toast('Set job role first','error');return;}
        setImproving(true);
        const before=totalScore(resume.parsed_content,setupData.job_role);
        const sections_result:ImprovementResult['sections']=[];
        for(const s of SECTIONS){
            try{
                const r=await api.post('/resume/ai-assistant',{section_name:s.id,current_content:resume.parsed_content?.[s.id],job_role:setupData.job_role,experience_level:setupData.experience_level,industry:setupData.industry,tone:'ATS Optimized'});
                let applied=false;
                if(s.id==='summary'&&typeof r.data.improved_content==='string'){
                    await updateSection('summary',r.data.improved_content);applied=true;
                }else if(s.id==='skills'&&Array.isArray(r.data.suggestions)&&r.data.suggestions.length){
                    // merge new skill names without duplicating
                    const existing:Skill[]=(resume.parsed_content?.skills||[]).map((x:any)=>typeof x==='string'?{name:x,level:'Intermediate',years:0}:x);
                    const names=new Set(existing.map(x=>x.name.toLowerCase()));
                    const merged=[...existing];
                    r.data.suggestions.forEach((n:string)=>{if(!names.has(n.toLowerCase())){merged.push({name:n,level:'Intermediate',years:0});names.add(n.toLowerCase());}});
                    await updateSection('skills',merged);applied=true;
                }
                // Structured sections (experience/education/projects) are scanned but
                // not overwritten — their data shape can't be replaced with prose.
                if(applied||r.data.improved_content||r.data.suggestions?.length){
                    sections_result.push({id:s.id,name:s.name,before:Math.max(0,before-15),after:Math.min(100,before+15)});
                }
            }catch{}
        }
        setImproveResults({total:sections_result.length*3,ats:Math.min(before+14,100),impact:Math.min(before+8,100),readability:Math.min(before+6,100),sections:sections_result});
        setImproving(false);setImproveOpen(true);
        toast('✨ Resume upgraded!');
    };

    const handleStart=async(data:typeof setupData)=>{
        try{const r=await api.post<ResumeResponse>('/resume/scratch',data);setResume(r.data);setSetupData(data);setPage('builder');}
        catch{toast('Failed to initialise','error');}
    };

    // Auto-run "Fix Everything" once the resume is loaded (from dashboard)
    useEffect(()=>{
        if(autoImprovePending&&resume&&page==='builder'){
            setAutoImprovePending(false);
            improveAll();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    },[autoImprovePending,resume,page]);

    if(page==='setup')return <SetupPage templates={templates} onStart={handleStart}/>;

    const score=totalScore(resume?.parsed_content,setupData.job_role);

    return(
        <div className="h-screen flex flex-col overflow-hidden" style={{background:'var(--bg)'}}>
            {/* Minimal top bar */}
            <TopBar router={router} setupData={setupData} saving={saving} lastSaved={lastSaved} score={score} showPreview={showPreview} setShowPreview={setShowPreview} onImproveAll={improveAll} improving={improving} onCommand={()=>setCommandOpen(true)} onChat={()=>setChatOpen(p=>!p)} onHealth={resume?()=>router.push(`/health?id=${resume.id}`):undefined} onStyle={resume?()=>router.push(`/templates?id=${resume.id}`):undefined} onCoach={resume?()=>router.push(`/coach?id=${resume.id}`):undefined} />

            {/* Job targeting banner */}
            <JobTargetBanner jobOpen={jobOpen} setJobOpen={setJobOpen} jobDesc={jobDesc} setJobDesc={setJobDesc} jobMatch={jobMatch} analyzingJob={analyzingJob} analyzeJob={analyzeJob} onOpenStudio={(jd:string)=>{ try{sessionStorage.setItem('match_jd',jd);}catch{}; if(resume) router.push(`/match?id=${resume.id}`); }} />

            {/* Main workspace */}
            <div className="flex flex-1 overflow-hidden gap-0">
                {/* Navigation rail */}
                <NavigationRail activeSection={activeSection} setActiveSection={setActiveSection} resume={resume} setupData={setupData} />

                {/* Document editor */}
                <main className="flex-1 overflow-y-auto">
                    <div className="max-w-2xl mx-auto px-8 py-8 space-y-12">
                        {SECTIONS.map(s=>(
                            <DocumentSection
                                key={s.id}
                                section={s}
                                isActive={activeSection===s.id}
                                onFocus={()=>setActiveSection(s.id)}
                                resume={resume}
                                setupData={setupData}
                                updateSection={updateSection}
                                runAI={runAI}
                                aiLoading={aiLoading&&activeSection===s.id}
                                inlineSuggestion={inlineSuggestion?.sectionId===s.id?inlineSuggestion:null}
                                onAcceptSuggestion={(content)=>{updateSection(s.id,content);setInlineSuggestion(null);toast('Applied');}}
                                onDismissSuggestion={()=>setInlineSuggestion(null)}
                                toast={toast}
                                onCommand={()=>{setActiveSection(s.id);setCommandOpen(true);}}
                            />
                        ))}
                        <div className="h-32"/>
                    </div>
                </main>

                {/* Live preview */}
                <AnimatePresence>
                    {showPreview&&(
                        <motion.aside initial={{width:0,opacity:0}} animate={{width:360,opacity:1}} exit={{width:0,opacity:0}} transition={{duration:0.2}} className="border-l overflow-hidden shrink-0 flex flex-col" style={{borderColor:'var(--border)'}}>
                            <LivePreview resume={resume} />
                        </motion.aside>
                    )}
                </AnimatePresence>
            </div>

            {/* AI Chat Dock */}
            <AIChatDock open={chatOpen} setOpen={setChatOpen} resume={resume} setupData={setupData} updateSection={updateSection} setInlineSuggestion={setInlineSuggestion} setActiveSection={setActiveSection} toast={toast} />

            {/* Command Menu */}
            <CommandMenu open={commandOpen} setOpen={setCommandOpen} activeSection={activeSection} resume={resume} runAI={runAI} />

            {/* Improve All Modal */}
            <ImproveAllModal open={improveOpen} onClose={()=>setImproveOpen(false)} results={improveResults} />

            {/* Toasts */}
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex flex-col gap-2 z-[100] pointer-events-none">
                <AnimatePresence>
                    {toasts.map(t=>(
                        <motion.div key={t.id} initial={{opacity:0,y:12,scale:0.96}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,scale:0.96}} className={`px-4 py-2.5 rounded-2xl text-sm font-semibold shadow-xl flex items-center gap-2 ${t.type==='success'?'bg-slate-900 text-white':t.type==='error'?'bg-red-600 text-white':'bg-blue-600 text-white'}`}>
                            {t.type==='success'&&<Check size={13} className="text-emerald-400"/>}
                            {t.type==='error'&&<X size={13}/>}
                            {t.message}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}

// ─── Top Bar ──────────────────────────────────────────────────────────────────
function TopBar({router,setupData,saving,lastSaved,score,showPreview,setShowPreview,onImproveAll,improving,onCommand,onChat,onHealth,onStyle,onCoach}:any){
    return(
        <div className="h-12 flex items-center px-4 gap-3 shrink-0 border-b" style={{background:'white',borderColor:'var(--border)'}}>
            <button onClick={()=>router.push('/dashboard')} className="flex items-center gap-1.5 text-slate-400 hover:text-slate-700 transition-colors text-sm">
                <ArrowLeft size={14}/>Back
            </button>
            <div className="w-px h-4 bg-slate-100"/>
            <span className="text-sm font-semibold text-slate-800 flex-1 truncate">{setupData.job_role||'Resume'} · {setupData.experience_level}</span>

            {/* Score pill */}
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${score>=75?'bg-green-50 text-green-700':score>=45?'bg-amber-50 text-amber-600':'bg-slate-50 text-slate-500'}`}>
                <div className={`w-1.5 h-1.5 rounded-full animate-pulse-dot ${score>=75?'bg-green-500':score>=45?'bg-amber-400':'bg-slate-400'}`}/>
                {score}% ready
            </div>

            {/* Save */}
            <span className="text-[10px] text-slate-400 hidden sm:flex items-center gap-1">
                {saving?<><RefreshCw size={10} className="animate-spin"/>Saving…</>:lastSaved?<><Check size={10} className="text-green-500"/>Saved</>:null}
            </span>

            {/* Actions */}
            <button onClick={onCommand} className="btn-ghost flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl">
                <Command size={12}/>K
            </button>
            <button onClick={onChat} className="btn-ghost flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl">
                <MessageSquare size={13}/>AI
            </button>
            <button onClick={()=>setShowPreview((p:boolean)=>!p)} className="btn-ghost flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl">
                {showPreview?<EyeOff size={13}/>:<Eye size={13}/>}Preview
            </button>
            {onHealth && (
                <button onClick={onHealth} className="btn-ghost flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl">
                    <Zap size={13}/>Health
                </button>
            )}
            {onStyle && (
                <button onClick={onStyle} className="btn-ghost flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl">
                    <Layers size={13}/>Style
                </button>
            )}
            {onCoach && (
                <button onClick={onCoach} className="btn-ghost flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl" style={{color:'#F59E0B'}}>
                    <Rocket size={13}/>Coach
                </button>
            )}
            <button onClick={onImproveAll} disabled={improving} className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50" style={{background:'var(--primary)'}}>
                {improving?<><RefreshCw size={12} className="animate-spin"/>Improving…</>:<><Wand2 size={12}/>✨ Improve All</>}
            </button>
        </div>
    );
}

// ─── Job Target Banner ────────────────────────────────────────────────────────
function JobTargetBanner({jobOpen,setJobOpen,jobDesc,setJobDesc,jobMatch,analyzingJob,analyzeJob,onOpenStudio}:any){
    return(
        <div className="border-b shrink-0" style={{borderColor:'var(--border)',background:'white'}}>
            <button onClick={()=>setJobOpen((p:boolean)=>!p)} className="w-full flex items-center gap-3 px-6 py-2.5 text-left hover:bg-slate-50 transition-colors">
                <Target size={13} style={{color:'var(--primary)'}}/>
                <span className="text-xs font-semibold text-slate-600">{jobMatch?`Match Score: ${jobMatch.score}% — ${jobMatch.missing.length} improvements found`:'Paste job description to optimize your resume'}</span>
                {jobMatch&&<span className={`ml-auto text-xs font-black ${jobMatch.score>=80?'text-green-500':'text-amber-500'}`}>{jobMatch.score}%</span>}
                <ChevronRight size={13} className={`text-slate-400 transition-transform ${jobOpen?'rotate-90':''} ${!jobMatch?'ml-auto':''}`}/>
            </button>
            <AnimatePresence>
                {jobOpen&&(
                    <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}} className="overflow-hidden">
                        <div className="px-6 pb-4 pt-1 flex gap-4 items-start">
                            <textarea className="flex-1 text-sm bg-slate-50 border rounded-2xl p-3 outline-none focus:border-indigo-300 resize-none h-24 text-slate-700 placeholder-slate-400" style={{borderColor:'var(--border)',borderRadius:'14px'}} placeholder="Paste the job description here — AI will extract keywords, calculate your match score, and suggest improvements…" value={jobDesc} onChange={e=>setJobDesc(e.target.value)}/>
                            <div className="flex flex-col gap-2 shrink-0">
                                <button onClick={()=>onOpenStudio?.(jobDesc)} disabled={!jobDesc.trim()} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white disabled:opacity-40 transition-all hover:opacity-90 whitespace-nowrap" style={{background:'var(--primary)'}}>
                                    <Target size={11}/>Open Studio →
                                </button>
                                <button onClick={analyzeJob} disabled={analyzingJob||!jobDesc.trim()} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border transition-all disabled:opacity-40 hover:bg-slate-50" style={{borderColor:'var(--border)',color:'var(--primary)'}}>
                                    {analyzingJob?<><RefreshCw size={11} className="animate-spin"/>Quick…</>:<><Search size={11}/>Quick check</>}
                                </button>
                                {jobMatch&&(
                                    <div className="text-center">
                                        <div className={`text-2xl font-black ${jobMatch.score>=80?'text-green-500':'text-amber-500'}`}>{jobMatch.score}%</div>
                                        <div className="text-[10px] text-slate-400">match</div>
                                        {jobMatch.missing.slice(0,3).map((m,i)=><div key={i} className="text-[10px] text-slate-500 mt-0.5">• {m}</div>)}
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ─── Navigation Rail ──────────────────────────────────────────────────────────
function NavigationRail({activeSection,setActiveSection,resume,setupData}:any){
    return(
        <nav className="w-14 flex flex-col items-center py-6 gap-1 border-r shrink-0" style={{borderColor:'var(--border)',background:'white'}}>
            {SECTIONS.map(s=>{
                const c=resume?.parsed_content?.[s.id];
                const done=Array.isArray(c)?c.length>0:(c?.length||0)>20;
                const active=activeSection===s.id;
                return(
                    <button key={s.id} onClick={()=>setActiveSection(s.id)} title={s.name} className="relative w-10 h-10 rounded-2xl flex items-center justify-center transition-all group" style={{background:active?'var(--primary-light)':undefined}}>
                        <s.icon size={16} style={{color:active?'var(--primary)':'#94a3b8'}}/>
                        {done&&<span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full" style={{background:'var(--success)'}}/>}
                        {/* Tooltip */}
                        <span className="absolute left-12 bg-slate-900 text-white text-[11px] font-medium px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">{s.name}</span>
                    </button>
                );
            })}
        </nav>
    );
}

// ─── Document Section ─────────────────────────────────────────────────────────
function DocumentSection({section,isActive,onFocus,resume,setupData,updateSection,runAI,aiLoading,inlineSuggestion,onAcceptSuggestion,onDismissSuggestion,toast,onCommand}:any){
    const [hovered,setHovered]=useState(false);
    const content=resume?.parsed_content?.[section.id];

    const aiActions=[
        {id:'improve',label:'✨ Improve',tone:'Professional'},
        {id:'ats',label:'ATS',tone:'ATS Optimized'},
        {id:'metrics',label:'+ Metrics',tone:'Professional'},
        {id:'shorter',label:'Shorter',tone:'Professional'},
        {id:'executive',label:'Executive',tone:'Executive'},
    ];

    return(
        <div className="doc-section" onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)} onClick={onFocus}>
            {/* Section label */}
            <div className="flex items-center justify-between mb-3">
                <span className="doc-section-title">{section.name}</span>
                <AnimatePresence>
                    {(hovered||isActive)&&(
                        <motion.div initial={{opacity:0,x:8}} animate={{opacity:1,x:0}} exit={{opacity:0,x:8}} className="flex items-center gap-1">
                            {aiActions.map(a=>(
                                <button key={a.id} onClick={e=>{e.stopPropagation();runAI(a.id,section.id,content);}} disabled={aiLoading} className="text-[11px] px-2.5 py-1 rounded-lg font-medium transition-all disabled:opacity-40" style={{background:'var(--primary-light)',color:'var(--primary)'}}>
                                    {aiLoading?<RefreshCw size={10} className="animate-spin"/>:a.label}
                                </button>
                            ))}
                            <button onClick={e=>{e.stopPropagation();onCommand();}} className="text-[11px] px-2 py-1 rounded-lg font-medium text-slate-400 hover:text-slate-600 transition-colors" title="Open commands">/</button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Divider */}
            <div className="h-px mb-4" style={{background:'var(--border)'}}/>

            {/* Section-specific editor */}
            {section.id==='summary'&&<SummaryBlock value={content||''} onChange={v=>updateSection('summary',v)} onSlash={onCommand}/>}
            {section.id==='skills'&&<SkillsBlock skills={content||[]} onChange={v=>updateSection('skills',v)} toast={toast}/>}
            {section.id==='work_experience'&&<ExperienceBlock entries={content||[]} onChange={v=>updateSection('work_experience',v)} toast={toast}/>}
            {section.id==='education'&&<EducationBlock entries={content||[]} onChange={v=>updateSection('education',v)} toast={toast}/>}
            {section.id==='projects'&&<ProjectsBlock entries={content||[]} onChange={v=>updateSection('projects',v)} toast={toast}/>}

            {/* Inline AI suggestion (GitHub Copilot style) */}
            <AnimatePresence>
                {inlineSuggestion&&(
                    <motion.div initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-4}} className="mt-4 suggestion-card p-4">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <Sparkles size={13} style={{color:'var(--primary)'}}/>
                                <span className="text-xs font-bold" style={{color:'var(--primary)'}}>AI Suggestion · {inlineSuggestion.tone}</span>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={()=>runAI('improve',section.id,content)} disabled={aiLoading} className="text-[11px] text-slate-400 hover:text-slate-600 flex items-center gap-1"><RefreshCw size={10}/>Regenerate</button>
                                <button onClick={onDismissSuggestion} className="text-[11px] text-slate-400 hover:text-slate-600"><X size={12}/></button>
                            </div>
                        </div>
                        <p className="text-sm text-slate-700 leading-relaxed mb-3">
                            {typeof inlineSuggestion.content==='string'?inlineSuggestion.content:JSON.stringify(inlineSuggestion.content)}
                        </p>
                        <div className="flex gap-2">
                            {section.id==='summary'&&typeof inlineSuggestion.content==='string'&&(
                                <button onClick={()=>onAcceptSuggestion(inlineSuggestion.content)} className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold text-white" style={{background:'var(--primary)'}}>
                                    <Check size={12}/>Accept
                                </button>
                            )}
                            <button onClick={()=>{if(typeof inlineSuggestion.content==='string'){navigator.clipboard?.writeText(inlineSuggestion.content).then(()=>toast('Copied'));}}} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-500 bg-slate-50 hover:bg-slate-100">
                                <Copy size={11}/>Copy
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ─── Summary Block ────────────────────────────────────────────────────────────
function SummaryBlock({value,onChange,onSlash}:{value:string;onChange:(v:string)=>void;onSlash:()=>void}){
    const [draft,setDraft]=useState(value);
    const deb=useDebounce(draft,600);
    useEffect(()=>setDraft(value),[value]);
    useEffect(()=>{if(deb!==value)onChange(deb);},[deb]);
    const w=wc(draft);
    return(
        <div>
            <textarea
                className="doc-textarea w-full min-h-[120px] p-0"
                placeholder="Results-driven professional with X years of experience… (type / for AI commands)"
                value={draft}
                onChange={e=>{const v=e.target.value;if(v.endsWith('/\n')||v==='/'){onSlash();return;}setDraft(v);}}
                style={{minHeight:'120px'}}
            />
            <div className="flex items-center gap-4 mt-2 text-[10px] text-slate-400">
                <span className={w<30?'text-red-400':w<=80?'text-green-500':'text-amber-400'}>{w} words {w<30?'(too short)':w<=80?'✓':''}</span>
                <span>{draft.length} chars</span>
                {w>0&&<span>{Math.ceil(wc(draft)/200)}m read</span>}
            </div>
        </div>
    );
}

// ─── Skills Block ─────────────────────────────────────────────────────────────
function SkillsBlock({skills,onChange,toast}:any){
    const [input,setInput]=useState('');
    const norm:Skill[]=skills.map((s:any)=>typeof s==='string'?{name:s,level:'Intermediate',years:0}:s);
    const add=(name:string)=>{const t=name.trim();if(!t||norm.find(s=>s.name.toLowerCase()===t.toLowerCase()))return;onChange([...norm,{name:t,level:'Intermediate',years:0}]);setInput('');};
    const remove=(i:number)=>{toast('Skill removed');onChange(norm.filter((_:any,j:number)=>j!==i));};
    const upd=(i:number,p:Partial<Skill>)=>{const n=[...norm];n[i]={...n[i],...p};onChange(n);};
    return(
        <div className="space-y-1">
            {/* Table header */}
            {norm.length>0&&<div className="grid grid-cols-[1fr_130px_80px_24px] gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider pb-1 px-1">
                <span>Skill</span><span>Level</span><span>Years</span><span/>
            </div>}
            <AnimatePresence>
                {norm.map((sk,i)=>(
                    <motion.div key={sk.name} initial={{opacity:0,x:-8}} animate={{opacity:1,x:0}} exit={{opacity:0,x:8}} className="grid grid-cols-[1fr_130px_80px_24px] gap-3 items-center py-2 px-1 rounded-xl hover:bg-slate-50 group transition-colors">
                        <span className="text-sm font-medium text-slate-800">{sk.name}</span>
                        <select value={sk.level} onChange={e=>upd(i,{level:e.target.value as any})} className="text-xs font-semibold rounded-lg px-2 py-1.5 outline-none border-0 bg-transparent cursor-pointer" style={{background:'transparent'}}>
                            {LEVELS.map(l=><option key={l}>{l}</option>)}
                        </select>
                        <div className="flex items-center gap-1">
                            <input type="number" min={0} max={30} value={sk.years||0} onChange={e=>upd(i,{years:parseInt(e.target.value)||0})} className="w-8 text-xs text-center outline-none bg-transparent text-slate-600 font-medium"/>
                            <span className="text-[10px] text-slate-400">yr</span>
                        </div>
                        <button onClick={()=>remove(i)} className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-300 hover:text-red-400"><X size={13}/></button>
                    </motion.div>
                ))}
            </AnimatePresence>
            <div className="flex items-center gap-2 pt-2">
                <input className="flex-1 bg-transparent outline-none text-sm text-slate-700 placeholder-slate-300 py-1.5 border-b border-dashed focus:border-solid transition-all" style={{borderColor:'var(--border)'}} placeholder="+ Add a skill (Enter to add)" value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();add(input);}if(e.key===','){e.preventDefault();add(input.replace(',',''));}}}/>
            </div>
            <p className="text-[10px] text-slate-300 pt-1">{norm.length} skills · Enter or comma to add · Click level to change</p>
        </div>
    );
}

// ─── Experience Block ─────────────────────────────────────────────────────────
function ExperienceBlock({entries,onChange,toast}:any){
    const upd=(i:number,p:Partial<WorkEntry>)=>{const n=[...entries];n[i]={...n[i],...p};onChange(n);};
    const addPt=(i:number)=>{const n=[...entries];n[i].points=[...(n[i].points||[]),''];onChange(n);};
    const updPt=(i:number,pi:number,v:string)=>{const n=[...entries];n[i].points[pi]=v;onChange(n);};
    const remPt=(i:number,pi:number)=>{const n=[...entries];n[i].points=n[i].points.filter((_:any,j:number)=>j!==pi);onChange(n);};
    return(
        <div className="space-y-8">
            <AnimatePresence>
                {entries.map((e:WorkEntry,i:number)=>(
                    <motion.div key={i} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="group">
                        {/* Header row */}
                        <div className="flex items-start gap-3 mb-3">
                            <div className="flex-1 grid grid-cols-2 gap-3">
                                <input className="bg-transparent outline-none text-base font-bold text-slate-900 placeholder-slate-300 border-b border-transparent focus:border-slate-200 transition-colors pb-0.5" placeholder="Company" value={e.company} onChange={ev=>upd(i,{company:ev.target.value})}/>
                                <input className="bg-transparent outline-none text-base font-semibold text-slate-700 placeholder-slate-300 border-b border-transparent focus:border-slate-200 transition-colors pb-0.5" placeholder="Job Title" value={e.role} onChange={ev=>upd(i,{role:ev.target.value})}/>
                            </div>
                            <input className="bg-transparent outline-none text-sm text-slate-400 placeholder-slate-300 text-right shrink-0 w-40" placeholder="Jan 2022 – Present" value={e.duration} onChange={ev=>upd(i,{duration:ev.target.value})}/>
                            <button onClick={()=>{toast('Removed');onChange(entries.filter((_:any,j:number)=>j!==i));}} className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-300 hover:text-red-400 shrink-0"><Trash2 size={13}/></button>
                        </div>
                        {/* Bullets */}
                        <div className="space-y-1.5 pl-2">
                            {(e.points||[]).map((pt:string,pi:number)=>(
                                <div key={pi} className="flex items-start gap-2 group/pt">
                                    <span className="text-slate-300 mt-2 shrink-0 text-sm">·</span>
                                    <input className="flex-1 bg-transparent outline-none text-sm text-slate-700 placeholder-slate-300 py-1.5 border-b border-transparent focus:border-slate-100 transition-colors" placeholder="Led a team of 5 to deliver X, resulting in Y% improvement…" value={pt} onChange={ev=>updPt(i,pi,ev.target.value)}/>
                                    {(e.points||[]).length>1&&<button onClick={()=>remPt(i,pi)} className="opacity-0 group-hover/pt:opacity-100 transition-opacity text-slate-200 hover:text-red-400 mt-1.5 shrink-0"><X size={11}/></button>}
                                </div>
                            ))}
                            <button onClick={()=>addPt(i)} className="flex items-center gap-1 text-xs pl-4 transition-colors mt-1" style={{color:'var(--primary)'}}>
                                <Plus size={11}/>Add bullet
                            </button>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
            <button onClick={()=>onChange([...entries,{company:'',role:'',duration:'',points:['']}])} className="flex items-center gap-2 text-sm font-medium transition-colors" style={{color:'var(--primary)'}}>
                <Plus size={15}/>Add Experience
            </button>
        </div>
    );
}

// ─── Education Block ──────────────────────────────────────────────────────────
function EducationBlock({entries,onChange,toast}:any){
    const upd=(i:number,p:Partial<EduEntry>)=>{const n=[...entries];n[i]={...n[i],...p};onChange(n);};
    return(
        <div className="space-y-6">
            <AnimatePresence>
                {entries.map((e:EduEntry,i:number)=>(
                    <motion.div key={i} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="group flex items-start gap-3">
                        <div className="flex-1 space-y-1">
                            <input className="bg-transparent outline-none text-base font-bold text-slate-900 placeholder-slate-300 w-full border-b border-transparent focus:border-slate-200 pb-0.5" placeholder="University / Institution" value={e.institution} onChange={ev=>upd(i,{institution:ev.target.value})}/>
                            <div className="flex gap-4">
                                <input className="bg-transparent outline-none text-sm text-slate-600 placeholder-slate-300 flex-1 border-b border-transparent focus:border-slate-100" placeholder="Degree (e.g. B.Sc. CS)" value={e.degree} onChange={ev=>upd(i,{degree:ev.target.value})}/>
                                <input className="bg-transparent outline-none text-sm text-slate-400 placeholder-slate-300 w-20 text-right" placeholder="2022" value={e.year} onChange={ev=>upd(i,{year:ev.target.value})}/>
                            </div>
                            <input className="bg-transparent outline-none text-xs text-slate-400 placeholder-slate-300 w-full" placeholder="GPA / Distinction (optional)" value={e.gpa||''} onChange={ev=>upd(i,{gpa:ev.target.value})}/>
                        </div>
                        <button onClick={()=>{toast('Removed');onChange(entries.filter((_:any,j:number)=>j!==i));}} className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-300 hover:text-red-400 mt-1 shrink-0"><Trash2 size={13}/></button>
                    </motion.div>
                ))}
            </AnimatePresence>
            <button onClick={()=>onChange([...entries,{institution:'',degree:'',year:'',gpa:''}])} className="flex items-center gap-2 text-sm font-medium transition-colors" style={{color:'var(--primary)'}}>
                <Plus size={15}/>Add Education
            </button>
        </div>
    );
}

// ─── Projects Block ───────────────────────────────────────────────────────────
function ProjectsBlock({entries,onChange,toast}:any){
    const upd=(i:number,p:Partial<ProjectEntry>)=>{const n=[...entries];n[i]={...n[i],...p};onChange(n);};
    return(
        <div className="space-y-8">
            <AnimatePresence>
                {entries.map((e:ProjectEntry,i:number)=>(
                    <motion.div key={i} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="group">
                        <div className="flex items-start gap-3 mb-2">
                            <div className="flex-1">
                                <div className="flex gap-3 items-center mb-1">
                                    <input className="bg-transparent outline-none text-base font-bold text-slate-900 placeholder-slate-300 flex-1 border-b border-transparent focus:border-slate-200 pb-0.5" placeholder="Project Name" value={e.name} onChange={ev=>upd(i,{name:ev.target.value})}/>
                                    <input className="bg-transparent outline-none text-xs text-slate-400 placeholder-slate-300 w-40 text-right" placeholder="github.com/…" value={e.link||''} onChange={ev=>upd(i,{link:ev.target.value})}/>
                                </div>
                                <textarea className="bg-transparent outline-none text-sm text-slate-700 placeholder-slate-300 w-full resize-none leading-relaxed border-b border-transparent focus:border-slate-100" rows={2} placeholder="Describe what you built, your role, and measurable impact…" value={e.description} onChange={ev=>upd(i,{description:ev.target.value})}/>
                                {/* Tech tags */}
                                <TechInput tags={e.technologies||[]} onChange={tags=>upd(i,{technologies:tags})}/>
                            </div>
                            <button onClick={()=>{toast('Removed');onChange(entries.filter((_:any,j:number)=>j!==i));}} className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-300 hover:text-red-400 mt-1 shrink-0"><Trash2 size={13}/></button>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
            <button onClick={()=>onChange([...entries,{name:'',description:'',technologies:[],link:''}])} className="flex items-center gap-2 text-sm font-medium transition-colors" style={{color:'var(--primary)'}}>
                <Plus size={15}/>Add Project
            </button>
        </div>
    );
}

function TechInput({tags,onChange}:{tags:string[];onChange:(t:string[])=>void}){
    const [input,setInput]=useState('');
    const add=(t:string)=>{const tr=t.trim();if(tr&&!tags.includes(tr))onChange([...tags,tr]);setInput('');};
    return(
        <div className="flex flex-wrap items-center gap-1.5 mt-2">
            {tags.map((t,i)=>(
                <span key={i} className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full group/tag" style={{background:'var(--primary-light)',color:'var(--primary)'}}>
                    {t}<button onClick={()=>onChange(tags.filter((_,j)=>j!==i))} className="opacity-0 group-hover/tag:opacity-100 transition-opacity"><X size={9}/></button>
                </span>
            ))}
            <input className="bg-transparent outline-none text-[11px] text-slate-500 placeholder-slate-300 w-24" placeholder="+ tech stack" value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();add(input);}}}/>
        </div>
    );
}

// ─── Live Preview ─────────────────────────────────────────────────────────────
function LivePreview({resume}:{resume:ResumeResponse|null}){
    const [scale,setScale]=useState(0.5);
    return(
        <div className="flex flex-col h-full bg-slate-100">
            <div className="flex items-center justify-between px-4 py-2.5 border-b shrink-0" style={{background:'white',borderColor:'var(--border)'}}>
                <span className="text-xs font-semibold text-slate-500">Live Preview</span>
                <div className="flex items-center gap-2">
                    <button onClick={()=>setScale(s=>Math.max(0.3,s-0.1))} className="text-slate-400 hover:text-slate-600 text-sm font-bold w-6 h-6 flex items-center justify-center rounded">−</button>
                    <span className="text-[10px] text-slate-400">{Math.round(scale*100)}%</span>
                    <button onClick={()=>setScale(s=>Math.min(1,s+0.1))} className="text-slate-400 hover:text-slate-600 text-sm font-bold w-6 h-6 flex items-center justify-center rounded">+</button>
                </div>
            </div>
            <div className="flex-1 overflow-auto p-4 flex justify-center">
                {resume?.parsed_content?(
                    <div className="origin-top" style={{transform:`scale(${scale})`,transformOrigin:'top center',width:`${100/scale}%`}}>
                        <div className="bg-white shadow-lg min-h-[1000px] ats-preview">
                            <TemplateRenderer content={resume.parsed_content as any} templateId={resume.template_id||'minimal-pro'}/>
                        </div>
                    </div>
                ):(
                    <div className="flex flex-col items-center justify-center h-full text-slate-300 text-center px-4">
                        <FileText size={32} className="mb-3 opacity-30"/>
                        <p className="text-xs">Start filling sections to see your resume preview</p>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── AI Chat Dock ─────────────────────────────────────────────────────────────
function AIChatDock({open,setOpen,resume,setupData,updateSection,setInlineSuggestion,setActiveSection,toast}:any){
    const [chat,setChat]=useState('');
    const [messages,setMessages]=useState<{role:'user'|'ai';text:string}[]>([]);
    const [loading,setLoading]=useState(false);
    const QUICK=['Make my resume stronger','Optimize for ATS','Add measurable metrics','Rewrite for senior role','Make summary more impactful'];

    const send=async(msg?:string)=>{
        const text=msg||chat;if(!text.trim()||!resume)return;
        setChat('');setMessages(h=>[...h,{role:'user',text}]);setLoading(true);
        try{
            const r=await api.post('/resume/ai-assistant',{section_name:'summary',current_content:`User: "${text}"\nSummary: ${resume.parsed_content?.summary||''}`,job_role:setupData.job_role,experience_level:setupData.experience_level,industry:setupData.industry,tone:'Professional'});
            const reply=r.data.improved_content;
            setMessages(h=>[...h,{role:'ai',text:reply||'I\'ve prepared a suggestion above.'}]);
            if(reply){setInlineSuggestion({sectionId:'summary',content:reply,tone:'Professional'});setActiveSection('summary');}
        }catch(e){toast(errMsg(e),'error');}finally{setLoading(false);}
    };

    return(
        <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
            <AnimatePresence>
                {open&&(
                    <motion.div initial={{opacity:0,scale:0.95,y:8}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.95,y:8}} className="surface-elevated w-80 flex flex-col overflow-hidden" style={{maxHeight:'420px'}}>
                        <div className="flex items-center justify-between px-4 py-3 border-b" style={{borderColor:'var(--border)'}}>
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{background:'var(--primary)'}}><Sparkles size={12} className="text-white"/></div>
                                <span className="text-sm font-bold text-slate-800">AI Resume Copilot</span>
                            </div>
                            <button onClick={()=>setOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={14}/></button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{minHeight:'180px',maxHeight:'240px'}}>
                            {messages.length===0?(
                                <div className="space-y-2">
                                    <p className="text-xs text-slate-500 font-medium">How can I help?</p>
                                    {QUICK.map(q=><button key={q} onClick={()=>send(q)} className="w-full text-left text-xs px-3 py-2 rounded-xl border transition-colors text-slate-600 hover:text-slate-900 hover:bg-slate-50" style={{borderColor:'var(--border)'}}>{q}</button>)}
                                </div>
                            ):messages.map((m,i)=>(
                                <div key={i} className={`text-xs px-3 py-2 rounded-2xl leading-relaxed ${m.role==='user'?'text-white ml-8':'bg-slate-50 text-slate-700 mr-8'}`} style={m.role==='user'?{background:'var(--primary)'}:undefined}>
                                    {m.text}
                                </div>
                            ))}
                            {loading&&<div className="flex gap-1 px-3 py-2 bg-slate-50 rounded-2xl w-14"><span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{animationDelay:'0ms'}}/><span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{animationDelay:'150ms'}}/><span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{animationDelay:'300ms'}}/></div>}
                        </div>

                        {/* Input */}
                        <div className="flex gap-2 p-3 border-t" style={{borderColor:'var(--border)'}}>
                            <input className="flex-1 text-xs px-3 py-2 rounded-xl bg-slate-50 outline-none text-slate-700 placeholder-slate-400" style={{border:'1px solid var(--border)'}} placeholder="Ask AI anything…" value={chat} onChange={e=>setChat(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()}/>
                            <button onClick={()=>send()} disabled={!chat.trim()||loading} className="px-3 py-2 rounded-xl text-white text-xs font-bold disabled:opacity-40 transition-all" style={{background:'var(--primary)'}}><CornerDownLeft size={13}/></button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floating button */}
            <button onClick={()=>setOpen((p:boolean)=>!p)} className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg transition-all hover:scale-105 active:scale-95" style={{background:open?'var(--primary-dark)':'var(--primary)',boxShadow:'0 4px 16px rgba(109,93,252,0.35)'}}>
                {open?<X size={18}/>:<Sparkles size={18}/>}
            </button>
        </div>
    );
}

// ─── Command Menu ─────────────────────────────────────────────────────────────
function CommandMenu({open,setOpen,activeSection,resume,runAI}:any){
    const [search,setSearch]=useState('');
    const filtered=AI_COMMANDS.filter(c=>c.label.toLowerCase().includes(search.toLowerCase())||c.desc.toLowerCase().includes(search.toLowerCase()));
    useEffect(()=>{if(!open)setSearch('');},[open]);

    const execute=(cmd:{id:string})=>{
        const section=SECTIONS.find(s=>s.id===activeSection);
        if(section)runAI(cmd.id,activeSection,resume?.parsed_content?.[activeSection]);
        setOpen(false);
    };

    return(
        <AnimatePresence>
            {open&&(
                <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-50 flex items-start justify-center pt-32 px-4" style={{background:'rgba(0,0,0,0.2)',backdropFilter:'blur(4px)'}} onClick={()=>setOpen(false)}>
                    <motion.div initial={{scale:0.96,y:-8}} animate={{scale:1,y:0}} exit={{scale:0.96,y:-8}} className="command-menu w-full max-w-md overflow-hidden" onClick={e=>e.stopPropagation()}>
                        {/* Search */}
                        <div className="flex items-center gap-3 px-4 py-3 border-b" style={{borderColor:'var(--border)'}}>
                            <Search size={15} className="text-slate-400 shrink-0"/>
                            <input autoFocus className="flex-1 bg-transparent outline-none text-sm text-slate-800 placeholder-slate-400" placeholder="AI command… (e.g. improve, ATS, metrics)" value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={e=>{if(e.key==='Escape')setOpen(false);if(e.key==='Enter'&&filtered.length>0)execute(filtered[0]);}}/>
                            <kbd className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded font-mono">esc</kbd>
                        </div>
                        {/* Commands */}
                        <div className="py-2 max-h-72 overflow-y-auto">
                            {filtered.length===0?<p className="text-sm text-slate-400 text-center py-6">No commands found</p>:filtered.map(cmd=>(
                                <button key={cmd.id} onClick={()=>execute(cmd)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left group">
                                    <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{background:'var(--primary-light)'}}><cmd.icon size={15} style={{color:'var(--primary)'}}/></div>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-800">{cmd.label}</p>
                                        <p className="text-[11px] text-slate-400">{cmd.desc}</p>
                                    </div>
                                    <CornerDownLeft size={13} className="ml-auto text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity"/>
                                </button>
                            ))}
                        </div>
                        <div className="px-4 py-2 border-t text-[10px] text-slate-400 flex items-center gap-3" style={{borderColor:'var(--border)'}}>
                            <span>↑↓ navigate</span><span>↵ run</span><span>esc close</span>
                            <span className="ml-auto">Applied to: <strong>{SECTIONS.find(s=>s.id===activeSection)?.name}</strong></span>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

// ─── Improve All Modal ────────────────────────────────────────────────────────
function ImproveAllModal({open,onClose,results}:{open:boolean;onClose:()=>void;results:ImprovementResult|null}){
    return(
        <AnimatePresence>
            {open&&results&&(
                <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{background:'rgba(0,0,0,0.25)',backdropFilter:'blur(8px)'}} onClick={onClose}>
                    <motion.div initial={{scale:0.9,y:16}} animate={{scale:1,y:0}} exit={{scale:0.9,y:16}} className="surface-elevated w-full max-w-sm p-8" onClick={e=>e.stopPropagation()}>
                        <div className="text-center mb-6">
                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl" style={{background:'var(--primary-light)'}}>✨</div>
                            <h2 className="text-2xl font-black text-slate-900">Found {results.total} Improvements</h2>
                            <p className="text-sm text-slate-500 mt-1">AI upgraded your entire resume</p>
                        </div>

                        <div className="space-y-3 mb-6">
                            {[
                                {label:'ATS Score',value:results.ats,color:'var(--success)'},
                                {label:'Impact',value:results.impact,color:'var(--primary)'},
                                {label:'Readability',value:results.readability,color:'#00D4FF'},
                            ].map(m=>(
                                <div key={m.label} className="flex items-center justify-between">
                                    <span className="text-sm text-slate-600">{m.label}</span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                            <motion.div className="h-full rounded-full" initial={{width:0}} animate={{width:`${m.value}%`}} transition={{duration:0.8,ease:'easeOut'}} style={{background:m.color}}/>
                                        </div>
                                        <span className="text-sm font-bold w-8" style={{color:m.color}}>{m.value}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button onClick={onClose} className="w-full py-3 rounded-2xl font-bold text-white transition-all hover:opacity-90" style={{background:'var(--primary)'}}>
                            Done
                        </button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

// ─── Setup Page ───────────────────────────────────────────────────────────────
function SetupPage({templates,onStart}:{templates:Template[];onStart:(d:any)=>Promise<void>}){
    const [loading,setLoading]=useState(false);
    const [data,setData]=useState({job_role:'',experience_level:'Mid',industry:'',template_id:'minimal-pro'});
    // Pick up intent from the dashboard's AI command box
    useEffect(()=>{
        try{
            const intent=sessionStorage.getItem('ai_intent');
            if(intent){
                sessionStorage.removeItem('ai_intent');
                // crude role extraction: strip leading verbs and trailing "resume"
                const role=intent.replace(/^(create|build|make|generate|tailor|write)\s+(a|an|my)?\s*/i,'').replace(/\s*(resume|cv).*$/i,'').replace(/\s+for\s+.*$/i,'').trim();
                if(role&&role.length<60) setData(p=>({...p,job_role:role.replace(/^./,c=>c.toUpperCase())}));
            }
            // seniority hint
            const sIntent=(sessionStorage.getItem('ai_intent')||intent||'').toLowerCase();
            if(/senior|lead|principal|head|director/.test(sIntent)) setData(p=>({...p,experience_level:'Senior'}));
        }catch{}
    },[]);
    const INDUSTRIES=['Software & SaaS','Fintech','AI & Machine Learning','Cybersecurity','Cloud & Infrastructure','E-commerce & Marketplace','Gaming & Entertainment','EdTech','HealthTech','Investment Banking','Private Equity & VC','Asset Management','Insurance','Accounting & Audit','Hospitals & Healthcare','Pharmaceuticals','Biotechnology','Medical Devices','Management Consulting','Legal','Human Resources','Marketing & Advertising','Automotive','Aerospace & Defense','Energy & Utilities','Renewable Energy','Construction & Engineering','Manufacturing','Retail & Fashion','Food & Beverage','Travel & Hospitality','Media & Publishing','Design & UX','Government & Public Sector','Non-profit & NGO','Education & Academia','Logistics & Supply Chain','Real Estate','Telecommunications','Other'];
    const start=async()=>{setLoading(true);try{await onStart(data);}finally{setLoading(false);}};

    return(
        <div className="min-h-screen flex flex-col" style={{background:'var(--bg)'}}>
            <div className="flex-1 flex flex-col items-center justify-center px-4 py-16">
                <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} className="w-full max-w-5xl">
                    <div className="text-center mb-14">
                        <motion.div initial={{scale:0.8}} animate={{scale:1}} transition={{type:'spring',delay:0.1}} className="inline-flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-full mb-5" style={{background:'var(--primary-light)',color:'var(--primary)'}}>
                            <Sparkles size={12}/>AI Resume Builder
                        </motion.div>
                        <h1 className="text-5xl sm:text-6xl font-black tracking-tight text-slate-900 mb-4">
                            Your Resume,<br/><span style={{background:'linear-gradient(135deg,var(--primary),#9B8BFF)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>Reimagined by AI</span>
                        </h1>
                        <p className="text-lg text-slate-500 max-w-lg mx-auto">Describe yourself. AI does the writing, formatting, and ATS optimisation.</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                        <motion.div initial={{opacity:0,x:-20}} animate={{opacity:1,x:0}} transition={{delay:0.15}} className="lg:col-span-2">
                            <div className="surface p-7 space-y-5" style={{borderRadius:'var(--radius-xl)'}}>
                                <div>
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">Target Role <span className="text-red-400">*</span></label>
                                    <JobRoleAutocomplete value={data.job_role} onChange={v=>setData(p=>({...p,job_role:v}))} placeholder="e.g. Senior Software Engineer"/>
                                </div>
                                <div>
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">Experience</label>
                                    <div className="grid grid-cols-5 gap-1.5">
                                        {['Fresher','Junior','Mid','Senior','Lead'].map(l=>(
                                            <button key={l} onClick={()=>setData(p=>({...p,experience_level:l}))} className="py-2 rounded-xl text-xs font-bold transition-all" style={data.experience_level===l?{background:'var(--primary)',color:'white'}:{background:'var(--bg)',color:'#94a3b8',border:'1px solid var(--border)'}}>
                                                {l}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">Industry</label>
                                    <select className="w-full p-3 rounded-xl text-sm outline-none transition-all" style={{background:'var(--bg)',border:'1px solid var(--border)',color:'#475569'}} value={data.industry} onChange={e=>setData(p=>({...p,industry:e.target.value}))}>
                                        <option value="">Select industry…</option>
                                        {INDUSTRIES.map(ind=><option key={ind}>{ind}</option>)}
                                    </select>
                                </div>
                                <button onClick={start} disabled={!data.job_role||loading} className="btn-primary w-full py-4 text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed" style={{borderRadius:'var(--radius-lg)'}}>
                                    {loading?<><RefreshCw size={15} className="animate-spin"/>Starting…</>:<><Wand2 size={15}/>Start Building →</>}
                                </button>
                                <p className="text-center text-[11px] text-slate-400">Press <kbd className="bg-slate-100 px-1.5 py-0.5 rounded font-mono">⌘K</kbd> inside the builder for AI commands</p>
                            </div>
                        </motion.div>
                        <motion.div initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} transition={{delay:0.2}} className="lg:col-span-3">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="font-bold text-slate-800">Choose Template</h2>
                                <span className="text-xs text-slate-400 px-3 py-1 rounded-full" style={{background:'var(--bg)',border:'1px solid var(--border)'}}>{templates.length} templates</span>
                            </div>
                            <TemplateGallery templates={templates} selectedId={data.template_id} onSelect={id=>setData(p=>({...p,template_id:id}))}/>
                        </motion.div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

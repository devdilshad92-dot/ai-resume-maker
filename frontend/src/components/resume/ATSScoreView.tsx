import { AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { ATSFeedback } from '../../types';

interface ATSScoreProps {
    score: number;
    feedback?: ATSFeedback;
}

export const ATSScoreView = ({ score, feedback }: ATSScoreProps) => {
    const getScoreColor = (s: number) => {
        if (s >= 80) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
        if (s >= 60) return 'text-amber-600 bg-amber-50 border-amber-200';
        return 'text-rose-600 bg-rose-50 border-rose-200';
    };

    return (
        <div className="space-y-6">
            {/* Score Card */}
            <Card className="overflow-hidden border-0 shadow-lg ring-1 ring-slate-200">
                <CardHeader className="bg-slate-50/50 pb-8 text-center border-b border-slate-100">
                    <CardTitle className="text-lg font-medium text-slate-500 uppercase tracking-wider text-xs mb-2">ATS Compatibility Score</CardTitle>
                    <div className="relative flex items-center justify-center">
                        <div className={`h-32 w-32 rounded-full border-8 flex items-center justify-center text-4xl font-black ${getScoreColor(score)}`}>
                            {score}
                        </div>
                    </div>
                    <CardDescription className="mt-4 text-base font-medium">
                        {score >= 80 ? 'Excellent! Ready for applications.' : score >= 60 ? 'Good, but needs refinement.' : 'Needs significant improvement.'}
                    </CardDescription>
                </CardHeader>
                
                <CardContent className="pt-6">
                    <div className="grid gap-4">
                        <div className="flex items-start gap-4 p-4 rounded-lg bg-slate-50 border border-slate-100">
                            <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
                            <div>
                                <h4 className="font-semibold text-sm text-slate-900">AI Analysis</h4>
                                <div className="mt-1 text-sm text-slate-600 space-y-2">
                                    {(feedback?.feedback || []).map((item: string, idx: number) => (
                                        <p key={idx}>{item}</p>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {feedback?.missing_keywords && feedback.missing_keywords.length > 0 && (
                            <div className="p-4 rounded-lg bg-rose-50/50 border border-rose-100">
                                <h4 className="font-semibold text-sm text-rose-900 mb-2">Missing Keywords</h4>
                                <div className="flex flex-wrap gap-2">
                                    {feedback.missing_keywords.map((kw: string, i: number) => (
                                        <span key={i} className="inline-flex items-center px-2 py-1 rounded-md bg-white border border-rose-200 text-xs font-medium text-rose-700">
                                            {kw}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                         {feedback?.improvement_tips && (
                            <div className="p-4 rounded-lg bg-emerald-50/50 border border-emerald-100 run-in">
                                 <h4 className="font-semibold text-sm text-emerald-900 mb-2">Quick Wins</h4>
                                 <ul className="list-disc list-inside text-sm text-emerald-800 space-y-1">
                                    {feedback.improvement_tips.map((tip: string, i: number) => (
                                        <li key={i}>{tip}</li>
                                    ))}
                                 </ul>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

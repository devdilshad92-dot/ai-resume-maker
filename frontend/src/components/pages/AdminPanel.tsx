'use client';

import { useEffect, useState } from 'react';
import { Settings, CheckCircle, XCircle, Save, RefreshCw } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import api from '@/api/client';

interface AIConfigResponse {
  primaryProvider: string;
  primaryModel: string;
  fallbackProvider: string | null;
  fallbackModel: string | null;
  configuredProviders: Record<string, boolean>;
  availableModels: Record<string, string[]>;
}

const PROVIDER_META: Record<string, { label: string; color: string; description: string }> = {
  gemini:     { label: 'Gemini',     color: 'blue',   description: 'Google DeepMind — fast, multimodal' },
  openai:     { label: 'OpenAI',     color: 'green',  description: 'GPT-4o and variants' },
  anthropic:  { label: 'Anthropic',  color: 'orange', description: 'Claude Opus, Sonnet, Haiku' },
  openrouter: { label: 'OpenRouter', color: 'purple', description: 'Unified API for 100+ models' },
};

const colorMap: Record<string, string> = {
  blue:   'bg-blue-50 border-blue-200 text-blue-700',
  green:  'bg-green-50 border-green-200 text-green-700',
  orange: 'bg-orange-50 border-orange-200 text-orange-700',
  purple: 'bg-purple-50 border-purple-200 text-purple-700',
};

const ringMap: Record<string, string> = {
  blue:   'ring-blue-500',
  green:  'ring-green-500',
  orange: 'ring-orange-500',
  purple: 'ring-purple-500',
};

export default function AdminPanel() {
  const [config, setConfig] = useState<AIConfigResponse | null>(null);
  const [primaryProvider, setPrimaryProvider] = useState('gemini');
  const [primaryModel, setPrimaryModel] = useState('gemini-2.5-flash');
  const [fallbackProvider, setFallbackProvider] = useState('gemini');
  const [fallbackModel, setFallbackModel] = useState('gemini-2.5-flash-lite');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get<AIConfigResponse>('/admin/ai-config').then(res => {
      const d = res.data;
      setConfig(d);
      setPrimaryProvider(d.primaryProvider);
      setPrimaryModel(d.primaryModel);
      setFallbackProvider(d.fallbackProvider ?? 'gemini');
      setFallbackModel(d.fallbackModel ?? 'gemini-2.5-flash-lite');
    }).finally(() => setLoading(false));
  }, []);

  const handlePrimaryProviderChange = (p: string) => {
    setPrimaryProvider(p);
    setPrimaryModel(config?.availableModels[p]?.[0] ?? '');
  };

  const handleFallbackProviderChange = (p: string) => {
    setFallbackProvider(p);
    setFallbackModel(config?.availableModels[p]?.[0] ?? '');
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.put<AIConfigResponse>('/admin/ai-config', {
        primaryProvider, primaryModel, fallbackProvider, fallbackModel,
      });
      setConfig(res.data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <RefreshCw className="animate-spin text-slate-400" size={28} />
        </div>
      </div>
    );
  }

  const models = config?.availableModels ?? {};
  const configured = config?.configuredProviders ?? {};

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="mx-auto max-w-4xl px-4 py-10 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Settings size={24} className="text-indigo-600" /> AI Configuration
            </h1>
            <p className="text-sm text-slate-500 mt-1">Set the primary and fallback models for all resume generation tasks.</p>
          </div>
          <Button variant="primary" onClick={handleSave} isLoading={saving} className="min-w-[130px]">
            {saved ? <><CheckCircle size={16} className="mr-2 text-green-300" />Saved!</> : <><Save size={16} className="mr-2" />Save Config</>}
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <ModelSelector label="Primary Model" description="Used for all AI operations by default." provider={primaryProvider} model={primaryModel} models={models} onProviderChange={handlePrimaryProviderChange} onModelChange={setPrimaryModel} badge="primary" />
          <ModelSelector label="Fallback Model" description="Activated automatically if the primary fails." provider={fallbackProvider} model={fallbackModel} models={models} onProviderChange={handleFallbackProviderChange} onModelChange={setFallbackModel} badge="fallback" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Provider Status</CardTitle>
            <CardDescription>API keys are read from environment variables. Set them in your <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">.env</code> file and restart the backend.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-slate-100">
              {Object.entries(PROVIDER_META).map(([key, meta]) => (
                <div key={key} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${colorMap[meta.color]}`}>{meta.label}</span>
                    <span className="text-sm text-slate-500">{meta.description}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm font-medium">
                    {configured[key] ? <><CheckCircle size={16} className="text-emerald-500" /><span className="text-emerald-600">Configured</span></> : <><XCircle size={16} className="text-slate-400" /><span className="text-slate-400">API key missing</span></>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface ModelSelectorProps {
  label: string; description: string; provider: string; model: string;
  models: Record<string, string[]>; onProviderChange: (p: string) => void;
  onModelChange: (m: string) => void; badge: 'primary' | 'fallback';
}

function ModelSelector({ label, description, provider, model, models, onProviderChange, onModelChange, badge }: ModelSelectorProps) {
  const badgeClass = badge === 'primary' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600';
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle className="text-base">{label}</CardTitle>
          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${badgeClass}`}>{badge}</span>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wide">Provider</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(PROVIDER_META).map(([key, meta]) => {
              const selected = provider === key;
              return (
                <button key={key} onClick={() => onProviderChange(key)} className={`rounded-full px-3 py-1 text-xs font-medium border transition-all ${selected ? `${colorMap[meta.color]} ring-2 ${ringMap[meta.color]} ring-offset-1` : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                  {meta.label}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wide">Model</p>
          <select value={model} onChange={e => onModelChange(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500">
            {(models[provider] ?? []).map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-2 text-xs text-slate-500">
          <span className="font-medium text-slate-700">{PROVIDER_META[provider]?.label}</span>{' / '}<span className="font-mono">{model}</span>
        </div>
      </CardContent>
    </Card>
  );
}

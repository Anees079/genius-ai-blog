import React, { useState } from 'react';
import { GeneratorConfig, AspectRatio, ImageSize, ApiConfig, ApiProvider } from '../types';
import { ASPECT_RATIO_OPTIONS, IMAGE_SIZE_OPTIONS, TONE_OPTIONS, AUDIENCE_OPTIONS } from '../constants';
import { Button } from './Button';
import { Sparkles, FileText, Image as ImageIcon, Key, Settings2 } from 'lucide-react';

interface InputSectionProps {
  config: GeneratorConfig;
  apiConfig: ApiConfig;
  onApiConfigChange: (updates: Partial<ApiConfig>) => void;
  onChange: (updates: Partial<GeneratorConfig>) => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

export const InputSection: React.FC<InputSectionProps> = ({ 
  config, 
  apiConfig, 
  onApiConfigChange, 
  onChange, 
  onGenerate, 
  isGenerating 
}) => {
  const [showSettings, setShowSettings] = useState(true);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:py-12 flex flex-col min-h-[calc(100vh-4rem)]">
      <div className="text-center mb-8 md:mb-10">
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">
          BlogGenius <span className="text-brand-600">AI</span>
        </h1>
        <p className="text-base md:text-lg text-slate-600 max-w-2xl mx-auto">
          Transform competitor content into fresh, engaging, and original blog posts. 
        </p>
      </div>

      <div className="flex-1">
        {/* API Configuration Panel */}
        <div className="bg-white rounded-xl shadow-md border border-brand-100 mb-8 overflow-hidden">
          <div 
            className="bg-brand-50 px-6 py-3 border-b border-brand-100 flex items-center justify-between cursor-pointer hover:bg-brand-100 transition-colors"
            onClick={() => setShowSettings(!showSettings)}
          >
            <div className="flex items-center gap-2 text-brand-800 font-semibold">
              <Key className="w-4 h-4" />
              <span>API Configuration</span>
            </div>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-brand-600">
              <Settings2 className="w-4 h-4" />
            </Button>
          </div>
          
          {showSettings && (
            <div className="p-6 grid gap-6 md:grid-cols-2 bg-white animate-in slide-in-from-top-2 duration-200">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">AI Provider</label>
                <select
                  value={apiConfig.provider}
                  onChange={(e) => onApiConfigChange({ provider: e.target.value as ApiProvider })}
                  className="w-full rounded-lg border-slate-300 border px-3 py-2 focus:border-brand-500 focus:ring-brand-500 bg-white text-slate-900"
                >
                  <option value="gemini">Google Gemini</option>
                  <option value="groq">Groq (Llama 3)</option>
                  <option value="openai">OpenAI (GPT-4o)</option>
                </select>
                <p className="text-xs text-slate-500">
                  {apiConfig.provider === 'gemini' && "Best all-rounder. Supports images."}
                  {apiConfig.provider === 'groq' && "Fastest text generation. No images."}
                  {apiConfig.provider === 'openai' && "High quality. Supports DALL-E 3."}
                </p>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">
                  API Key
                </label>
                <input
                  type="password"
                  value={apiConfig.apiKey}
                  onChange={(e) => onApiConfigChange({ apiKey: e.target.value })}
                  placeholder={`Enter your ${apiConfig.provider === 'gemini' ? 'Gemini' : apiConfig.provider === 'groq' ? 'Groq' : 'OpenAI'} API Key`}
                  className="w-full rounded-lg border-slate-300 border px-3 py-2 focus:border-brand-500 focus:ring-brand-500 font-mono text-sm bg-white text-slate-900 placeholder:text-slate-400"
                />
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden mb-8">
          <div className="p-6 md:p-8 space-y-8">
            
            {/* Main Content Inputs */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-slate-900 font-semibold text-lg border-b border-slate-100 pb-2">
                <FileText className="w-5 h-5 text-brand-500" />
                <h2>Content Details</h2>
              </div>
              
              <div className="grid gap-6 md:grid-cols-2">
                <div className="md:col-span-2 space-y-2">
                  <label className="block text-sm font-medium text-slate-700">Blog Title</label>
                  <input
                    type="text"
                    value={config.title}
                    onChange={(e) => onChange({ title: e.target.value })}
                    placeholder="e.g., 23 Sunroom Addition Ideas That Flow from Living Rooms"
                    className="w-full rounded-lg border-slate-300 border px-4 py-2.5 focus:border-brand-500 focus:ring-brand-500 transition-all shadow-sm bg-white text-slate-900 placeholder:text-slate-400"
                  />
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Reference / Competitor Content 
                    <span className="text-xs font-normal text-slate-500 ml-2">(Paste text here)</span>
                  </label>
                  <textarea
                    value={config.referenceContent}
                    onChange={(e) => onChange({ referenceContent: e.target.value })}
                    placeholder="Paste the competitor's article content here..."
                    className="w-full rounded-lg border-slate-300 border px-4 py-3 h-48 focus:border-brand-500 focus:ring-brand-500 transition-all shadow-sm resize-none bg-white text-slate-900 placeholder:text-slate-400"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">Tone of Voice</label>
                  <select
                    value={config.tone}
                    onChange={(e) => onChange({ tone: e.target.value })}
                    className="w-full rounded-lg border-slate-300 border px-4 py-2.5 focus:border-brand-500 focus:ring-brand-500 bg-white text-slate-900"
                  >
                    {TONE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">Target Audience</label>
                  <select
                    value={config.targetAudience}
                    onChange={(e) => onChange({ targetAudience: e.target.value })}
                    className="w-full rounded-lg border-slate-300 border px-4 py-2.5 focus:border-brand-500 focus:ring-brand-500 bg-white text-slate-900"
                  >
                    {AUDIENCE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Image Settings */}
            <div className="space-y-6 pt-4">
              <div className="flex items-center gap-2 text-slate-900 font-semibold text-lg border-b border-slate-100 pb-2">
                <ImageIcon className="w-5 h-5 text-brand-500" />
                <h2>Image Generation Settings</h2>
              </div>
              
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">Image Size</label>
                  <select
                    value={config.imageSize}
                    onChange={(e) => onChange({ imageSize: e.target.value as ImageSize })}
                    className="w-full rounded-lg border-slate-300 border px-4 py-2.5 focus:border-brand-500 focus:ring-brand-500 bg-white text-slate-900"
                  >
                    {IMAGE_SIZE_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">Aspect Ratio</label>
                  <select
                    value={config.aspectRatio}
                    onChange={(e) => onChange({ aspectRatio: e.target.value as AspectRatio })}
                    className="w-full rounded-lg border-slate-300 border px-4 py-2.5 focus:border-brand-500 focus:ring-brand-500 bg-white text-slate-900"
                  >
                    {ASPECT_RATIO_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex justify-end">
              <Button 
                size="lg" 
                onClick={onGenerate} 
                isLoading={isGenerating} 
                disabled={!config.title || !config.referenceContent || !apiConfig.apiKey}
                icon={<Sparkles className="w-5 h-5" />}
                className="w-full md:w-auto text-base px-8 py-3"
              >
                {isGenerating ? 'Generating Masterpiece...' : 'Generate Blog Post'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 mb-4 text-center border-t border-slate-200 pt-6">
        <p className="text-slate-500 text-xs md:text-sm font-bold tracking-widest uppercase">
          Created by Anees Ur Rehman
        </p>
      </div>
    </div>
  );
};
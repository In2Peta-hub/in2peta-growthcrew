import React, { useState } from 'react';
import {
  Globe,
  ExternalLink,
  Smartphone,
  Tablet,
  Monitor,
  RotateCw,
  Sparkles,
  ArrowRight,
  Layers,
  ChevronRight,
  Compass
} from 'lucide-react';

const SUBPAGES = [
  { id: 'home', name: 'Home / Marketing', path: '/website/index.html', icon: '🏠' },
  { id: 'crm', name: 'CRM Platform', path: '/website/subpages/crm.html', icon: '💼' },
  { id: 'ops', name: 'Operations', path: '/website/subpages/ops.html', icon: '⚙️' },
  { id: 'pricing', name: 'Pricing & Plans', path: '/website/subpages/pricing.html', icon: '💎' },
  { id: 'company', name: 'Company & Team', path: '/website/subpages/company.html', icon: '🏢' },
  { id: 'docs', name: 'Documentation', path: '/website/subpages/docs.html', icon: '📖' },
  { id: 'blog', name: 'Blog & Insights', path: '/website/subpages/blog.html', icon: '📝' },
  { id: 'contact', name: 'Contact Us', path: '/website/subpages/contact.html', icon: '📞' },
];

export default function ScaloraWebsite({ onLaunchStudio }) {
  const [currentPath, setCurrentPath] = useState('/website/index.html');
  const [viewport, setViewport] = useState('desktop'); // 'desktop' | 'tablet' | 'mobile'
  const [key, setKey] = useState(0);

  const getViewportWidth = () => {
    switch (viewport) {
      case 'mobile':
        return 'max-w-[400px] shadow-2xl rounded-3xl border-4 border-slate-700/80';
      case 'tablet':
        return 'max-w-[768px] shadow-2xl rounded-2xl border-2 border-slate-700/60';
      default:
        return 'w-full';
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-73px)] bg-[var(--brand-bg)] text-slate-100 overflow-hidden">
      {/* Interactive Control Toolbar */}
      <div className="bg-[var(--brand-surface)] border-b border-white/10 px-4 py-2.5 flex items-center justify-between shrink-0 gap-3">
        {/* Left: Subpage Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 scrollbar-thin">
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/[0.04] text-xs font-semibold text-slate-300 border border-white/5 mr-1">
            <Compass className="w-3.5 h-3.5 text-rose-400" />
            <span>Scalora Template</span>
          </div>
          {SUBPAGES.map((page) => (
            <button
              key={page.id}
              onClick={() => setCurrentPath(page.path)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 cursor-pointer ${
                currentPath === page.path
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm font-semibold'
                  : 'bg-white/[0.03] text-slate-400 hover:text-white hover:bg-white/[0.08] border border-white/5'
              }`}
            >
              <span>{page.icon}</span>
              <span>{page.name}</span>
            </button>
          ))}
        </div>

        {/* Right: Viewport Toggles & CTA */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Viewport Selector */}
          <div className="hidden sm:flex items-center bg-black/40 p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setViewport('desktop')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewport === 'desktop' ? 'bg-white/15 text-white' : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Desktop View (100%)"
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewport('tablet')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewport === 'tablet' ? 'bg-white/15 text-white' : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Tablet View (768px)"
            >
              <Tablet className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewport('mobile')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewport === 'mobile' ? 'bg-white/15 text-white' : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Mobile View (390px)"
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Refresh */}
          <button
            onClick={() => setKey((k) => k + 1)}
            className="p-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-white border border-white/10 transition-all cursor-pointer"
            title="Reload Frame"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>

          {/* Open in New Window */}
          <a
            href={currentPath}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs font-semibold text-slate-300 hover:text-white border border-white/10 transition-all cursor-pointer"
            title="Open standalone page in full tab"
          >
            <span>Full Tab</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>

          {/* Connect to Social Studio */}
          <button
            onClick={onLaunchStudio}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-xs font-bold text-white shadow-lg shadow-rose-500/25 transition-all cursor-pointer transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Launch Social Studio</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Frame Container */}
      <div className="flex-1 w-full bg-[#050608] flex items-center justify-center overflow-auto p-0 sm:p-2">
        <div className={`h-full transition-all duration-300 overflow-hidden ${getViewportWidth()}`}>
          <iframe
            key={key}
            src={currentPath}
            title="Scalora Website Template"
            className="w-full h-full border-0 bg-black"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        </div>
      </div>
    </div>
  );
}

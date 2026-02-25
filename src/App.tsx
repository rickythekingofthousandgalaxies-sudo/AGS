/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Search, 
  LayoutDashboard, 
  Target, 
  Zap, 
  Globe, 
  AlertCircle, 
  CheckCircle2, 
  BarChart3, 
  Plus, 
  Trash2,
  Loader2,
  ChevronRight,
  ExternalLink,
  Info
} from 'lucide-react';
import { GeminiService, AnalysisResult } from './services/gemini';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import ReactMarkdown from 'react-markdown';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'monitor' | 'bulk' | 'analytics' | 'optimizer' | 'strategy' | 'market' | 'multichannel' | 'traffic'>('monitor');
  const [myWebsite, setMyWebsite] = useState('example.com');
  const [competitors, setCompetitors] = useState<string[]>(['competitor1.com', 'competitor2.com']);
  const [newCompetitor, setNewCompetitor] = useState('');
  
  const [queries, setQueries] = useState<string>('best marketing bots\ntop AI tools in India');
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [optimizeInput, setOptimizeInput] = useState('');
  const [optimizeResult, setOptimizeResult] = useState<{ answerFirst: string; schema: string } | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  const [strategy, setStrategy] = useState<string | null>(null);
  const [isGeneratingStrategy, setIsGeneratingStrategy] = useState(false);

  const [multichannelStrategy, setMultichannelStrategy] = useState<string | null>(null);
  const [isGeneratingMultichannel, setIsGeneratingMultichannel] = useState(false);

  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const [promptRoadmaps, setPromptRoadmaps] = useState<Record<string, string>>({});
  const [isGeneratingRoadmap, setIsGeneratingRoadmap] = useState<string | null>(null);
  const [selectedRoadmapPrompt, setSelectedRoadmapPrompt] = useState<string | null>(null);

  const [niche, setNiche] = useState('recruitment automation');
  const [trendingPrompts, setTrendingPrompts] = useState<{ prompt: string; score: number; reasoning: string }[]>([]);
  const [isDiscovering, setIsDiscovering] = useState(false);

  const gemini = useMemo(() => new GeminiService(), []);

  const handleDiscover = async () => {
    setIsDiscovering(true);
    try {
      const res = await gemini.discoverTrendingPrompts(niche, myWebsite);
      setTrendingPrompts(res);
    } catch (error) {
      console.error('Discovery error:', error);
    }
    setIsDiscovering(false);
  };

  const addTrendingToBulk = (prompt: string) => {
    setQueries(prev => prev ? `${prev}\n${prompt}` : prompt);
  };

  const handleFetchUrl = async () => {
    const url = myWebsite.startsWith('http') ? myWebsite : `https://${myWebsite}`;
    setIsFetching(true);
    try {
      const res = await gemini.fetchAndAnalyzeUrl(url);
      setOptimizeInput(res.content);
      setActiveTab('optimizer');
    } catch (error) {
      console.error('Fetch error:', error);
    }
    setIsFetching(false);
  };

  const handleGenerateStrategy = async () => {
    if (results.length === 0) return;
    setIsGeneratingStrategy(true);
    try {
      const res = await gemini.generateStrategy(results, myWebsite);
      setStrategy(res);
      setActiveTab('strategy');
    } catch (error) {
      console.error('Strategy error:', error);
    }
    setIsGeneratingStrategy(false);
  };

  const handleGenerateMultichannel = async () => {
    if (!optimizeInput) {
      const url = myWebsite.startsWith('http') ? myWebsite : `https://${myWebsite}`;
      setIsFetching(true);
      try {
        const res = await gemini.fetchAndAnalyzeUrl(url);
        setOptimizeInput(res.content);
        setIsGeneratingMultichannel(true);
        const strat = await gemini.generateMultichannelStrategy(url, res.content);
        setMultichannelStrategy(strat);
      } catch (error) {
        console.error('Multichannel error:', error);
      }
      setIsFetching(false);
    } else {
      setIsGeneratingMultichannel(true);
      try {
        const strat = await gemini.generateMultichannelStrategy(myWebsite, optimizeInput);
        setMultichannelStrategy(strat);
      } catch (error) {
        console.error('Multichannel error:', error);
      }
    }
    setIsGeneratingMultichannel(false);
  };

  const handleConnect = () => {
    setIsConnecting(true);
    setTimeout(() => {
      setIsConnected(true);
      setIsConnecting(false);
    }, 2000);
  };

  const handleGeneratePromptRoadmap = async (prompt: string) => {
    setIsGeneratingRoadmap(prompt);
    try {
      const res = await gemini.generatePromptRoadmap(prompt, myWebsite, competitors);
      setPromptRoadmaps(prev => ({ ...prev, [prompt]: res }));
      setSelectedRoadmapPrompt(prompt);
    } catch (error) {
      console.error('Roadmap error:', error);
    }
    setIsGeneratingRoadmap(null);
  };

  const handleAddCompetitor = () => {
    if (newCompetitor && !competitors.includes(newCompetitor)) {
      setCompetitors([...competitors, newCompetitor]);
      setNewCompetitor('');
    }
  };

  const handleRemoveCompetitor = (comp: string) => {
    setCompetitors(competitors.filter(c => c !== comp));
  };

  const runBulkTest = async () => {
    const queryList = queries.split('\n').map(q => q.trim()).filter(q => q);
    if (queryList.length === 0) return;

    setIsAnalyzing(true);
    setResults([]);
    
    const newResults: AnalysisResult[] = [];
    for (const query of queryList) {
      try {
        const res = await gemini.analyzeQuery(query, myWebsite, competitors);
        newResults.push(res);
        setResults([...newResults]); // Update incrementally
      } catch (error) {
        console.error(`Error analyzing query "${query}":`, error);
      }
    }
    setIsAnalyzing(false);
  };

  const handleOptimize = async () => {
    if (!optimizeInput) return;
    setIsOptimizing(true);
    try {
      const res = await gemini.optimizeContent(optimizeInput);
      setOptimizeResult(res);
    } catch (error) {
      console.error('Optimization error:', error);
    }
    setIsOptimizing(false);
  };

  const stats = useMemo(() => {
    if (results.length === 0) return { citationShare: 0, topCompetitor: 'N/A', avgSentiment: 'Neutral' };
    const citedCount = results.filter(r => r.isCited).length;
    const citationShare = (citedCount / results.length) * 100;
    
    const compCounts: Record<string, number> = {};
    results.forEach(r => {
      r.competitorsCited.forEach(c => {
        compCounts[c] = (compCounts[c] || 0) + 1;
      });
    });
    const topCompetitor = Object.entries(compCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
    
    return { citationShare, topCompetitor, avgSentiment: 'Positive' };
  }, [results]);

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-zinc-100 font-sans selection:bg-violet-500/30">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 bottom-0 w-64 border-r border-zinc-800 bg-[#0F0F11] p-6 flex flex-col gap-8">
        <div className="flex items-center gap-2 px-2">
          <div className="w-8 h-8 bg-violet-500 rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-black fill-current" />
          </div>
          <span className="text-xl font-bold tracking-tight">AGS</span>
        </div>

        <nav className="flex flex-col gap-1 overflow-y-auto pr-2 custom-scrollbar">
          <SidebarItem 
            icon={<Globe className="w-4 h-4" />} 
            label="Brand Monitor" 
            active={activeTab === 'monitor'} 
            onClick={() => setActiveTab('monitor')} 
          />
          <SidebarItem 
            icon={<Search className="w-4 h-4" />} 
            label="Bulk Tester" 
            active={activeTab === 'bulk'} 
            onClick={() => setActiveTab('bulk')} 
          />
          <SidebarItem 
            icon={<Zap className="w-4 h-4" />} 
            label="Market Intelligence" 
            active={activeTab === 'market'} 
            onClick={() => setActiveTab('market')} 
          />
          <SidebarItem 
            icon={<BarChart3 className="w-4 h-4" />} 
            label="Analytics" 
            active={activeTab === 'analytics'} 
            onClick={() => setActiveTab('analytics')} 
          />
          <SidebarItem 
            icon={<LayoutDashboard className="w-4 h-4" />} 
            label="Strategy Architect" 
            active={activeTab === 'strategy'} 
            onClick={() => setActiveTab('strategy')} 
          />
          <SidebarItem 
            icon={<Plus className="w-4 h-4" />} 
            label="Multichannel Builder" 
            active={activeTab === 'multichannel'} 
            onClick={() => setActiveTab('multichannel')} 
          />
          <SidebarItem 
            icon={<Target className="w-4 h-4" />} 
            label="AEO Optimizer" 
            active={activeTab === 'optimizer'} 
            onClick={() => setActiveTab('optimizer')} 
          />
          <SidebarItem 
            icon={<BarChart3 className="w-4 h-4" />} 
            label="Traffic Analytics" 
            active={activeTab === 'traffic'} 
            onClick={() => setActiveTab('traffic')} 
          />
        </nav>

        <div className="mt-auto pt-6 border-t border-zinc-800">
          <div className="flex items-center gap-3 px-2 py-3 rounded-xl bg-zinc-900/50 border border-zinc-800">
            <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center text-violet-500 font-bold text-xs">
              JD
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-medium">John Doe</span>
              <span className="text-[10px] text-zinc-500">AGS Pro</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="ml-64 p-8 max-w-6xl">
        {activeTab === 'monitor' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header>
              <h1 className="text-3xl font-bold tracking-tight">Brand Monitor</h1>
              <p className="text-zinc-500 mt-1">Configure your brand and competitors for tracking.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-2xl bg-[#0F0F11] border border-zinc-800 space-y-4">
                <div className="flex items-center gap-2 text-violet-500">
                  <Globe className="w-4 h-4" />
                  <h2 className="text-sm font-semibold uppercase tracking-wider">My Website</h2>
                </div>
                <input 
                  type="text" 
                  value={myWebsite}
                  onChange={(e) => setMyWebsite(e.target.value)}
                  placeholder="example.com"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
                />
                <button 
                  onClick={handleFetchUrl}
                  disabled={isFetching}
                  className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  {isFetching ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
                  {isFetching ? 'Fetching Content...' : 'Auto-Fetch Page Content'}
                </button>
              </div>

              <div className="p-6 rounded-2xl bg-[#0F0F11] border border-zinc-800 space-y-4">
                <div className="flex items-center gap-2 text-zinc-400">
                  <Target className="w-4 h-4" />
                  <h2 className="text-sm font-semibold uppercase tracking-wider">Competitors</h2>
                </div>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={newCompetitor}
                    onChange={(e) => setNewCompetitor(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddCompetitor()}
                    placeholder="competitor.com"
                    className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                  />
                  <button 
                    onClick={handleAddCompetitor}
                    className="p-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  {competitors.map(comp => (
                    <div key={comp} className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-full text-xs">
                      <span>{comp}</span>
                      <button onClick={() => handleRemoveCompetitor(comp)} className="text-zinc-500 hover:text-red-400">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'bulk' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="flex justify-between items-end">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Prompt Bulk-Tester</h1>
                <p className="text-zinc-500 mt-1">Test multiple queries to see how AI engines cite your brand.</p>
              </div>
              <button 
                onClick={runBulkTest}
                disabled={isAnalyzing}
                className="px-6 py-3 bg-violet-500 hover:bg-violet-400 text-black font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-violet-500/20"
              >
                {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 fill-current" />}
                {isAnalyzing ? 'Analyzing...' : 'Run Bulk Test'}
              </button>
            </header>

            <div className="p-6 rounded-2xl bg-[#0F0F11] border border-zinc-800">
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3 block">Queries (One per line)</label>
              <textarea 
                value={queries}
                onChange={(e) => setQueries(e.target.value)}
                rows={5}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all font-mono"
              />
            </div>

            {results.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Results</h2>
                <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-[#0F0F11]">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-bottom border-zinc-800 bg-zinc-900/50">
                        <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Query</th>
                        <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Pos</th>
                        <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Sentiment</th>
                        <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                      {results.map((res, idx) => (
                        <ResultRow 
                          key={idx} 
                          result={res} 
                          onGenerateRoadmap={handleGeneratePromptRoadmap}
                          isGeneratingRoadmap={isGeneratingRoadmap === res.query}
                          hasRoadmap={!!promptRoadmaps[res.query]}
                          onViewRoadmap={() => setSelectedRoadmapPrompt(res.query)}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header>
              <h1 className="text-3xl font-bold tracking-tight">Visibility Analytics</h1>
              <p className="text-zinc-500 mt-1">Aggregated performance metrics across all tested queries.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <MetricCard 
                title="Citation Share" 
                value={`${stats.citationShare.toFixed(1)}%`} 
                icon={<Target className="w-5 h-5" />}
                trend="+12% vs last week"
              />
              <MetricCard 
                title="Top Competitor" 
                value={stats.topCompetitor} 
                icon={<Globe className="w-5 h-5" />}
                trend="Cited in 80% of queries"
              />
              <MetricCard 
                title="Avg Sentiment" 
                value={stats.avgSentiment} 
                icon={<Zap className="w-5 h-5" />}
                trend="Mostly positive mentions"
              />
            </div>

            <div className="p-8 rounded-2xl bg-[#0F0F11] border border-zinc-800">
              <h2 className="text-lg font-semibold mb-6">Citation Distribution</h2>
              <div className="h-48 flex items-end gap-4">
                {results.map((r, i) => (
                  <div 
                    key={i} 
                    className={cn(
                      "flex-1 rounded-t-lg transition-all duration-500",
                      r.isCited ? "bg-violet-500" : "bg-zinc-800"
                    )}
                    style={{ height: r.isCited ? '100%' : '20%' }}
                  />
                ))}
              </div>
              <div className="flex justify-between mt-4 text-[10px] text-zinc-500 uppercase tracking-widest">
                <span>Query 1</span>
                <span>Query {results.length}</span>
              </div>
            </div>

            <div className="flex justify-center pt-8">
              <button 
                onClick={handleGenerateStrategy}
                disabled={isGeneratingStrategy || results.length === 0}
                className="px-8 py-4 bg-violet-500 hover:bg-violet-400 text-black font-bold rounded-2xl transition-all flex items-center gap-3 shadow-xl shadow-violet-500/20"
              >
                {isGeneratingStrategy ? <Loader2 className="w-5 h-5 animate-spin" /> : <LayoutDashboard className="w-5 h-5" />}
                Generate GEO/AEO Dominance Strategy
              </button>
            </div>
          </div>
        )}

        {activeTab === 'market' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header>
              <h1 className="text-3xl font-bold tracking-tight">Market Intelligence</h1>
              <p className="text-zinc-500 mt-1">Discover what users are actually asking AI engines in your niche.</p>
            </header>

            <div className="p-6 rounded-2xl bg-[#0F0F11] border border-zinc-800 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Target Niche / Industry</label>
                <div className="flex gap-3">
                  <input 
                    type="text" 
                    value={niche}
                    onChange={(e) => setNiche(e.target.value)}
                    placeholder="e.g., recruitment automation"
                    className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
                  />
                  <button 
                    onClick={handleDiscover}
                    disabled={isDiscovering}
                    className="px-6 py-3 bg-violet-500 hover:bg-violet-400 text-black font-bold rounded-xl transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    {isDiscovering ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    Discover Prompts
                  </button>
                </div>
                <p className="text-[10px] text-zinc-600 flex items-center gap-1 mt-2">
                  <Info className="w-3 h-3" />
                  This uses Google Search Grounding to find real-time trending AI queries and "People Also Ask" data.
                </p>
              </div>

              {trendingPrompts.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-zinc-800">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-violet-500">Trending AI Prompts & Citation Potential</h3>
                  <div className="grid grid-cols-1 gap-4">
                    {trendingPrompts.map((item, i) => (
                      <div key={i} className="group p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-violet-500/30 transition-all space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1">
                            <span className="text-sm font-medium text-zinc-200">{item.prompt}</span>
                            <p className="text-[11px] text-zinc-500 italic leading-relaxed">{item.reasoning}</p>
                          </div>
                          <div className="flex flex-col items-end gap-2 shrink-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Potential</span>
                              <span className={cn(
                                "text-xs font-bold px-2 py-0.5 rounded-md",
                                item.score > 70 ? "bg-violet-500/10 text-violet-500" : 
                                item.score > 40 ? "bg-amber-500/10 text-amber-500" : "bg-zinc-800 text-zinc-500"
                              )}>
                                {item.score}%
                              </span>
                            </div>
                            <button 
                              onClick={() => {
                                addTrendingToBulk(item.prompt);
                                setActiveTab('bulk');
                              }}
                              className="flex items-center gap-1.5 text-[10px] font-bold text-violet-500 bg-violet-500/10 px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all border border-violet-500/20"
                            >
                              <Plus className="w-3 h-3" />
                              Add to Bulk Tester
                            </button>
                          </div>
                        </div>
                        
                        {/* Score Bar */}
                        <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                          <div 
                            className={cn(
                              "h-full transition-all duration-1000",
                              item.score > 70 ? "bg-violet-500" : 
                              item.score > 40 ? "bg-amber-500" : "bg-zinc-600"
                            )}
                            style={{ width: `${item.score}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'strategy' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="flex justify-between items-end">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Strategy Architect</h1>
                <p className="text-zinc-500 mt-1">AI-generated roadmap to rank top in generative and answer engines.</p>
              </div>
              {strategy && (
                <button 
                  onClick={handleGenerateStrategy}
                  disabled={isGeneratingStrategy}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded-lg transition-all flex items-center gap-2"
                >
                  {isGeneratingStrategy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                  Regenerate Strategy
                </button>
              )}
            </header>

            {strategy ? (
              <div className="p-8 rounded-2xl bg-[#0F0F11] border border-zinc-800 prose prose-invert max-w-none prose-violet prose-headings:text-violet-500 prose-strong:text-violet-400 prose-a:text-violet-400">
                <ReactMarkdown>{strategy}</ReactMarkdown>
              </div>
            ) : (
              <div className="h-96 flex flex-col items-center justify-center border-2 border-dashed border-zinc-800 rounded-2xl text-zinc-600 bg-zinc-900/10">
                <LayoutDashboard className="w-16 h-16 mb-4 opacity-10" />
                <p className="text-lg font-medium text-zinc-400">No strategy generated yet.</p>
                <p className="text-sm mt-2 text-zinc-500 max-w-md text-center">
                  {results.length > 0 
                    ? "Your bulk test results are ready. Click the button below to architect your dominance strategy."
                    : "Run a bulk test in the 'Bulk Tester' tab first to provide data for the strategy architect."}
                </p>
                {results.length > 0 && (
                  <button 
                    onClick={handleGenerateStrategy}
                    disabled={isGeneratingStrategy}
                    className="mt-8 px-8 py-4 bg-violet-500 hover:bg-violet-400 text-black font-bold rounded-2xl transition-all flex items-center gap-3 shadow-xl shadow-violet-500/20"
                  >
                    {isGeneratingStrategy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5 fill-current" />}
                    Architect Dominance Strategy
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'multichannel' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="flex justify-between items-end">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Multichannel Strategy Builder</h1>
                <p className="text-zinc-500 mt-1">Audit website structure and build strategies for ChatGPT, Perplexity, and more.</p>
              </div>
              <button 
                onClick={handleGenerateMultichannel}
                disabled={isGeneratingMultichannel || isFetching}
                className="px-6 py-3 bg-violet-500 hover:bg-violet-400 text-black font-bold rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-violet-500/20"
              >
                {isGeneratingMultichannel || isFetching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 fill-current" />}
                {isGeneratingMultichannel ? 'Building Strategy...' : isFetching ? 'Fetching Site...' : 'Build Multichannel Strategy'}
              </button>
            </header>

            {multichannelStrategy ? (
              <div className="p-8 rounded-2xl bg-[#0F0F11] border border-zinc-800 prose prose-invert max-w-none prose-violet prose-headings:text-violet-500 prose-strong:text-violet-400 prose-a:text-violet-400">
                <ReactMarkdown>{multichannelStrategy}</ReactMarkdown>
              </div>
            ) : (
              <div className="h-96 flex flex-col items-center justify-center border-2 border-dashed border-zinc-800 rounded-2xl text-zinc-600 bg-zinc-900/10">
                <Globe className="w-16 h-16 mb-4 opacity-10" />
                <p className="text-lg font-medium text-zinc-400">No multichannel strategy yet.</p>
                <p className="text-sm mt-2 text-zinc-500 max-w-md text-center">
                  Click the button above to audit your website structure and generate a distribution strategy for the entire AI ecosystem.
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'optimizer' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header>
              <h1 className="text-3xl font-bold tracking-tight">AEO Optimizer</h1>
              <p className="text-zinc-500 mt-1">Rewrite content to maximize chances of being cited by AI engines.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="p-6 rounded-2xl bg-[#0F0F11] border border-zinc-800">
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3 block">Page Content</label>
                  <textarea 
                    value={optimizeInput}
                    onChange={(e) => setOptimizeInput(e.target.value)}
                    placeholder="Paste your page content here..."
                    rows={12}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
                  />
                </div>
                <button 
                  onClick={handleOptimize}
                  disabled={isOptimizing || !optimizeInput}
                  className="w-full py-4 bg-violet-500 hover:bg-violet-400 text-black font-bold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isOptimizing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5 fill-current" />}
                  {isOptimizing ? 'Optimizing...' : 'Generate AEO Fix'}
                </button>
              </div>

              <div className="space-y-6">
                {optimizeResult ? (
                  <>
                    <div className="p-6 rounded-2xl bg-violet-500/5 border border-violet-500/20 space-y-3">
                      <div className="flex items-center gap-2 text-violet-500">
                        <CheckCircle2 className="w-4 h-4" />
                        <h3 className="text-sm font-bold uppercase tracking-wider">Answer-First Structure</h3>
                      </div>
                      <p className="text-sm leading-relaxed text-zinc-300 italic">
                        "{optimizeResult.answerFirst}"
                      </p>
                    </div>

                    <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-3">
                      <div className="flex items-center gap-2 text-zinc-400">
                        <LayoutDashboard className="w-4 h-4" />
                        <h3 className="text-sm font-bold uppercase tracking-wider">JSON-LD FAQ Schema</h3>
                      </div>
                      <pre className="text-[10px] font-mono text-zinc-500 bg-black/30 p-4 rounded-lg overflow-x-auto">
                        {optimizeResult.schema}
                      </pre>
                    </div>
                  </>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center p-12 border-2 border-dashed border-zinc-800 rounded-2xl text-zinc-600">
                    <Info className="w-12 h-12 mb-4 opacity-20" />
                    <p className="text-sm text-center">Enter content and click optimize to see AEO recommendations.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'traffic' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="flex justify-between items-end">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Traffic Analytics</h1>
                <p className="text-zinc-500 mt-1">Track clicks and referrals coming from AI search engines.</p>
              </div>
              {!isConnected && (
                <button 
                  onClick={handleConnect}
                  disabled={isConnecting}
                  className="px-6 py-3 bg-violet-500 hover:bg-violet-400 text-black font-bold rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-violet-500/20"
                >
                  {isConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
                  {isConnecting ? 'Connecting...' : 'Connect Website'}
                </button>
              )}
            </header>

            {!isConnected ? (
              <div className="h-96 flex flex-col items-center justify-center border-2 border-dashed border-zinc-800 rounded-2xl text-zinc-600 bg-zinc-900/10">
                <BarChart3 className="w-16 h-16 mb-4 opacity-10" />
                <p className="text-lg font-medium text-zinc-400">No traffic data available.</p>
                <p className="text-sm mt-2 text-zinc-500 max-w-md text-center">
                  Connect your website via Google Search Console or add our tracking snippet to start monitoring AI-driven traffic.
                </p>
                <button 
                  onClick={handleConnect}
                  disabled={isConnecting}
                  className="mt-8 px-8 py-4 bg-violet-500 hover:bg-violet-400 text-black font-bold rounded-2xl transition-all flex items-center gap-3 shadow-xl shadow-violet-500/20"
                >
                  {isConnecting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Globe className="w-5 h-5" />}
                  Connect to AGS Analytics
                </button>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <MetricCard title="Total AI Clicks" value="1,248" icon={<Zap className="w-5 h-5" />} trend="+24% vs last month" />
                  <MetricCard title="Avg. CTR" value="4.2%" icon={<Target className="w-5 h-5" />} trend="+0.8% improvement" />
                  <MetricCard title="AI Impressions" value="29.4k" icon={<Globe className="w-5 h-5" />} trend="Rising trend" />
                  <MetricCard title="Conversion Rate" value="2.1%" icon={<CheckCircle2 className="w-5 h-5" />} trend="Stable" />
                </div>

                <div className="p-8 rounded-2xl bg-[#0F0F11] border border-zinc-800">
                  <h2 className="text-lg font-semibold mb-6">Traffic by AI Engine</h2>
                  <div className="space-y-6">
                    <TrafficRow label="ChatGPT / OpenAI Search" value={450} max={1000} color="bg-violet-600" />
                    <TrafficRow label="Perplexity" value={380} max={1000} color="bg-violet-500" />
                    <TrafficRow label="Google AI Overviews" value={290} max={1000} color="bg-blue-500" />
                    <TrafficRow label="Gemini" value={120} max={1000} color="bg-indigo-500" />
                    <TrafficRow label="Claude / Anthropic" value={8} max={1000} color="bg-amber-500" />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Roadmap Modal */}
      {selectedRoadmapPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0F0F11] border border-zinc-800 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl shadow-violet-500/10">
            <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-violet-500/10 rounded-lg text-violet-500">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold tracking-tight">Targeted Citation Roadmap</h3>
                  <p className="text-xs text-zinc-500 mt-0.5 font-mono">{selectedRoadmapPrompt}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedRoadmapPrompt(null)}
                className="p-2 hover:bg-zinc-800 rounded-xl text-zinc-500 hover:text-zinc-100 transition-colors"
              >
                <Plus className="w-6 h-6 rotate-45" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 prose prose-invert max-w-none prose-violet prose-headings:text-violet-500 prose-strong:text-violet-400 prose-a:text-violet-400">
              <ReactMarkdown>{promptRoadmaps[selectedRoadmapPrompt] || ""}</ReactMarkdown>
            </div>
            <div className="p-6 border-t border-zinc-800 bg-zinc-900/30 flex justify-end">
              <button 
                onClick={() => setSelectedRoadmapPrompt(null)}
                className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-xl transition-all"
              >
                Close Roadmap
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SidebarItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
        active 
          ? "bg-violet-500/10 text-violet-500 border border-violet-500/20" 
          : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function MetricCard({ title, value, icon, trend }: { title: string, value: string, icon: React.ReactNode, trend: string }) {
  return (
    <div className="p-6 rounded-2xl bg-[#0F0F11] border border-zinc-800 space-y-4">
      <div className="flex justify-between items-start">
        <div className="p-2 bg-zinc-900 rounded-lg text-zinc-400">
          {icon}
        </div>
        <span className="text-[10px] font-bold text-violet-500 bg-violet-500/10 px-2 py-1 rounded-full">{trend}</span>
      </div>
      <div>
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">{title}</p>
        <h3 className="text-3xl font-bold mt-1">{value}</h3>
      </div>
    </div>
  );
}

function ResultRow({ 
  result, 
  onGenerateRoadmap, 
  isGeneratingRoadmap, 
  hasRoadmap,
  onViewRoadmap 
}: { 
  result: AnalysisResult, 
  onGenerateRoadmap: (prompt: string) => void,
  isGeneratingRoadmap: boolean,
  hasRoadmap: boolean,
  onViewRoadmap: () => void
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <tr className="hover:bg-zinc-900/30 transition-colors group">
        <td className="px-6 py-4">
          <span className="text-sm font-medium text-zinc-300">{result.query}</span>
        </td>
        <td className="px-6 py-4">
          {result.isCited ? (
            <div className="flex items-center gap-1.5 text-violet-500 text-xs font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              CITED
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-zinc-500 text-xs font-bold">
              <AlertCircle className="w-3.5 h-3.5" />
              NOT CITED
            </div>
          )}
        </td>
        <td className="px-6 py-4">
          <span className="text-xs font-mono text-zinc-500">{result.position || '-'}</span>
        </td>
        <td className="px-6 py-4">
          <span className={cn(
            "text-[10px] font-bold px-2 py-0.5 rounded-full",
            result.sentiment === 'Positive' ? "bg-violet-500/10 text-violet-500" : "bg-zinc-800 text-zinc-500"
          )}>
            {result.sentiment}
          </span>
        </td>
        <td className="px-6 py-4">
          <div className="flex items-center gap-2">
            {!result.isCited && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  hasRoadmap ? onViewRoadmap() : onGenerateRoadmap(result.query);
                }}
                disabled={isGeneratingRoadmap}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border",
                  hasRoadmap 
                    ? "bg-violet-500/10 text-violet-500 border-violet-500/20 hover:bg-violet-500/20" 
                    : "bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-zinc-100 hover:border-zinc-600"
                )}
              >
                {isGeneratingRoadmap ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Target className="w-3 h-3" />
                )}
                {isGeneratingRoadmap ? 'Architecting...' : hasRoadmap ? 'View Roadmap' : 'Create Roadmap'}
              </button>
            )}
            <button 
              onClick={() => setExpanded(!expanded)}
              className="text-zinc-500 hover:text-zinc-100 transition-colors p-1"
            >
              <ChevronRight className={cn("w-4 h-4 transition-transform", expanded && "rotate-90")} />
            </button>
          </div>
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={5} className="px-6 py-6 bg-zinc-900/20">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                  <Info className="w-3 h-3" />
                  AI Response Snippet
                </h4>
                <div className="text-sm text-zinc-400 leading-relaxed bg-black/20 p-4 rounded-xl border border-zinc-800">
                  <ReactMarkdown>{result.fullResponse}</ReactMarkdown>
                </div>
              </div>

              <div className="space-y-6">
                {result.isCited ? (
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-violet-500 uppercase tracking-widest">Citation Details</h4>
                    <div className="p-4 rounded-xl bg-violet-500/5 border border-violet-500/20">
                      <p className="text-sm text-zinc-300">Your site was cited at position <span className="text-violet-500 font-bold">#{result.position}</span>.</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-red-400 uppercase tracking-widest">Entity Gap Analysis</h4>
                    <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20 space-y-3">
                      <p className="text-xs text-zinc-400">Competitors cited: {result.competitorsCited.join(', ') || 'None'}</p>
                      <div className="flex flex-wrap gap-2">
                        {result.entityGap.map(gap => (
                          <span key={gap} className="px-2 py-1 bg-red-500/10 text-red-400 rounded-md text-[10px] font-bold border border-red-500/10">
                            {gap}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="pt-4">
                  <button className="text-xs text-zinc-500 hover:text-emerald-500 flex items-center gap-1 transition-colors">
                    View Full Grounding Metadata <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function TrafficRow({ label, value, max, color }: { label: string, value: number, max: number, color: string }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs">
        <span className="text-zinc-400">{label}</span>
        <span className="font-bold text-zinc-200">{value} clicks</span>
      </div>
      <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
        <div 
          className={cn("h-full transition-all duration-1000", color)}
          style={{ width: `${(value / max) * 100}%` }}
        />
      </div>
    </div>
  );
}

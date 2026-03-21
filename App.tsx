
import React, { useState, useEffect, useMemo } from 'react';
import { TN_SITES } from './mockData';
import { Site, SimilarityResult, AnalysisState } from './types';
import Dashboard from './components/Dashboard';
import SiteDetails from './components/SiteDetails';
import SimilarityMatrix from './components/SimilarityMatrix';
import NetworkGraph from './components/NetworkGraph';
import CodeViewer from './components/CodeViewer';
import ReportsExport from './components/ReportsExport';
import LandingPage from './components/LandingPage';
import { discoverPatterns } from './geminiService';

const App: React.FC = () => {
  const [view, setView] = useState<'landing' | 'app'>('landing');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'similarity' | 'network' | 'reports' | 'code'>('dashboard');
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [sites, setSites] = useState<Site[]>(TN_SITES);
  const [similarityData, setSimilarityData] = useState<SimilarityResult[]>([]);
  const [globalInsights, setGlobalInsights] = useState<string | null>(null);
  const [isComputingInsights, setIsComputingInsights] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [apiKey, setApiKey] = useState(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('GEMINI_API_KEY') || '' : '';
  });

  const handleSaveSettings = () => {
    localStorage.setItem('GEMINI_API_KEY', apiKey);
    setShowSettings(false);
    window.location.reload(); // Reload to apply the new key to service instances
  };

  // Simple cosine-like similarity calculation based on shared categories and materials
  const calculateSim = (a: Site, b: Site) => {
    const materialsA = new Set(a.artifacts.map(art => art.material.toLowerCase()));
    const materialsB = new Set(b.artifacts.map(art => art.material.toLowerCase()));
    const intersection = new Set([...materialsA].filter(x => materialsB.has(x)));
    const union = new Set([...materialsA, ...materialsB]);
    if (union.size === 0) return 0;
    return intersection.size / union.size;
  };

  useEffect(() => {
    const results: SimilarityResult[] = [];
    for (let i = 0; i < sites.length; i++) {
      for (let j = i + 1; j < sites.length; j++) {
        const score = calculateSim(sites[i], sites[j]);
        results.push({
          sourceId: sites[i].id,
          targetId: sites[j].id,
          score,
          explanation: '',
          sharedEntities: []
        });
      }
    }
    setSimilarityData(results);
  }, [sites]);

  const handleAddSite = (newSite: Site) => {
    setSites(prev => [...prev, newSite]);
    setSelectedSite(newSite);
  };

  const handleUpdateSite = (updatedSite: Site) => {
    setSites(prev => prev.map(s => s.id === updatedSite.id ? updatedSite : s));
    setSelectedSite(updatedSite);
  };

  const handleComputeGlobalInsights = async () => {
    setIsComputingInsights(true);
    try {
      const insights = await discoverPatterns(sites);
      setGlobalInsights(insights);
    } catch (err) {
      console.error(err);
      setGlobalInsights("Failed to compute macro-patterns. Check API connectivity.");
    } finally {
      setIsComputingInsights(false);
    }
  };

  if (view === 'landing') {
    return <LandingPage onStart={() => setView('app')} />;
  }

  return (
    <div className="min-h-screen flex flex-col animate-in fade-in duration-1000 relative">
      {/* Navigation */}
      <nav className="bg-[#2d2a26] text-[#f8f7f4] border-b border-[#3d3a36] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div 
            className="flex items-center gap-3 cursor-pointer" 
            onClick={() => setView('landing')}
          >
            <div className="w-8 h-8 bg-[#c45a30] rounded-sm flex items-center justify-center font-bold text-lg">A</div>
            <h1 className="text-xl font-serif tracking-tight">Artifact AI</h1>
          </div>
          <div className="flex gap-8 overflow-x-auto mx-4">
            <NavButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} label="Dashboard" />
            <NavButton active={activeTab === 'similarity'} onClick={() => setActiveTab('similarity')} label="Similarity Matrix" />
            <NavButton active={activeTab === 'network'} onClick={() => setActiveTab('network')} label="Network Analysis" />
            <NavButton active={activeTab === 'reports'} onClick={() => setActiveTab('reports')} label="Reports & Export" />
            <NavButton active={activeTab === 'code'} onClick={() => setActiveTab('code')} label="Pipeline Architect" />
          </div>
          <div className="flex items-center gap-4">
             <button 
              onClick={() => setShowSettings(true)}
              className="p-2 text-gray-400 hover:text-white transition"
              title="API Settings"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37a1.724 1.724 0 002.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            <button 
              onClick={handleComputeGlobalInsights}
              className="hidden md:flex items-center gap-2 bg-[#c45a30] px-4 py-1.5 rounded text-xs font-bold hover:bg-[#a34a28] transition"
            >
              {isComputingInsights ? (
                 <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              ) : '✨ Global Insights'}
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-6">
        {activeTab === 'dashboard' && (
          <Dashboard 
            sites={sites} 
            onSelectSite={setSelectedSite} 
            selectedSite={selectedSite}
            onAddSite={handleAddSite}
          />
        )}
        {activeTab === 'similarity' && (
          <SimilarityMatrix sites={sites} results={similarityData} />
        )}
        {activeTab === 'network' && (
          <div className="w-full h-[800px] mb-12">
             <NetworkGraph sites={sites} links={similarityData} />
          </div>
        )}
        {activeTab === 'reports' && (
          <ReportsExport sites={sites} similarityData={similarityData} />
        )}
        {activeTab === 'code' && <CodeViewer />}
      </main>

      {/* Site Detail Overlay */}
      {selectedSite && (
        <SiteDetails 
          site={selectedSite} 
          allSites={sites}
          onClose={() => setSelectedSite(null)} 
          onUpdateSite={handleUpdateSite}
        />
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-lg font-serif">API Configuration</h3>
              <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-gray-600 font-bold text-xl">&times;</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Gemini API Key</label>
                <input 
                  type="password"
                  placeholder="Paste your API key here..."
                  className="w-full p-2 border rounded text-xs font-mono"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
                <p className="text-[10px] text-gray-500 mt-2 leading-relaxed">
                  Your key is stored locally in your browser. Get a free key from the 
                  <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-[#c45a30] hover:underline ml-1">Google AI Studio</a>.
                </p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
                <p className="text-[11px] text-[#c45a30] leading-relaxed">
                  <strong>Quota Optimization:</strong> If your API key hits free-tier limits, the system will automatically fall back to 
                  heuristic-based "Smart Insights" to maintain functionality.
                </p>
              </div>
            </div>
            <div className="p-4 bg-gray-50 border-t flex justify-end gap-3">
              <button 
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveSettings}
                className="px-6 py-2 bg-[#c45a30] text-white text-xs font-bold rounded-lg shadow-md hover:bg-[#a34a28] transition"
              >
                Save Configuration
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Insights Modal */}
      {globalInsights && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-[#fdf9f4] w-full max-w-2xl rounded-2xl shadow-2xl border border-[#c45a30]/20 overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-6 bg-[#c45a30] text-white flex justify-between items-center">
              <h3 className="text-xl font-serif">Macro-Cultural Patterns</h3>
              <button onClick={() => setGlobalInsights(null)} className="text-white/60 hover:text-white transition">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-8 overflow-y-auto prose prose-stone prose-sm max-w-none">
              <div className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                {globalInsights}
              </div>
            </div>
            <div className="p-6 border-t bg-gray-50 flex justify-end">
              <button 
                onClick={() => setGlobalInsights(null)}
                className="px-6 py-2 bg-[#2d2a26] text-white text-xs font-bold rounded-lg"
              >
                Close Insights
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-[#2d2a26] text-gray-400 py-8 px-6 text-sm border-t border-[#3d3a36]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-4 justify-between items-center">
          <p>© 2024 Artifact AI • Digital Humanities Initiative</p>
          <div className="flex gap-6 text-[10px] uppercase tracking-widest font-bold">
            <span className="text-[#c45a30]">Powered by Gemini 3 Flash & Pro</span>
            <span className="text-gray-600">Archaeological NLP Dataset v0.5.1</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

const NavButton: React.FC<{ active: boolean; onClick: () => void; label: string }> = ({ active, onClick, label }) => (
  <button
    onClick={onClick}
    className={`pb-1 border-b-2 transition-all font-medium whitespace-nowrap ${
      active ? 'border-[#c45a30] text-white' : 'border-transparent text-gray-400 hover:text-white'
    }`}
  >
    {label}
  </button>
);

export default App;

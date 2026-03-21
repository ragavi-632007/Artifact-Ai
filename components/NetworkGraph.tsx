
import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { Site, SimilarityResult, Chronology } from '../types';

interface NetworkGraphProps {
  sites: Site[];
  links: SimilarityResult[];
}

const NetworkGraph: React.FC<NetworkGraphProps> = ({ sites, links }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedNode, setSelectedNode] = useState<Site | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'network' | 'cluster'>('network');
  const [filterEra, setFilterEra] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  // Filter sites based on search and era
  const filteredSites = useMemo(() => {
    return sites.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesEra = filterEra === 'all' || s.chronology.includes(filterEra as Chronology);
      return matchesSearch && matchesEra;
    });
  }, [sites, searchTerm, filterEra]);

  const filteredLinks = useMemo(() => {
    const siteIds = new Set(filteredSites.map(s => s.id));
    return links.filter(l => l.score > 0.15 && siteIds.has(l.sourceId) && siteIds.has(l.targetId));
  }, [links, filteredSites]);

  useEffect(() => {
    if (!svgRef.current) return;

    if (!filteredSites.length) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const width = 1000;
    const height = 700;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Define Gradients and Glow Effects
    const defs = svg.append("defs");
    
    // Node Glow
    const glow = defs.append("filter")
      .attr("id", "glow")
      .attr("x", "-50%")
      .attr("y", "-50%")
      .attr("width", "200%")
      .attr("height", "200%");
    
    glow.append("feGaussianBlur")
      .attr("stdDeviation", "3.5")
      .attr("result", "coloredBlur");
    
    const feMerge = glow.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "coloredBlur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    // Edge Gradient
    const edgeGradient = defs.append("linearGradient")
      .attr("id", "edge-gradient")
      .attr("x1", "0%").attr("y1", "0%")
      .attr("x2", "100%").attr("y2", "0%");
    edgeGradient.append("stop").attr("offset", "0%").attr("stop-color", "#38bdf8");
    edgeGradient.append("stop").attr("offset", "100%").attr("stop-color", "#fb923c");

    const g = svg.append("g");

    // Zoom setup
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 8])
      .on("zoom", (event) => g.attr("transform", event.transform));

    svg.call(zoom as any);

    const nodes = filteredSites.map(d => ({ ...d }));
    // Mapping link data for D3 forceLink (it needs source/target properties)
    const d3Links = filteredLinks.map(l => ({
      source: l.sourceId,
      target: l.targetId,
      score: l.score
    }));

    const simulation = d3.forceSimulation(nodes as any)
      .force("link", d3.forceLink(d3Links).id((d: any) => d.id).distance(250))
      .force("charge", d3.forceManyBody().strength(viewMode === 'network' ? -1000 : -200))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("x", d3.forceX(width / 2).strength(0.1))
      .force("y", d3.forceY(height / 2).strength(0.1))
      .force("collision", d3.forceCollide().radius(80));

    // Links as animated lines
    const link = g.append("g")
      .selectAll("line")
      .data(d3Links)
      .join("line")
      .attr("stroke", "url(#edge-gradient)")
      .attr("stroke-opacity", (d) => Math.min(d.score + 0.1, 0.4))
      .attr("stroke-width", (d) => Math.sqrt(d.score) * 6)
      .attr("class", "edge-pulse");

    // Nodes with glow and glassmorphism style
    const node = g.append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .attr("class", "node-group text-slate-100")
      .call(d3.drag<SVGGElement, any, SVGGElement>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended) as any)
      .on("click", function(event: any, d: any) {
        setSelectedNode(d as Site);
        event.stopPropagation();
      } as any);

    node.append("circle")
      .attr("r", d => 15 + (d.artifacts.length * 2))
      .attr("fill", d => d.chronology.includes(Chronology.SANGAM) ? "#0ea5e9" : "#fb923c")
      .attr("filter", "url(#glow)")
      .attr("class", "hover:scale-125 transition-transform duration-300");

    node.append("text")
      .text(d => d.name)
      .attr("y", d => 25 + (d.artifacts.length * 2))
      .attr("text-anchor", "middle")
      .attr("fill", "white")
      .attr("font-size", "12px")
      .attr("font-weight", "500")
      .style("pointer-events", "none");

    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    setIsLoading(false);
    return () => { simulation.stop(); };
  }, [filteredSites, filteredLinks, viewMode]);

  const resetView = () => {
    setSelectedNode(null);
    setSearchTerm('');
    setFilterEra('all');
    if (svgRef.current) d3.select(svgRef.current).transition().duration(750).call(d3.zoom().transform as any, d3.zoomIdentity);
  };

  return (
    <div className="h-full w-full bg-[#0a0c10] rounded-3xl overflow-hidden relative border border-slate-800 flex flex-col font-sans" ref={containerRef}>
      {/* Background Particles Decoration */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="h-full w-full bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:40px_40px]"></div>
      </div>

      {/* Intro Header */}
      <div className="relative z-10 p-6 flex items-center justify-between border-b border-slate-800/50 bg-[#0a0c10]/40 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 border border-indigo-500/20">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-serif text-slate-100 italic">Inter-Site Relationship Network</h2>
            <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest font-bold">Mapping Material Culture Homogenization in Early Historic Tamil Nadu</p>
          </div>
        </div>
        
        {/* Toolbar */}
        <div className="flex items-center gap-3">
          <div className="relative group">
            <input 
              type="text" 
              placeholder="Search Site..." 
              className="bg-slate-900/50 border border-slate-700/50 rounded-full px-4 py-1.5 text-xs text-slate-300 w-48 focus:w-64 transition-all duration-300 outline-none focus:border-indigo-500/50 backdrop-blur-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <svg className="w-3.5 h-3.5 absolute right-3 top-2.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <select 
            className="bg-slate-900/50 border border-slate-700/50 rounded-full px-4 py-1.5 text-xs text-slate-300 outline-none cursor-pointer hover:border-indigo-500/50"
            value={filterEra}
            onChange={(e) => setFilterEra(e.target.value)}
          >
            <option value="all">Historical Period</option>
            {Object.values(Chronology).map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <div className="flex bg-slate-900 rounded-full p-1 gap-1 border border-slate-800">
            <button 
              onClick={() => setViewMode('network')}
              className={`px-3 py-1 text-[9px] font-bold rounded-full transition-all duration-300 ${viewMode === 'network' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:text-slate-300'}`}
            >
              NETWORK
            </button>
            <button 
              onClick={() => setViewMode('cluster')}
              className={`px-3 py-1 text-[9px] font-bold rounded-full transition-all duration-300 ${viewMode === 'cluster' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:text-slate-300'}`}
            >
              CLUSTER
            </button>
          </div>
          <button 
            onClick={resetView}
            className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-400 rounded-full border border-slate-800 transition"
            title="Reset Graph"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex-1 relative flex">
        {/* Main Graph Area */}
        <div className="flex-1 relative cursor-crosshair">
          <svg 
            ref={svgRef} 
            className={`w-full h-full transition-opacity duration-1000 ${isLoading ? 'opacity-0' : 'opacity-100'}`} 
            viewBox="0 0 1000 700"
          ></svg>

          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center z-50">
              <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
            </div>
          )}

          {!isLoading && filteredSites.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600 opacity-40">
              <svg className="w-16 h-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-sm italic">No Relationship data found for current filters.</p>
            </div>
          )}

          {/* Canvas Hints */}
          {!selectedNode && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 py-2 px-4 bg-slate-900/60 border border-slate-700/50 backdrop-blur-md rounded-full text-[10px] text-slate-300 flex items-center gap-3 animate-bounce">
              <div className="w-2 h-2 bg-indigo-400 rounded-full"></div>
              <span>Click a node to explore deep cultural relationships</span>
            </div>
          )}
        </div>

        {/* Global Mini Legend */}
        <div className="absolute left-6 bottom-6 p-4 bg-slate-900/40 backdrop-blur-md border border-slate-700/30 rounded-2xl flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Scale Index</h4>
            <div className="flex items-center gap-3">
               <div className="w-3 h-3 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(14,165,233,0.5)]"></div>
               <span className="text-[10px] text-slate-400">Sangam Era Core</span>
            </div>
            <div className="flex items-center gap-3">
               <div className="w-3 h-3 bg-orange-400 rounded-full shadow-[0_0_10px_rgba(251,146,60,0.5)]"></div>
               <span className="text-[10px] text-slate-400">Inland/Megalithic Hub</span>
            </div>
          </div>
          <div className="flex flex-col gap-2 pt-2 border-t border-slate-800">
             <div className="flex items-center gap-3">
                <div className="w-10 h-1 bg-gradient-to-r from-sky-400 to-orange-400 rounded-full opacity-60"></div>
                <span className="text-[10px] text-slate-400">Relationship Strength</span>
             </div>
          </div>
        </div>

        {/* Floating Side Panel (Selected Node Details) */}
        {selectedNode && (
          <div className="absolute inset-y-6 right-6 w-96 z-20 flex flex-col pointer-events-none">
            <div className="flex-1 bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-8 pointer-events-auto flex flex-col animate-in slide-in-from-right-10 duration-500">
              <div className="flex justify-between items-start mb-8">
                <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-indigo-400 text-3xl">🏺</div>
                <button 
                  onClick={() => setSelectedNode(null)}
                  className="p-2 hover:bg-white/10 text-slate-500 rounded-full transition"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mb-8">
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-2 block">Site Intelligence Profile</span>
                <h3 className="text-3xl font-serif text-white mb-2 italic">{selectedNode.name}</h3>
                <div className="flex gap-2 mb-4">
                  {selectedNode.chronology.map(c => (
                    <span key={c} className="text-[9px] uppercase font-bold px-2 py-0.5 bg-indigo-500 text-white rounded-full leading-none">{c}</span>
                  ))}
                </div>
                <p className="text-sm text-slate-400 leading-relaxed italic border-l-2 border-indigo-500/30 pl-4">
                  "{selectedNode.description}"
                </p>
              </div>

              <div className="space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <div>
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Material Assembly</h4>
                  <div className="grid grid-cols-1 gap-3">
                    {selectedNode.artifacts.slice(0, 3).map((art, idx) => (
                      <div key={idx} className="bg-white/5 p-4 rounded-xl border border-white/5 flex gap-4 items-center">
                        <div className="text-2xl">💍</div>
                        <div>
                          <p className="text-xs font-bold text-white leading-none mb-1">{art.name}</p>
                          <p className="text-[10px] text-indigo-400 font-mono uppercase tracking-widest">{art.material}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Network Centrality</h4>
                  <div className="bg-gradient-to-br from-indigo-500/10 to-orange-500/10 p-6 rounded-2xl border border-white/5">
                    <div className="flex justify-between items-end mb-4">
                      <span className="text-xs text-slate-300 font-medium">Connectivity Strength</span>
                      <span className="text-2xl font-serif text-white">{(selectedNode.artifacts.length * 12.5).toFixed(1)}%</span>
                    </div>
                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                       <div className="h-full bg-indigo-500 w-[78%]"></div>
                    </div>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setSelectedNode(null)}
                className="mt-8 w-full py-4 bg-slate-100 hover:bg-white text-[#0a0c10] text-xs font-black uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-slate-100/10"
              >
                Close Data Card
              </button>
            </div>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .edge-pulse {
          animation: flow 3s infinite linear;
          stroke-dasharray: 10, 5;
        }
        @keyframes flow {
          to { stroke-dashoffset: -15; }
        }
        .node-group:hover circle {
          filter: drop-shadow(0 0 15px rgba(14, 165, 233, 0.8)) !important;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
      `}} />
    </div>
  );
};

export default NetworkGraph;

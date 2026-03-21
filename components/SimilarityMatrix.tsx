
import React, { useState, useMemo } from 'react';
import { Site, SimilarityResult, Chronology } from '../types';

interface SimilarityMatrixProps {
  sites: Site[];
  results: SimilarityResult[];
}

const SimilarityMatrix: React.FC<SimilarityMatrixProps> = ({ sites, results }) => {
  const [hoveredCell, setHoveredCell] = useState<{ x: string; y: string } | null>(null);
  const [viewType, setViewType] = useState<'percent' | 'normalized'>('percent');
  const [sortOrder, setSortOrder] = useState<'name' | 'similarity'>('name');
  const [filterRegion, setFilterRegion] = useState<string>('all');

  // Sorting and Filtering Logics
  const filteredSites = useMemo(() => {
    let baseSites = [...sites];
    if (filterRegion !== 'all') {
      baseSites = baseSites.filter(s => s.location.district === filterRegion);
    }

    if (sortOrder === 'similarity') {
      // Sort sites based on their average similarity to all others
      return baseSites.sort((a, b) => {
        const avgA = results
          .filter(r => r.sourceId === a.id || r.targetId === a.id)
          .reduce((acc, current) => acc + current.score, 0) / sites.length;
        const avgB = results
          .filter(r => r.sourceId === b.id || r.targetId === b.id)
          .reduce((acc, current) => acc + current.score, 0) / sites.length;
        return avgB - avgA;
      });
    }

    return baseSites.sort((a, b) => a.name.localeCompare(b.name));
  }, [sites, results, sortOrder, filterRegion]);

  const uniqueDistricts = useMemo(() => 
    Array.from(new Set(sites.map(s => s.location.district))).sort(), 
  [sites]);

  const getScore = (id1: string, id2: string) => {
    if (id1 === id2) return 1;
    const res = results.find(r => 
      (r.sourceId === id1 && r.targetId === id2) || 
      (r.sourceId === id2 && r.targetId === id1)
    );
    return res ? res.score : 0;
  };

  /**
   * Colorblind-friendly indigo-orange color scale for the heatmap
   */
  const getHeatmapColor = (score: number) => {
    if (score === 1) return 'bg-[#1e1b4b] text-indigo-200'; // Dark Indigo for identity
    if (score > 0.8) return 'bg-indigo-700 text-indigo-50';
    if (score > 0.6) return 'bg-indigo-500 text-white';
    if (score > 0.4) return 'bg-indigo-300 text-indigo-900';
    if (score > 0.2) return 'bg-orange-200 text-orange-900';
    if (score > 0.1) return 'bg-orange-100 text-orange-800';
    return 'bg-gray-50 text-gray-400';
  };

  // Summary Insights
  const insights = useMemo(() => {
    const sortedResults = [...results].sort((a, b) => b.score - a.score);
    const mostSimilar = sortedResults[0];
    const sourceS = sites.find(s => s.id === mostSimilar?.sourceId);
    const targetS = sites.find(s => s.id === mostSimilar?.targetId);

    // Simplistic most unique calculation
    const siteAverageSim = sites.map(s => ({
      site: s,
      avg: results
        .filter(r => r.sourceId === s.id || r.targetId === s.id)
        .reduce((sum, r) => sum + r.score, 0) / (sites.length - 1)
    })).sort((a, b) => a.avg - b.avg);

    return {
      mostSimilarPair: mostSimilar ? `${sourceS?.name} & ${targetS?.name}` : 'N/A',
      mostUniqueSite: siteAverageSim[0]?.site.name || 'N/A',
      avgRelS: (results.reduce((s, r) => s + r.score, 0) / results.length * 100).toFixed(1)
    };
  }, [results, sites]);

  const exportCSV = () => {
    const headers = ['Site', ...filteredSites.map(s => s.name)].join(',');
    const csvRows = filteredSites.map(row => {
      const rowScores = filteredSites.map(col => getScore(row.id, col.id).toFixed(4));
      return [row.name, ...rowScores].join(',');
    });
    
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...csvRows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "artifact_similarity_matrix.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Dashboard Top Header */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-serif text-slate-800">Similarity Matrix</h2>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-bold">Cross-Site Comparative Analysis Index</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg text-xs font-bold transition border border-slate-200"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export CSV
          </button>
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-1 flex">
            <button 
              onClick={() => setViewType('percent')}
              className={`px-3 py-1 text-[10px] font-bold rounded-md transition ${viewType === 'percent' ? 'bg-[#c45a30] text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              PERCENTAGE
            </button>
            <button 
              onClick={() => setViewType('normalized')}
              className={`px-3 py-1 text-[10px] font-bold rounded-md transition ${viewType === 'normalized' ? 'bg-[#c45a30] text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              NORMALIZED
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Heatmap Area */}
        <div className="lg:col-span-3 bg-white p-8 rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8 justify-between border-b border-slate-50 pb-6">
            <div className="flex gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Site Sorting</label>
                <select 
                  className="bg-slate-50 border-none rounded-lg px-3 py-2 text-xs font-medium focus:ring-1 focus:ring-indigo-500 transition cursor-pointer"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as any)}
                >
                  <option value="name">Alpha (A-Z)</option>
                  <option value="similarity">High Sensitivity</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Region Filter</label>
                <select 
                  className="bg-slate-50 border-none rounded-lg px-3 py-2 text-xs font-medium focus:ring-1 focus:ring-indigo-500 transition cursor-pointer"
                  value={filterRegion}
                  onChange={(e) => setFilterRegion(e.target.value)}
                >
                  <option value="all">All Districts</option>
                  {uniqueDistricts.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>
            
            <div className="flex items-end gap-3">
              <div className="text-right">
                <span className="block text-[10px] font-bold text-slate-400 uppercase leading-tight">Legend Scale</span>
                <div className="mt-1 w-40 h-3 bg-gradient-to-r from-orange-100 via-indigo-400 to-[#1e1b4b] rounded-full flex justify-between px-2 items-center text-[7px] font-black text-white mix-blend-difference">
                   <span>0.5</span>
                   <span>1.0</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-auto relative min-h-[500px]">
            <table className="border-collapse table-fixed w-full">
              <thead>
                <tr>
                  <th className="w-40 sticky left-0 z-20 bg-white"></th>
                  {filteredSites.map(s => (
                    <th key={s.id} className="w-24 p-2 text-[10px] font-bold text-slate-500 uppercase tracking-tighter transition-all duration-300">
                      <div className="whitespace-nowrap -rotate-45 translate-y-4 px-2 hover:text-[#c45a30] cursor-default">
                        {s.name}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredSites.map((rowSite, rowIndex) => (
                  <tr key={rowSite.id} className="group border-b border-slate-50 last:border-none">
                    <td className={`sticky left-0 z-20 transition-all duration-300 p-3 text-right text-[11px] font-bold uppercase tracking-tight pr-6 bg-white ${
                      hoveredCell?.y === rowSite.id ? 'text-[#c45a30] bg-orange-50/50' : 'text-slate-400 group-hover:text-slate-800'
                    }`}>
                      {rowSite.name}
                    </td>
                    {filteredSites.map((colSite, colIndex) => {
                      const score = getScore(rowSite.id, colSite.id);
                      const isHovered = hoveredCell?.x === colSite.id || hoveredCell?.y === rowSite.id;
                      const isTarget = hoveredCell?.x === colSite.id && hoveredCell?.y === rowSite.id;
                      const isIdentity = rowSite.id === colSite.id;

                      return (
                        <td 
                          key={colSite.id} 
                          onMouseEnter={() => setHoveredCell({ x: colSite.id, y: rowSite.id })}
                          onMouseLeave={() => setHoveredCell(null)}
                          className={`w-24 h-16 transition-all duration-300 relative border border-white cursor-help ${
                            getHeatmapColor(score)
                          } ${isHovered && !isIdentity ? 'brightness-110 shadow-inner' : ''} ${
                            isTarget ? 'ring-2 ring-[#c45a30] ring-inset z-30 transform scale-105 rounded shadow-xl' : ''
                          }`}
                        >
                          <div className={`flex flex-col items-center justify-center h-full transition-opacity duration-300 ${isTarget || isIdentity ? 'opacity-100' : 'opacity-20 hover:opacity-100'}`}>
                             <span className="text-[12px] font-extrabold leading-none">
                               {isIdentity ? '1.0' : viewType === 'percent' ? `${(score * 100).toFixed(0)}%` : score.toFixed(2)}
                             </span>
                             {!isIdentity && <span className="text-[7px] uppercase tracking-widest mt-1 font-bold opacity-60">Similarity</span>}
                          </div>
                          
                          {/* Rich Tooltip on Target Cell */}
                          {isTarget && !isIdentity && (
                            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-4 z-[100] w-64 p-4 bg-slate-900 text-white rounded-xl shadow-2xl animate-in zoom-in-95 duration-200 backdrop-blur-md bg-opacity-95">
                               <div className="flex justify-between items-start mb-3 border-b border-white/10 pb-2">
                                  <h5 className="text-[11px] font-black uppercase tracking-widest text-[#e6b17a]">Comparison Profile</h5>
                                  <span className="bg-white/10 px-2 py-0.5 rounded text-[10px] font-mono">{(score * 100).toFixed(1)}% Match</span>
                               </div>
                               <div className="space-y-3">
                                  <div>
                                     <div className="text-[8px] text-slate-400 uppercase font-bold mb-1">Source Sites</div>
                                     <div className="text-[10px] flex items-center gap-2">
                                        <span className="font-bold">{rowSite.name}</span>
                                        <span className="text-slate-500">→</span>
                                        <span className="font-bold">{colSite.name}</span>
                                     </div>
                                  </div>
                                  <div className="flex gap-4">
                                     <div className="flex-1">
                                        <div className="text-[8px] text-slate-400 uppercase font-bold mb-1">Shared Chronology</div>
                                        <div className="flex gap-1">
                                           {rowSite.chronology.filter(c => colSite.chronology.includes(c)).map(c => (
                                              <span key={c} className="w-1.5 h-1.5 bg-green-400 rounded-full" title={c}></span>
                                           ))}
                                        </div>
                                     </div>
                                     <div className="flex-1">
                                        <div className="text-[8px] text-slate-400 uppercase font-bold mb-1">Material Overlap</div>
                                        <div className="text-[10px] font-mono">
                                           {rowSite.artifacts.filter(a => colSite.artifacts.some(ca => ca.material.toLowerCase() === a.material.toLowerCase())).length} shared
                                        </div>
                                     </div>
                                  </div>
                               </div>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sidebar Insights */}
        <div className="space-y-6">
          <div className="bg-[#1e1b4b] text-white p-6 rounded-2xl shadow-xl border border-indigo-900/50">
            <h4 className="text-indigo-300 font-bold text-[10px] uppercase tracking-[0.2em] mb-4">Pipeline Intelligence</h4>
            <div className="space-y-6">
              <div>
                <span className="block text-[8px] text-indigo-400 uppercase mb-1">Most Similar Core</span>
                <div className="text-xl font-serif text-[#e6b17a]">{insights.mostSimilarPair}</div>
                <div className="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
                   <div className="h-full bg-[#c45a30] w-[85%]"></div>
                </div>
              </div>
              <div>
                <span className="block text-[8px] text-indigo-400 uppercase mb-1">Outlier Profile</span>
                <div className="text-xl font-serif">{insights.mostUniqueSite}</div>
                <p className="text-[10px] text-indigo-300/60 mt-1 leading-relaxed italic">Displays the highest degree of material culture divergence.</p>
              </div>
              <div className="pt-4 border-t border-white/5">
                <div className="flex justify-between items-center bg-white/5 p-3 rounded-lg">
                   <span className="text-[10px] text-indigo-200">Avg. Regional Similarity</span>
                   <span className="text-sm font-bold text-[#c45a30]">{insights.avgRelS}%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
             <h4 className="text-slate-500 font-bold text-[10px] uppercase tracking-widest mb-4">Methodology Index</h4>
             <p className="text-[11px] text-slate-600 leading-relaxed mb-4">
               Our system computes similarity scores using multidimensional analysis of <strong>Artifact Materials</strong>, <strong>Functional Categories</strong>, and <strong>Spatial Distribution</strong>.
             </p>
             <div className="flex items-center gap-2 group cursor-pointer">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-slate-400 group-hover:bg-[#c45a30] group-hover:text-white transition shadow-sm">
                   <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                   </svg>
                </div>
                <span className="text-[10px] font-bold text-slate-400 group-hover:text-slate-600 transition">View Model Whitepaper</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimilarityMatrix;

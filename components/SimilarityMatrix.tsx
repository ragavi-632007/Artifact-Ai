
import React, { useState } from 'react';
import { Site, SimilarityResult } from '../types';

interface SimilarityMatrixProps {
  sites: Site[];
  results: SimilarityResult[];
}

const SimilarityMatrix: React.FC<SimilarityMatrixProps> = ({ sites, results }) => {
  const [hovered, setHovered] = useState<{ x: string, y: string } | null>(null);

  const getScore = (id1: string, id2: string) => {
    if (id1 === id2) return 1;
    const res = results.find(r => 
      (r.sourceId === id1 && r.targetId === id2) || 
      (r.sourceId === id2 && r.targetId === id1)
    );
    return res ? res.score : 0;
  };

  const getColor = (score: number) => {
    const opacity = Math.max(0.1, score);
    if (score === 1) return '#2d2a26';
    return `rgba(196, 90, 48, ${opacity})`;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-8">
      <h2 className="text-2xl font-serif mb-2">Similarity Matrix</h2>
      <p className="text-gray-500 mb-8 text-sm">Quantifying the cultural affinity based on shared artifact materials and categories.</p>
      
      <div className="relative overflow-x-auto">
        <table className="border-collapse">
          <thead>
            <tr>
              <th className="p-2 w-32"></th>
              {sites.map(s => (
                <th key={s.id} className="p-2 w-24 text-[10px] uppercase tracking-tighter text-gray-500 rotate-45 h-24 origin-bottom-left">
                  {s.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sites.map(rowSite => (
              <tr key={rowSite.id}>
                <td className="p-2 text-right text-[10px] font-bold uppercase tracking-tighter text-gray-500 pr-4">
                  {rowSite.name}
                </td>
                {sites.map(colSite => {
                  const score = getScore(rowSite.id, colSite.id);
                  const isHovered = hovered?.x === colSite.id || hovered?.y === rowSite.id;
                  
                  return (
                    <td 
                      key={colSite.id} 
                      className={`p-0 w-12 h-12 border border-white transition-all duration-300 relative ${isHovered ? 'scale-110 z-10' : ''}`}
                      style={{ backgroundColor: getColor(score) }}
                      onMouseEnter={() => setHovered({ x: colSite.id, y: rowSite.id })}
                      onMouseLeave={() => setHovered(null)}
                    >
                      <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white opacity-0 hover:opacity-100 transition">
                        {(score * 100).toFixed(0)}%
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-12 p-6 bg-gray-50 rounded-lg border border-dashed flex items-center gap-8">
        <div className="flex-1">
            <h4 className="font-bold text-sm mb-1 uppercase tracking-widest text-[#c45a30]">Methodology</h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              Scores are computed using a Jaccard-weighted similarity over normalized archaeological entities (Materials, Chronology, and Form). 
              Value 1.0 represents identity; lower values indicate divergent material cultures.
            </p>
        </div>
        <div className="w-48 h-2 bg-gradient-to-r from-gray-100 to-[#c45a30] rounded-full relative">
            <span className="absolute left-0 -top-4 text-[8px] text-gray-400">DIVERGENT</span>
            <span className="absolute right-0 -top-4 text-[8px] text-[#c45a30] font-bold">SIMILAR</span>
        </div>
      </div>
    </div>
  );
};

export default SimilarityMatrix;


import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Site, SimilarityResult } from '../types';

interface NetworkGraphProps {
  sites: Site[];
  links: SimilarityResult[];
}

const NetworkGraph: React.FC<NetworkGraphProps> = ({ sites, links }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !sites.length) return;

    const width = 800;
    const height = 600;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Create a local copy of nodes to allow D3 to mutate them with x, y coordinates
    const nodes = sites.map(d => ({ ...d }));
    const nodeIds = new Set(nodes.map(n => n.id));

    // Prepare link data and filter to ensure source/target IDs exist in the nodes array
    // This prevents D3 forceLink from failing to bind objects to IDs
    const linkData = links
      .filter(l => l.score > 0.2 && nodeIds.has(l.sourceId) && nodeIds.has(l.targetId))
      .map(l => ({
        source: l.sourceId,
        target: l.targetId,
        score: l.score
      }));

    const simulation = d3.forceSimulation(nodes as any)
      .force("link", d3.forceLink(linkData as any).id((d: any) => d.id).distance(220))
      .force("charge", d3.forceManyBody().strength(-400))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(50));

    const link = svg.append("g")
      .attr("stroke", "#e5e7eb")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(linkData)
      .join("line")
      .attr("stroke-width", (d: any) => Math.sqrt(d.score || 0) * 5);

    const node = svg.append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .style("cursor", "grab")
      .call(d3.drag<SVGGElement, any, SVGGElement>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended) as any);

    node.append("circle")
      .attr("r", 14)
      .attr("fill", "#c45a30")
      .attr("stroke", "#fff")
      .attr("stroke-width", 2);

    node.append("text")
      .text(d => d.name)
      .attr("x", 20)
      .attr("y", 5)
      .attr("font-size", "12px")
      .attr("font-weight", "600")
      .attr("fill", "#1f2937")
      .style("pointer-events", "none")
      .style("text-shadow", "0 1px 2px white");

    simulation.on("tick", () => {
      // Safety checks using optional chaining and type verification to prevent 'undefined (reading x)' errors
      link
        .attr("x1", (d: any) => (typeof d.source === 'object' ? d.source.x : 0))
        .attr("y1", (d: any) => (typeof d.source === 'object' ? d.source.y : 0))
        .attr("x2", (d: any) => (typeof d.target === 'object' ? d.target.x : 0))
        .attr("y2", (d: any) => (typeof d.target === 'object' ? d.target.y : 0));

      node.attr("transform", (d: any) => `translate(${d.x || 0},${d.y || 0})`);
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

    return () => {
      simulation.stop();
    };
  }, [sites, links]);

  return (
    <div className="flex justify-center items-center bg-gray-50 rounded-lg overflow-hidden border h-full w-full">
      <svg ref={svgRef} width="100%" height="100%" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid meet"></svg>
    </div>
  );
};

export default NetworkGraph;

import { useState, useEffect, useMemo, useCallback } from 'react';
import { ReactFlow, Background, Controls, MiniMap, useNodesState, useEdgesState, ConnectionMode } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { SchemaNode } from './components/SchemaNode';
import { samples } from './parsers/samples';
import { parseUniversalInput } from './parsers';
import { Copy, Download, Search, LayoutGrid, Check, Terminal } from 'lucide-react';
import { toPng } from 'html-to-image';

const nodeTypes = { schemaNode: SchemaNode };

export default function App() {
  const [inputCode, setInputCode] = useState(samples.sql);
  const [searchQuery, setSearchQuery] = useState('');
  const [layoutDir, setLayoutDir] = useState<'LR' | 'TB'>('LR');
  const [copied, setCopied] = useState(false);

  const [nodes, setNodes, onNodesChange] = useNodesState<any>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<any>([]);
  const [formatInfo, setFormatInfo] = useState<{ type: string; valid: boolean; error?: string }>({ type: 'SQL DDL', valid: true });

  // Parse input dan update graph secara real-time
  useEffect(() => {
    try {
      const result = parseUniversalInput(inputCode, layoutDir);
      setNodes(result.nodes);
      setEdges(result.edges);
      setFormatInfo({ type: result.detectedType, valid: true });
    } catch (err: any) {
      setFormatInfo({ type: 'Syntax Error', valid: false, error: err.message });
    }
  }, [inputCode, layoutDir, setNodes, setEdges]);

  // Filter node berdasarkan search query
  const filteredNodes = useMemo(() => {
    if (!searchQuery.trim()) return nodes;
    const q = searchQuery.toLowerCase();
    return nodes.map((node: any) => {
      const matchLabel = node.data?.label?.toLowerCase()?.includes(q);
      const matchField = node.data?.fields?.some((f: any) => f.name?.toLowerCase()?.includes(q) || f.type?.toLowerCase()?.includes(q));
      return {
        ...node,
        style: {
          ...node.style,
          opacity: matchLabel || matchField ? 1 : 0.25,
          filter: matchLabel || matchField ? 'none' : 'grayscale(80%)',
        },
      };
    });
  }, [nodes, searchQuery]);

  // Handle Export PNG
  const handleExportPNG = useCallback(() => {
    const viewportElement = document.querySelector('.react-flow__viewport') as HTMLElement;
    if (!viewportElement) return;
    toPng(viewportElement, { cacheBust: true, backgroundColor: '#09090b' })
      .then((dataUrl) => {
        const link = document.createElement('a');
        link.download = 'rawmap-architecture.png';
        link.href = dataUrl;
        link.click();
      })
      .catch((err) => console.error('Failed to export image', err));
  }, []);

  // Handle Copy AI Context Markdown
  const handleCopyAIContext = () => {
    const markdown = `### RawMap Architecture Context\n- **Format:** ${formatInfo.type}\n- **Nodes Count:** ${nodes.length}\n- **Edges Count:** ${edges.length}\n\n\`\`\`json\n${inputCode.slice(0, 1500)}\n\`\`\``;
    navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#09090b] text-zinc-100 overflow-hidden font-sans">
      
      {/* 🚀 Top Navbar Kelas Dunia */}
      <header className="h-14 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md px-5 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-zinc-950 font-black text-sm">
              ⚡
            </div>
            <span className="font-bold tracking-tight text-base bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
              RawMap
            </span>
          </div>
          <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
            v0.1 Pro
          </span>
        </div>

        {/* Center Presets & Search */}
        <div className="flex items-center space-x-3">
          <div className="hidden md:flex items-center space-x-1 bg-zinc-900 p-1 rounded-lg border border-zinc-800">
            <button 
              onClick={() => setInputCode(samples.sql)}
              className="px-3 py-1 text-xs font-medium rounded-md text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all cursor-pointer"
            >
              SQL DDL
            </button>
            <button 
              onClick={() => setInputCode(samples.json)}
              className="px-3 py-1 text-xs font-medium rounded-md text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all cursor-pointer"
            >
              Nested JSON
            </button>
            <button 
              onClick={() => setInputCode(samples.csv)}
              className="px-3 py-1 text-xs font-medium rounded-md text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all cursor-pointer"
            >
              Analytics CSV
            </button>
          </div>

          <div className="relative w-56 lg:w-64">
            <Search size={14} className="absolute left-3 top-2.5 text-zinc-500" />
            <input
              type="text"
              placeholder="Search nodes or fields..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50 transition-all"
            />
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setLayoutDir(layoutDir === 'LR' ? 'TB' : 'LR')}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-medium text-zinc-300 transition-all cursor-pointer"
            title="Toggle Layout Direction"
          >
            <LayoutGrid size={14} className="text-emerald-400" />
            <span className="font-mono">{layoutDir}</span>
          </button>

          <button
            onClick={handleCopyAIContext}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-medium text-zinc-200 transition-all shadow-sm cursor-pointer"
          >
            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} className="text-zinc-400" />}
            <span>{copied ? 'Copied AI Context' : 'Copy AI Context'}</span>
          </button>

          <button
            onClick={handleExportPNG}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 text-xs font-bold transition-all shadow-lg shadow-emerald-500/20 cursor-pointer"
          >
            <Download size={14} />
            <span>Export PNG</span>
          </button>
        </div>
      </header>

      {/* 🖥️ Main Studio Split Layout */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Code Editor Panel */}
        <div className="w-[380px] bg-zinc-950 border-r border-zinc-800/80 flex flex-col shrink-0">
          <div className="px-4 py-2.5 bg-zinc-900/50 border-b border-zinc-800/80 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Terminal size={14} className="text-emerald-400" />
              <span className="text-xs font-semibold text-zinc-300 font-mono">Raw Input Payload</span>
            </div>
            <span className={`px-2 py-0.5 text-[10px] font-mono rounded font-medium border ${
              formatInfo.valid ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
            }`}>
              {formatInfo.type}
            </span>
          </div>

          <div className="flex-1 relative">
            <textarea
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              placeholder="Paste JSON, SQL DDL, or CSV here..."
              className="w-full h-full bg-zinc-950 text-zinc-200 font-mono text-xs p-4 resize-none focus:outline-none leading-relaxed selection:bg-emerald-500/30"
              spellCheck={false}
            />
          </div>

          <div className="px-4 py-2 bg-zinc-900/40 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-500 font-mono">
            <span>{inputCode.split('\n').length} lines</span>
            <span className="text-emerald-500/80 font-medium">{nodes.length} nodes • {edges.length} relations</span>
          </div>
        </div>

        {/* Right Canvas Area */}
        <div className="flex-1 relative canvas-bg-glow">
          <ReactFlow
            nodes={filteredNodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            connectionMode={ConnectionMode.Loose}
            fitView
            minZoom={0.2}
            maxZoom={2.5}
          >
            <Background variant={'dots' as any} gap={24} size={1} color="#27272a" />
            <Controls className="!bg-zinc-900 !border !border-zinc-800 !rounded-xl !shadow-2xl overflow-hidden [&>button]:!bg-zinc-900 [&>button]:!border-b [&>button]:!border-zinc-800 [&>button]:!text-zinc-300 hover:[&>button]:!bg-zinc-800" />
            <MiniMap 
              className="!bg-zinc-900/90 !backdrop-blur-md !border !border-zinc-800 !rounded-xl !shadow-2xl overflow-hidden" 
              nodeColor="#10b981"
              maskColor="rgba(9, 9, 11, 0.7)"
            />
          </ReactFlow>

          {/* Watermark Branding di Pojok Kanvas */}
          <div className="absolute bottom-4 right-4 pointer-events-none z-10 flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-zinc-900/80 backdrop-blur-md border border-zinc-800/80 text-[11px] font-mono text-zinc-400 shadow-xl">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Mapped with <strong className="text-zinc-200 font-semibold">RawMap</strong></span>
          </div>
        </div>

      </div>
    </div>
  );
}

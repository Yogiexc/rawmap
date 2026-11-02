import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  useReactFlow,
  ReactFlowProvider,
  type Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { toPng } from 'html-to-image';
import {
  Sparkles,
  Download,
  Check,
  Search,
  Code2,
  Database,
  Braces,
  Table,
  ArrowRightLeft,
  ArrowUpDown,
  Zap,
  Info,
} from 'lucide-react';

import { SchemaNode, type SchemaNodeData } from './components/SchemaNode';
import { parseUniversal, generateLLMContext, type DetectedFormat } from './parsers';
import { SAMPLE_SQL, SAMPLE_JSON, SAMPLE_CSV } from './parsers/samples';

const nodeTypes = {
  schemaNode: SchemaNode,
};

function RawMapStudio() {
  const [inputText, setInputText] = useState(SAMPLE_SQL);
  const [direction, setDirection] = useState<'LR' | 'TB'>('LR');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedContext, setCopiedContext] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const flowContainerRef = useRef<HTMLDivElement>(null);

  const { fitView } = useReactFlow();

  // Parsing result
  const parsed = useMemo(() => {
    return parseUniversal(inputText, direction);
  }, [inputText, direction]);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node<SchemaNodeData>>(parsed.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(parsed.edges);

  // Sync parsed nodes & apply search highlight
  useEffect(() => {
    const query = searchQuery.trim().toLowerCase();
    const updatedNodes = parsed.nodes.map((node) => {
      const matchTitle = node.data.title.toLowerCase().includes(query);
      const matchField = node.data.fields?.some((f) =>
        f.name.toLowerCase().includes(query) || f.type.toLowerCase().includes(query)
      );
      const isHighlighted = query.length > 0 && (matchTitle || matchField);

      return {
        ...node,
        data: {
          ...node.data,
          isHighlighted,
        },
      };
    });

    setNodes(updatedNodes);
    setEdges(parsed.edges);

    const timer = setTimeout(() => {
      fitView({ duration: 400, padding: 0.15 });
    }, 50);
    return () => clearTimeout(timer);
  }, [parsed, searchQuery, setNodes, setEdges, fitView]);

  // Copy AI Context
  const handleCopyContext = useCallback(() => {
    const md = generateLLMContext(nodes, edges);
    navigator.clipboard.writeText(md);
    setCopiedContext(true);
    setTimeout(() => setCopiedContext(false), 2000);
  }, [nodes, edges]);

  // Export HD PNG with subtle watermark
  const handleExportPNG = useCallback(async () => {
    if (!flowContainerRef.current) return;
    setIsExporting(true);

    try {
      const viewportElement = flowContainerRef.current.querySelector('.react-flow__viewport') as HTMLElement;
      if (!viewportElement) return;

      const dataUrl = await toPng(viewportElement, {
        backgroundColor: '#09090B',
        quality: 1,
        pixelRatio: 2,
        filter: (node) => {
          const element = node as HTMLElement;
          return !(element.classList && (element.classList.contains('react-flow__controls') || element.classList.contains('react-flow__minimap')));
        },
      });

      const a = document.createElement('a');
      a.setAttribute('download', `rawmap-schema-${Date.now()}.png`);
      a.setAttribute('href', dataUrl);
      a.click();
    } catch (err) {
      console.error('Failed to export PNG:', err);
    } finally {
      setIsExporting(false);
    }
  }, []);

  const getFormatBadge = (fmt: DetectedFormat) => {
    switch (fmt) {
      case 'sql':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/25">
            <Database className="w-3 h-3" /> SQL DDL Detected
          </span>
        );
      case 'json':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono bg-pink-500/10 text-pink-400 border border-pink-500/25">
            <Braces className="w-3 h-3" /> JSON Payload Detected
          </span>
        );
      case 'csv':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
            <Table className="w-3 h-3" /> CSV Dataset Detected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono bg-zinc-800 text-zinc-400 border border-zinc-700">
            <Info className="w-3 h-3" /> Auto Detecting...
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#09090B] text-[#FAFAFA] overflow-hidden select-none">
      {/* Top Navigation Bar */}
      <header className="h-14 border-b border-[#27272A] bg-[#121215]/90 backdrop-blur px-4 flex items-center justify-between z-20 flex-shrink-0">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Zap className="w-4 h-4 text-zinc-950 font-black fill-current" />
            </div>
            <div className="flex flex-col">
              <span className="font-sans font-bold text-sm tracking-tight flex items-center gap-1.5">
                RawMap
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  MVP v0.1
                </span>
              </span>
              <span className="text-[10px] text-zinc-400 font-mono">100% Client-Side Visualizer</span>
            </div>
          </div>

          <div className="h-4 w-px bg-zinc-800 mx-1 hidden md:block" />

          {/* Quick Presets */}
          <div className="hidden lg:flex items-center gap-1.5">
            <button
              onClick={() => setInputText(SAMPLE_SQL)}
              className="text-xs px-2.5 py-1 rounded bg-[#18181B] hover:bg-zinc-800 border border-[#27272A] text-zinc-300 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Database className="w-3 h-3 text-blue-400" />
              SQL E-Commerce
            </button>
            <button
              onClick={() => setInputText(SAMPLE_JSON)}
              className="text-xs px-2.5 py-1 rounded bg-[#18181B] hover:bg-zinc-800 border border-[#27272A] text-zinc-300 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Braces className="w-3 h-3 text-pink-400" />
              Nested JSON API
            </button>
            <button
              onClick={() => setInputText(SAMPLE_CSV)}
              className="text-xs px-2.5 py-1 rounded bg-[#18181B] hover:bg-zinc-800 border border-[#27272A] text-zinc-300 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Table className="w-3 h-3 text-emerald-400" />
              Analytics CSV
            </button>
          </div>
        </div>

        {/* Center Search */}
        <div className="relative w-64 md:w-80 hidden sm:block">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search nodes or fields..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#18181B] border border-[#27272A] rounded-md pl-9 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
          />
        </div>

        {/* Right Action Tools */}
        <div className="flex items-center gap-2">
          {/* Direction Toggle */}
          <button
            onClick={() => setDirection((prev) => (prev === 'LR' ? 'TB' : 'LR'))}
            title={`Current layout: ${direction === 'LR' ? 'Horizontal (LR)' : 'Vertical (TB)'}`}
            className="px-2.5 py-1.5 rounded-md bg-[#18181B] hover:bg-zinc-800 border border-[#27272A] text-zinc-300 text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {direction === 'LR' ? (
              <>
                <ArrowRightLeft className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden md:inline font-mono text-[11px]">LR</span>
              </>
            ) : (
              <>
                <ArrowUpDown className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden md:inline font-mono text-[11px]">TB</span>
              </>
            )}
          </button>

          {/* Copy AI Context */}
          <button
            onClick={handleCopyContext}
            className="px-3 py-1.5 rounded-md bg-[#18181B] hover:bg-zinc-800 border border-emerald-500/40 text-emerald-400 text-xs flex items-center gap-1.5 transition-all shadow-sm shadow-emerald-500/10 cursor-pointer"
          >
            {copiedContext ? <Check className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline font-medium">
              {copiedContext ? 'Copied Context!' : 'Copy AI Context (MD)'}
            </span>
          </button>

          {/* Export PNG */}
          <button
            onClick={handleExportPNG}
            disabled={isExporting}
            className="px-3 py-1.5 rounded-md bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-xs flex items-center gap-1.5 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isExporting ? 'Exporting...' : 'Export HD PNG'}</span>
          </button>

          {/* GitHub link */}
          <a
            href="https://github.com/Yogiexc/rawmap"
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub Repository"
            className="p-2 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
          </a>
        </div>
      </header>

      {/* Main Studio Body: Left Editor + Right ReactFlow Canvas */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Split Panel: Code Editor */}
        <section className="w-80 md:w-96 flex flex-col border-r border-[#27272A] bg-[#121215] flex-shrink-0 z-10">
          <div className="h-10 px-3.5 border-b border-[#27272A] flex items-center justify-between bg-[#121215]">
            <div className="flex items-center gap-2">
              <Code2 className="w-3.5 h-3.5 text-zinc-400" />
              <span className="text-xs font-semibold text-zinc-300">Raw Input</span>
            </div>
            {getFormatBadge(parsed.format)}
          </div>

          <div className="flex-1 relative">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste raw SQL DDL (CREATE TABLE), JSON payload, or CSV text here..."
              className="w-full h-full p-3.5 bg-[#0e0e11] text-[#FAFAFA] font-mono text-xs leading-relaxed resize-none focus:outline-none border-none selection:bg-emerald-500/30 overflow-y-auto"
              spellCheck={false}
            />
          </div>

          <footer className="h-9 px-3.5 border-t border-[#27272A] bg-[#121215] flex items-center justify-between text-[11px] font-mono text-zinc-400">
            <div className="flex items-center gap-3">
              <span>{inputText.length.toLocaleString()} chars</span>
              <span>•</span>
              <span>{inputText.split('\n').length} lines</span>
            </div>
            <div className="flex items-center gap-2 text-emerald-400">
              <span>{parsed.stats.nodeCount} nodes</span>
              <span>•</span>
              <span>{parsed.stats.edgeCount} edges</span>
            </div>
          </footer>
        </section>

        {/* Right Main Canvas */}
        <main ref={flowContainerRef} className="flex-1 relative bg-[#09090B]">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            fitView
            minZoom={0.2}
            maxZoom={2.5}
            defaultEdgeOptions={{
              animated: true,
              style: { strokeWidth: 1.5 },
            }}
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={24}
              size={1.5}
              color="#27272A"
            />
            <Controls className="!bg-[#18181B] !border-[#27272A] !rounded-lg !overflow-hidden [&>button]:!bg-[#18181B] [&>button]:!border-b-[#27272A] [&>button]:!fill-zinc-300 [&>button:hover]:!bg-zinc-800" />
            <MiniMap
              nodeColor={() => '#27272A'}
              maskColor="rgba(9, 9, 11, 0.75)"
              className="!bg-[#121215] !border !border-[#27272A] !rounded-lg"
            />
          </ReactFlow>

          <div className="absolute bottom-4 right-4 pointer-events-none px-2.5 py-1 rounded bg-[#18181B]/80 border border-[#27272A] backdrop-blur text-[10px] font-mono text-zinc-400 flex items-center gap-1.5 shadow-lg">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Mapped with <span className="text-zinc-200 font-bold">RawMap</span>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ReactFlowProvider>
      <RawMapStudio />
    </ReactFlowProvider>
  );
}

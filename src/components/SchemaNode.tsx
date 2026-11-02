import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Database, Key, Link as LinkIcon, FileText } from 'lucide-react';

export interface NodeField {
  name: string;
  type: string;
  isPK?: boolean;
  isFK?: boolean;
  sample?: string;
}

export interface NodeData extends Record<string, unknown> {
  label: string;
  type?: 'table' | 'object' | 'csv';
  fields: NodeField[];
  rowCount?: number;
}

export const SchemaNode = memo(({ data }: { data: NodeData }) => {
  const getBadgeStyle = (type: string, isPK?: boolean, isFK?: boolean) => {
    if (isPK) return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    if (isFK) return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
    const lower = type.toLowerCase();
    if (lower.includes('int') || lower.includes('number') || lower.includes('decimal')) 
      return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
    if (lower.includes('char') || lower.includes('text') || lower.includes('string')) 
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    if (lower.includes('bool')) 
      return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
    return 'bg-zinc-800 text-zinc-400 border-zinc-700';
  };

  return (
    <div className="group w-72 rounded-xl bg-zinc-900/95 backdrop-blur-xl border border-zinc-800 shadow-2xl shadow-black/80 hover:border-emerald-500/50 transition-all duration-300 overflow-hidden">
      <Handle type="target" position={Position.Left} className="!w-2.5 !h-2.5 !bg-emerald-500 !border-2 !border-zinc-900 !-left-1.5" />
      
      {/* Node Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-zinc-800/80 to-zinc-900/80 border-b border-zinc-800/80">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-inner">
            {data.type === 'table' ? <Database size={15} /> : <FileText size={15} />}
          </div>
          <div>
            <h3 className="text-xs font-bold tracking-wider text-zinc-100 font-mono uppercase truncate max-w-[130px]">
              {data.label}
            </h3>
            <span className="text-[10px] text-zinc-400 font-medium tracking-tight">
              {data.fields?.length || 0} fields {data.rowCount ? `• ${data.rowCount} rows` : ''}
            </span>
          </div>
        </div>
        <span className="px-2 py-0.5 text-[9px] font-semibold tracking-wider uppercase rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700/50">
          {data.type || 'schema'}
        </span>
      </div>

      {/* Fields List */}
      <div className="p-2 space-y-1 max-h-[220px] overflow-y-auto">
        {data.fields?.map((field, idx) => (
          <div 
            key={idx} 
            className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-zinc-800/60 transition-colors text-xs font-mono"
          >
            <div className="flex items-center space-x-2 truncate mr-2">
              {field.isPK ? (
                <Key size={12} className="text-amber-400 shrink-0" />
              ) : field.isFK ? (
                <LinkIcon size={12} className="text-indigo-400 shrink-0" />
              ) : (
                <div className="w-1 h-1 rounded-full bg-zinc-600 shrink-0" />
              )}
              <span className={`truncate ${field.isPK ? 'font-bold text-zinc-200' : 'text-zinc-300'}`}>
                {field.name}
              </span>
            </div>
            <span className={`px-1.5 py-0.5 text-[10px] font-mono border rounded shrink-0 ${getBadgeStyle(field.type, field.isPK, field.isFK)}`}>
              {field.isPK ? 'PK' : field.isFK ? 'FK' : field.type}
            </span>
          </div>
        ))}
      </div>

      <Handle type="source" position={Position.Right} className="!w-2.5 !h-2.5 !bg-emerald-500 !border-2 !border-zinc-900 !-right-1.5" />
    </div>
  );
});

SchemaNode.displayName = 'SchemaNode';

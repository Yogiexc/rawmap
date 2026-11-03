import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Database, Key, Link as LinkIcon, FileText, Braces } from 'lucide-react';

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
  isHighlighted?: boolean;
}

const getBadgeStyle = (type: string, isPK?: boolean, isFK?: boolean) => {
  if (isPK) {
    return {
      label: 'PK',
      className: 'bg-amber-500/15 text-amber-400 border border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.25)]',
    };
  }
  if (isFK) {
    return {
      label: 'FK',
      className: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-[0_0_12px_rgba(99,102,241,0.25)]',
    };
  }

  const lower = (type || '').toLowerCase();
  if (lower.includes('int') || lower.includes('number') || lower.includes('decimal') || lower.includes('float')) {
    return {
      label: type,
      className: 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 shadow-[0_0_8px_rgba(6,182,212,0.15)]',
    };
  }
  if (lower.includes('char') || lower.includes('text') || lower.includes('string') || lower.includes('varchar')) {
    return {
      label: type,
      className: 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 shadow-[0_0_8px_rgba(16,185,129,0.15)]',
    };
  }
  if (lower.includes('bool')) {
    return {
      label: type,
      className: 'bg-purple-500/10 text-purple-300 border border-purple-500/30 shadow-[0_0_8px_rgba(168,85,247,0.15)]',
    };
  }
  if (lower.includes('array') || lower.includes('object') || lower.includes('json')) {
    return {
      label: type,
      className: 'bg-pink-500/10 text-pink-300 border border-pink-500/30 shadow-[0_0_8px_rgba(236,72,153,0.15)]',
    };
  }

  return {
    label: type || 'val',
    className: 'bg-zinc-800/80 text-zinc-400 border border-zinc-700/60',
  };
};

export const SchemaNode = memo(({ data }: { data: NodeData }) => {
  const isTable = data.type === 'table';
  const isObject = data.type === 'object';

  return (
    <div
      className={`group relative w-80 rounded-xl cyber-card border transition-all duration-300 select-none ${
        data.isHighlighted
          ? 'border-emerald-400 ring-2 ring-emerald-500/40 shadow-[0_0_35px_rgba(16,185,129,0.35)] -translate-y-1'
          : 'border-zinc-800/80 hover:border-emerald-500/50 hover:shadow-[0_0_30px_rgba(16,185,129,0.15)]'
      }`}
    >
      {/* Laser Gradient Accent Bar on top */}
      <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-emerald-500 via-cyan-400 to-indigo-500 rounded-t-xl opacity-80 group-hover:opacity-100 transition-opacity" />

      {/* Target Connection Handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-emerald-400 !border-2 !border-[#020205] !-left-1.5 shadow-[0_0_10px_rgba(16,185,129,0.8)] transition-transform group-hover:!scale-125"
      />

      {/* Futuristic Cyber Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-gradient-to-r from-white/[0.03] to-transparent border-b border-white/[0.06] rounded-t-xl">
        <div className="flex items-center space-x-2.5 min-w-0">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-inner flex-shrink-0">
            {isTable ? (
              <Database size={14} className="stroke-[2.2]" />
            ) : isObject ? (
              <Braces size={14} className="stroke-[2.2] text-pink-400" />
            ) : (
              <FileText size={14} className="stroke-[2.2]" />
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.9)]" />
              <h3 className="text-[12px] font-bold tracking-tight text-white font-mono uppercase truncate max-w-[140px]" title={data.label}>
                {data.label}
              </h3>
            </div>
            <span className="text-[10px] text-zinc-400 font-mono tracking-tight">
              {data.fields?.length || 0} fields {data.rowCount ? `// ${data.rowCount} rows` : ''}
            </span>
          </div>
        </div>

        <span className="px-2 py-0.5 text-[9px] font-bold font-mono tracking-wider uppercase rounded bg-zinc-800/80 text-zinc-300 border border-white/[0.08] shadow-sm">
          {data.type || 'SCHEMA'}
        </span>
      </div>

      {/* Attribute Monospace Rows */}
      <div className="p-2 space-y-1 max-h-[260px] overflow-y-auto">
        {data.fields?.length === 0 ? (
          <div className="px-3 py-2 text-xs text-zinc-500 font-mono italic">No attributes detected</div>
        ) : (
          data.fields?.map((field, idx) => {
            const badge = getBadgeStyle(field.type, field.isPK, field.isFK);
            return (
              <div
                key={idx}
                className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-white/[0.04] border border-transparent hover:border-white/[0.05] transition-all text-xs font-mono group/row"
              >
                <div className="flex items-center space-x-2 truncate mr-2 min-w-0">
                  {field.isPK ? (
                    <Key size={12} className="text-amber-400 shrink-0 drop-shadow-[0_0_6px_rgba(245,158,11,0.5)]" />
                  ) : field.isFK ? (
                    <LinkIcon size={12} className="text-indigo-400 shrink-0 drop-shadow-[0_0_6px_rgba(99,102,241,0.5)]" />
                  ) : (
                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-600 group-hover/row:bg-emerald-400 transition-colors shrink-0" />
                  )}
                  <span
                    className={`truncate transition-colors ${
                      field.isPK
                        ? 'font-bold text-amber-200'
                        : field.isFK
                        ? 'font-semibold text-indigo-200'
                        : 'text-zinc-300 group-hover/row:text-white'
                    }`}
                    title={field.name}
                  >
                    {field.name}
                  </span>
                  {field.sample !== undefined && (
                    <span className="text-[10px] text-zinc-500 truncate max-w-[80px]" title={field.sample}>
                      = {field.sample}
                    </span>
                  )}
                </div>

                <span className={`px-2 py-0.5 text-[10px] font-mono font-medium rounded shrink-0 ${badge.className}`}>
                  {badge.label}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Source Connection Handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-emerald-400 !border-2 !border-[#020205] !-right-1.5 shadow-[0_0_10px_rgba(16,185,129,0.8)] transition-transform group-hover:!scale-125"
      />
    </div>
  );
});

SchemaNode.displayName = 'SchemaNode';

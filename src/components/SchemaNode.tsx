import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Database, Braces, Table, KeyRound, Link2 } from 'lucide-react';

export interface FieldItem {
  id: string;
  name: string;
  type: string;
  isPK?: boolean;
  isFK?: boolean;
  sampleValue?: string;
  refTable?: string;
  [key: string]: unknown;
}

export interface SchemaNodeData extends Record<string, unknown> {
  title: string;
  category?: 'sql' | 'json' | 'csv';
  fields: FieldItem[];
  rowCount?: number;
  isHighlighted?: boolean;
}

const getBadgeStyle = (field: FieldItem) => {
  if (field.isPK) {
    return {
      label: 'PK',
      className: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
    };
  }
  if (field.isFK) {
    return {
      label: 'FK',
      className: 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30',
    };
  }

  const typeLower = (field.type || '').toLowerCase();
  if (typeLower.includes('int') || typeLower.includes('num') || typeLower.includes('float') || typeLower.includes('decimal')) {
    return {
      label: field.type,
      className: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20',
    };
  }
  if (typeLower.includes('bool')) {
    return {
      label: field.type,
      className: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
    };
  }
  if (typeLower.includes('array') || typeLower.includes('object') || typeLower.includes('json')) {
    return {
      label: field.type,
      className: 'bg-pink-500/10 text-pink-400 border border-pink-500/20',
    };
  }
  return {
    label: field.type || 'text',
    className: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  };
};

export const SchemaNode = memo(({ data }: { data: SchemaNodeData }) => {
  const getIcon = () => {
    switch (data.category) {
      case 'sql':
        return <Database className="w-3.5 h-3.5 text-blue-400" />;
      case 'json':
        return <Braces className="w-3.5 h-3.5 text-pink-400" />;
      case 'csv':
        return <Table className="w-3.5 h-3.5 text-emerald-400" />;
      default:
        return <Database className="w-3.5 h-3.5 text-blue-400" />;
    }
  };

  return (
    <div
      className={`min-w-[260px] max-w-[340px] rounded-lg bg-[#18181B]/95 backdrop-blur-md shadow-2xl transition-all duration-200 border ${
        data.isHighlighted
          ? 'border-emerald-500 ring-2 ring-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.25)]'
          : 'border-[#27272A] hover:border-[#3F3F46]'
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        id="node-target"
        className="!w-2.5 !h-2.5 !bg-zinc-400 !border-2 !border-[#18181B] -left-1.5 transition-colors hover:!bg-emerald-400"
      />

      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-[#27272A] bg-[#121215]/80 rounded-t-lg">
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="p-1 rounded bg-zinc-800/80 border border-zinc-700/50 flex-shrink-0">
            {getIcon()}
          </span>
          <span className="font-sans font-semibold text-xs tracking-tight text-[#FAFAFA] truncate" title={data.title}>
            {data.title}
          </span>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
          {data.rowCount !== undefined && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/50">
              {data.rowCount} rows
            </span>
          )}
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/50">
            {data.fields?.length || 0} fields
          </span>
        </div>
      </div>

      <div className="py-1 max-h-[360px] overflow-y-auto">
        {data.fields?.length === 0 ? (
          <div className="px-3.5 py-2 text-xs text-zinc-500 italic">No fields detected</div>
        ) : (
          data.fields?.map((field) => {
            const badge = getBadgeStyle(field);
            return (
              <div
                key={field.id}
                className="relative flex items-center justify-between px-3.5 py-1.5 hover:bg-zinc-800/40 transition-colors group text-xs font-mono"
              >
                <Handle
                  type="target"
                  position={Position.Left}
                  id={`field-in-${field.id}`}
                  className="!w-2 !h-2 !bg-zinc-500 !border-2 !border-[#18181B] -left-1 opacity-0 group-hover:opacity-100 transition-opacity"
                />

                <div className="flex items-center gap-1.5 min-w-0 pr-2">
                  {field.isPK && <KeyRound className="w-3 h-3 text-amber-400 flex-shrink-0" />}
                  {field.isFK && <Link2 className="w-3 h-3 text-indigo-400 flex-shrink-0" />}
                  <span className="text-[#A1A1AA] truncate group-hover:text-zinc-200 transition-colors" title={field.name}>
                    {field.name}
                  </span>
                  {field.sampleValue !== undefined && (
                    <span className="text-[10px] text-zinc-500 truncate max-w-[80px]" title={field.sampleValue}>
                      = {field.sampleValue}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${badge.className}`}>
                    {badge.label}
                  </span>
                </div>

                <Handle
                  type="source"
                  position={Position.Right}
                  id={`field-out-${field.id}`}
                  className="!w-2 !h-2 !bg-zinc-500 !border-2 !border-[#18181B] -right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                />
              </div>
            );
          })
        )}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        id="node-source"
        className="!w-2.5 !h-2.5 !bg-zinc-400 !border-2 !border-[#18181B] -right-1.5 transition-colors hover:!bg-emerald-400"
      />
    </div>
  );
});

SchemaNode.displayName = 'SchemaNode';

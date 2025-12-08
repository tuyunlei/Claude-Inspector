
import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Folder, File, Layers, ListTodo, History, Activity, Binary, Lock, Settings, Database, Terminal, CheckSquare, BarChart, FileCode } from 'lucide-react';
import { cn } from '../../../utils/utils';
import { FileTreeNode, ClaudeFileKind } from '../../../model/files';

// --- Icon Logic ---
const getKindIcon = (kind: ClaudeFileKind, isDir: boolean) => {
    // Specific directory icons
    if (kind === 'project-root') return Layers;
    if (kind === 'todo-root') return ListTodo;
    if (kind === 'shell-root') return History;
    if (kind === 'stats-root') return Activity;
    if (kind === 'commands-root') return Binary;
    
    // Fallback for generic dirs
    if (isDir) return Folder;

    // File icons
    switch (kind) {
        case 'credentials': return Lock;
        case 'settings': return Settings;
        case 'mcp-config': return Database;
        case 'project-log': return Terminal;
        case 'todo': return CheckSquare;
        case 'stats': return BarChart;
        case 'shell-snapshot': return Terminal;
        case 'history-index': return FileCode;
        case 'commands': return Binary;
        default: return File;
    }
};

const getKindColor = (kind: ClaudeFileKind) => {
    switch (kind) {
        case 'credentials': return 'text-red-500';
        case 'settings': return 'text-purple-500';
        case 'mcp-config': return 'text-blue-500';
        case 'project-log': 
        case 'project-root':
            return 'text-orange-500';
        case 'todo': 
        case 'todo-root':
            return 'text-green-500';
        case 'shell-root':
        case 'shell-snapshot':
            return 'text-slate-600 dark:text-slate-300';
        case 'stats-root':
        case 'stats':
            return 'text-cyan-500';
        case 'commands-root':
        case 'commands':
            return 'text-pink-500';
        default: return 'text-slate-500 dark:text-slate-400';
    }
};

export { getKindIcon, getKindColor };

export const TreeNode: React.FC<{ 
    node: FileTreeNode; 
    depth: number; 
    selectedPath: string | null;
    onSelect: (node: FileTreeNode) => void; 
}> = ({ node, depth, selectedPath, onSelect }) => {
  const [expanded, setExpanded] = useState(false);
  const isSelected = selectedPath === node.path;
  const Icon = getKindIcon(node.kind, node.isDir);
  const colorClass = node.isDir && node.kind === 'other' || node.kind === 'root' 
      ? (expanded ? 'text-orange-500' : 'text-slate-400') 
      : getKindColor(node.kind);

  const handleClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      onSelect(node);
      if (node.isDir) {
          setExpanded(!expanded);
      }
  };

  // Auto-expand if a child is selected (simple version: expand root by default)
  useEffect(() => {
     if (depth === 0) setExpanded(true);
  }, [depth]);

  return (
    <div>
      <div 
        className={cn(
            "flex items-center gap-1.5 py-1 px-2 cursor-pointer transition-colors text-sm select-none",
            isSelected ? "bg-orange-100 dark:bg-orange-900/30 text-orange-900 dark:text-orange-200" : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={handleClick}
      >
        <span className="text-slate-400 shrink-0 w-4">
             {node.isDir && (
                 expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
             )}
        </span>
        <Icon size={16} className={cn("shrink-0", colorClass)} />
        <span className="truncate">{node.name}</span>
      </div>
      
      {expanded && node.children && (
        <div>
          {node.children.map((child) => (
            <TreeNode 
                key={child.path} 
                node={child} 
                depth={depth + 1} 
                selectedPath={selectedPath}
                onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
};

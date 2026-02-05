import React from 'react';
import { useSystemInfo } from '../hooks/useSystemInfo';
import { Cpu, Monitor } from 'phosphor-react';

export function SystemInfo() {
    const { cores, memory, platform } = useSystemInfo();

    return (
        <div className="fixed top-6 left-6 flex items-center gap-4 px-4 py-2 bg-skin-card backdrop-blur-md rounded-full border border-skin-border text-xs font-mono text-skin-muted shadow-lg z-50 transition-opacity hover:opacity-100 opacity-60">
            <div className="flex items-center gap-2">
                <Monitor size={14} />
                <span>{platform}</span>
            </div>
            {cores > 0 && (
                <div className="flex items-center gap-2 border-l border-slate-700 pl-4">
                    <Cpu size={14} />
                    <span>{cores} Cores</span>
                </div>
            )}
            {memory > 0 && (
                <div className="flex items-center gap-2 border-l border-slate-700 pl-4">
                    <Cpu size={14} />
                    <span>~{memory}GB RAM</span>
                </div>
            )}
        </div>
    );
}

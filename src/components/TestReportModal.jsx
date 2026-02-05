import React, { useState, useRef, useEffect } from 'react';
import { useKeyboard } from '../context/KeyboardContext';
import { ClipboardText, Check, X, DownloadSimple, Trash, CaretLeft, Plus, ClockCounterClockwise } from 'phosphor-react';
import { KEY_LAYOUTS } from '../data/keyData';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export function TestReportModal({ onClose }) {
    const { testedKeys, os, clearTested } = useKeyboard();
    const [view, setView] = useState('list'); // 'list' or 'detail'
    const [selectedReport, setSelectedReport] = useState(null);
    const [reports, setReports] = useState(() => {
        const saved = localStorage.getItem('ab_report_history');
        return saved ? JSON.parse(saved) : [];
    });
    const reportRef = useRef(null);
    const [isDownloading, setIsDownloading] = useState(false);
    const [copied, setCopied] = useState(false);

    // Save to local storage whenever reports change
    useEffect(() => {
        localStorage.setItem('ab_report_history', JSON.stringify(reports));
    }, [reports]);

    // Calculate Current Stats
    const allKeys = Object.values(KEY_LAYOUTS).flat();
    const totalKeys = allKeys.length;

    // Helper to generate a report object from current state
    const createSnapshot = () => {
        const workingKeys = testedKeys.size;
        const percentage = Math.round((workingKeys / totalKeys) * 100);
        const missingKeys = allKeys.filter(k => !testedKeys.has(k.code));

        return {
            id: Date.now(),
            date: new Date().toLocaleString(),
            score: `${workingKeys}/${totalKeys}`,
            percentage,
            missing: missingKeys,
            workingCount: workingKeys,
            totalCount: totalKeys
        };
    };

    const handleSaveSnapshot = () => {
        const newReport = createSnapshot();
        setReports([newReport, ...reports]);
    };

    const handleDeleteReport = (id) => {
        setReports(reports.filter(r => r.id !== id));
        if (selectedReport && selectedReport.id === id) {
            setView('list');
            setSelectedReport(null);
        }
    };

    const handleViewDetail = (report) => {
        setSelectedReport(report);
        setView('detail');
    };

    const handleDownloadPDF = async () => {
        if (!reportRef.current) return;
        setIsDownloading(true);
        try {
            const canvas = await html2canvas(reportRef.current, {
                scale: 2,
                backgroundColor: '#1e293b', // Force dark background color (hex)
                useCORS: true,
                logging: true
            });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`aetherboard-report-${Date.now()}.pdf`);
        } catch (err) {
            console.error('PDF Failed', err);
            alert('PDF Generation Failed: ' + err.message);
        }
        setIsDownloading(false);
    };

    const handleCopy = () => {
        if (!selectedReport) return;
        const missingStr = selectedReport.missing.length > 0
            ? selectedReport.missing.map(k => k.label || k.code).join(', ')
            : 'None';

        const text = `Aetherboard Test Report\nDate: ${selectedReport.date}\nOS: ${os.toUpperCase()}\nScore: ${selectedReport.score} (${selectedReport.percentage}%)\n\nMissing Keys:\n${missingStr}`;

        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // --- Sub-Components ---

    const EmptyState = () => (
        <div className="flex flex-col items-center justify-center p-8 text-center h-64 opacity-50">
            <ClockCounterClockwise size={48} className="mb-4 text-skin-muted" />
            <p className="text-skin-text font-bold text-lg mb-1">No reports yet</p>
            <p className="text-sm text-skin-muted max-w-[200px]">
                Type on the keyboard to test keys, then save a snapshot.
            </p>
        </div>
    );

    const DetailView = ({ report }) => (
        <div className="flex flex-col h-full animate-in slide-in-from-right-4 fade-in duration-200">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <button
                    onClick={() => setView('list')}
                    className="flex items-center gap-1 text-sm text-skin-muted hover:text-skin-text transition-colors"
                >
                    <CaretLeft size={16} /> Back
                </button>
                <span className="text-xs font-mono text-skin-muted">{report.date}</span>
                <button
                    onClick={() => handleDeleteReport(report.id)}
                    className="text-rose-500 hover:bg-rose-500/10 p-1 rounded transition-colors"
                    title="Delete this report"
                >
                    <Trash size={16} />
                </button>
            </div>

            {/* Printable Content */}
            <div
                ref={reportRef}
                className="p-4 rounded-xl space-y-6 flex-1 overflow-y-auto"
                style={{
                    backgroundColor: '#1e293b', // Hex for slate-900
                    border: '1px solid #334155', // Hex for slate-700
                    color: '#f1f5f9' // Hex for slate-100
                }}
            >
                <div className="flex items-center justify-between">
                    <div>
                        <div className="text-4xl font-bold text-skin-text">{report.percentage}%</div>
                        <div className="text-xs text-skin-muted uppercase tracking-wider">Pass Rate</div>
                    </div>
                    <div className="text-right font-mono text-sm space-y-1">
                        <div className="text-skin-text">Tested: <span style={{ color: '#10b981' }}>{report.workingCount}</span></div>
                        <div className="text-skin-text">Total: {report.totalCount}</div>
                    </div>
                </div>

                {/* Bar */}
                <div
                    className="h-2 rounded-full overflow-hidden"
                    style={{ backgroundColor: '#334155' }}
                >
                    <div
                        className="h-full"
                        style={{ width: `${report.percentage}%`, backgroundColor: '#3b82f6' }}
                    />
                </div>

                {/* Missing */}
                <div>
                    <h3 className="text-sm font-bold mb-2" style={{ color: '#f1f5f9' }}>Missing Keys ({report.missing.length})</h3>
                    <div
                        className="rounded-lg p-3 text-xs font-mono h-32 overflow-y-auto"
                        style={{
                            backgroundColor: '#0f172a', // Hex for slate-950
                            border: '1px solid #334155',
                            color: '#94a3b8'
                        }}
                    >
                        {report.missing.length === 0 ? (
                            <div className="h-full flex items-center justify-center gap-2" style={{ color: '#10b981' }}>
                                <Check size={16} /> All Keys Working
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-1">
                                {report.missing.map(k => (
                                    <span
                                        key={k.code}
                                        className="px-1.5 py-0.5 rounded border"
                                        style={{
                                            backgroundColor: 'rgba(244, 63, 94, 0.1)',
                                            color: '#f43f5e',
                                            borderColor: 'rgba(244, 63, 94, 0.2)'
                                        }}
                                    >
                                        {k.label || k.code}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-4">
                <button
                    onClick={handleCopy}
                    className="flex-1 py-2 px-3 bg-skin-key-active text-skin-key-active-text rounded-lg font-medium text-sm flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all"
                >
                    {copied ? <Check size={16} /> : <ClipboardText size={16} />}
                    {copied ? 'Copied' : 'Copy'}
                </button>
                <button
                    onClick={handleDownloadPDF}
                    disabled={isDownloading}
                    className="flex-1 py-2 px-3 bg-skin-card border border-skin-border text-skin-text rounded-lg font-medium text-sm flex items-center justify-center gap-2 hover:bg-white/5 active:scale-95 transition-all"
                >
                    <DownloadSimple size={16} />
                    PDF
                </button>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-skin-card border border-skin-border rounded-2xl shadow-2xl w-full max-w-md h-[550px] overflow-hidden flex flex-col relative transition-all duration-300">

                {/* Global Header */}
                <div className="p-4 border-b border-skin-border flex justify-between items-center bg-skin-fill/50 shrink-0">
                    <h2 className="text-lg font-bold text-skin-text flex items-center gap-2">
                        <ClipboardText size={24} className="text-skin-key-active-text bg-skin-key-active p-1 rounded-md" />
                        Test Reports
                    </h2>
                    <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors text-skin-muted hover:text-skin-text">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 p-6 overflow-hidden">
                    {view === 'list' ? (
                        <div className="h-full flex flex-col animate-in slide-in-from-left-4 fade-in duration-200">
                            {/* Create New Snapshot Action */}
                            <button
                                onClick={handleSaveSnapshot}
                                className="w-full py-3 mb-4 flex items-center justify-center gap-2 bg-skin-key-active/10 hover:bg-skin-key-active/20 border border-skin-key-active/50 text-skin-key-active-text rounded-xl transition-all group"
                            >
                                <Plus size={18} className="group-hover:scale-110 transition-transform" />
                                <span className="font-semibold">Save Current Snapshot</span>
                            </button>

                            {/* List or Empty */}
                            <div className="flex-1 overflow-y-auto pr-1 space-y-2">
                                {reports.length === 0 ? <EmptyState /> : (
                                    reports.map(r => (
                                        <div
                                            key={r.id}
                                            onClick={() => handleViewDetail(r)}
                                            className="p-3 rounded-xl border border-skin-border bg-skin-fill/30 hover:bg-skin-fill/60 cursor-pointer transition-colors flex items-center justify-between group"
                                        >
                                            <div>
                                                <div className="text-sm font-bold text-skin-text">Snapshot</div>
                                                <div className="text-xs text-skin-muted font-mono">{r.date}</div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className={`px-2 py-1 rounded text-xs font-bold ${r.percentage === 100 ? '' : 'bg-skin-key-active/20 text-skin-key-active-text'}`}
                                                    style={r.percentage === 100 ? { backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#10b981' } : {}}
                                                >
                                                    {r.percentage}%
                                                </div>
                                                <CaretLeft size={16} className="text-skin-muted rotate-180 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Reset Global Progress (Bottom of list view) */}
                            <div className="mt-4 pt-4 border-t border-skin-border">
                                <button
                                    onClick={() => {
                                        if (confirm('Clear all tested keys?')) clearTested();
                                    }}
                                    className="w-full py-2 text-xs text-rose-500 hover:text-rose-400 flex items-center justify-center gap-1 opacity-60 hover:opacity-100 transition-opacity"
                                >
                                    <Trash size={12} /> Clear Keyboard Progress
                                </button>
                            </div>
                        </div>
                    ) : (
                        <DetailView report={selectedReport} />
                    )}
                </div>
            </div>
        </div>
    );
}

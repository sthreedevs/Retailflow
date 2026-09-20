'use client';

import { useState } from 'react';

export function ImportPreviewTable({ previewData }) {
  const [filter, setFilter] = useState('ALL'); // ALL, VALID, INVALID

  const allRows = previewData?.previewRows || [];
  const filteredRows = allRows.filter((r) => {
    if (filter === 'VALID') return r.isValid;
    if (filter === 'INVALID') return !r.isValid;
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-lg border border-neutral-800 bg-neutral-900/60">
          <span className="text-[11px] text-neutral-400 block">Total In File</span>
          <span className="text-xl font-bold text-neutral-100">{previewData.totalRows}</span>
        </div>

        <div className="p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10">
          <span className="text-[11px] text-emerald-400 block font-medium">Valid Rows</span>
          <span className="text-xl font-bold text-emerald-400">{previewData.validCount}</span>
        </div>

        <div className="p-3 rounded-lg border border-red-500/20 bg-red-500/10">
          <span className="text-[11px] text-red-400 block font-medium">Invalid Rows</span>
          <span className="text-xl font-bold text-red-400">{previewData.invalidCount}</span>
        </div>

        <div className="p-3 rounded-lg border border-amber-500/20 bg-amber-500/10">
          <span className="text-[11px] text-amber-400 block font-medium">Duplicate Warnings</span>
          <span className="text-xl font-bold text-amber-400">{previewData.duplicateCount}</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {['ALL', 'VALID', 'INVALID'].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilter(tab)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                filter === tab
                  ? 'bg-neutral-800 text-neutral-100 border border-neutral-700'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {tab} ({tab === 'ALL' ? allRows.length : tab === 'VALID' ? previewData.validCount : previewData.invalidCount})
            </button>
          ))}
        </div>

        <span className="text-[11px] text-neutral-500">
          Showing preview of first {allRows.length} rows
        </span>
      </div>

      {/* Preview Table */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 overflow-hidden shadow-sm">
        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-900 border-b border-neutral-800 text-neutral-400 sticky top-0 z-10">
              <tr>
                <th className="py-2.5 px-3 font-medium">#</th>
                <th className="py-2.5 px-3 font-medium">Status</th>
                <th className="py-2.5 px-3 font-medium">Product Name</th>
                <th className="py-2.5 px-3 font-medium">Category</th>
                <th className="py-2.5 px-3 font-medium">MRP</th>
                <th className="py-2.5 px-3 font-medium">DP</th>
                <th className="py-2.5 px-3 font-medium">SP</th>
                <th className="py-2.5 px-3 font-medium">Pack Size</th>
                <th className="py-2.5 px-3 font-medium">Validation / Errors</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 font-mono text-[11px]">
              {filteredRows.map((r) => (
                <tr
                  key={r.rowNumber}
                  className={`hover:bg-neutral-800/20 transition-colors ${
                    !r.isValid ? 'bg-red-500/5' : ''
                  }`}
                >
                  <td className="py-2.5 px-3 text-neutral-500">{r.rowNumber}</td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                        r.isValid
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-red-500/10 text-red-400 border-red-500/20'
                      }`}
                    >
                      {r.isValid ? 'VALID' : 'INVALID'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-sans text-neutral-200 font-medium">
                    {r.data.name || <span className="text-red-400 italic">Missing Name</span>}
                  </td>
                  <td className="py-2.5 px-3 text-neutral-400 font-sans">{r.data.category}</td>
                  <td className="py-2.5 px-3 text-emerald-400">₹{r.data.mrp}</td>
                  <td className="py-2.5 px-3 text-neutral-400">₹{r.data.dp}</td>
                  <td className="py-2.5 px-3 text-neutral-400">{r.data.sp}</td>
                  <td className="py-2.5 px-3 text-neutral-300">{r.data.packSize || '—'}</td>
                  <td className="py-2.5 px-3 font-sans text-[11px]">
                    {r.errors && r.errors.length > 0 ? (
                      <span className="text-red-400 font-medium">
                        {r.errors.join('; ')}
                      </span>
                    ) : r.warnings && r.warnings.length > 0 ? (
                      <span className="text-amber-400">{r.warnings.join('; ')}</span>
                    ) : (
                      <span className="text-neutral-500">Ready</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

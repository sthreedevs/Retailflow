'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button.jsx';

export function FileDropzone({ onFileSelected, loading }) {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  }

  function handleFile(file) {
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['csv', 'xlsx', 'xls'].includes(ext)) {
      alert('Please upload a valid .csv, .xlsx, or .xls file.');
      return;
    }
    setSelectedFile(file);
    if (onFileSelected) {
      onFileSelected(file);
    }
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
        dragOver
          ? 'border-indigo-500 bg-indigo-500/10'
          : 'border-neutral-800 bg-neutral-900/40 hover:border-neutral-700'
      }`}
      onClick={() => fileInputRef.current?.click()}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleFile(e.target.files[0]);
          }
        }}
        accept=".csv, .xlsx, .xls"
        className="hidden"
      />

      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-300">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>

        <div>
          <p className="text-sm font-semibold text-neutral-200">
            {selectedFile ? selectedFile.name : 'Click to upload or drag & drop catalog file'}
          </p>
          <p className="text-xs text-neutral-500 mt-1">
            Supports CSV and XLSX spreadsheets (e.g. product_catalog.csv)
          </p>
        </div>

        {selectedFile && (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
            {(selectedFile.size / 1024).toFixed(1)} KB &bull; {selectedFile.name.split('.').pop().toUpperCase()}
          </div>
        )}

        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={loading}
          className="text-xs mt-2"
        >
          {loading ? 'Reading File...' : selectedFile ? 'Change File' : 'Select Spreadsheet'}
        </Button>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button.jsx';
import { FileDropzone } from '@/components/import/FileDropzone.jsx';
import { ColumnMapper } from '@/components/import/ColumnMapper.jsx';
import { ImportPreviewTable } from '@/components/import/ImportPreviewTable.jsx';

export default function ProductImportPage() {
  const [step, setStep] = useState(1); // 1: Upload, 2: Map, 3: Preview, 4: Summary
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1 State
  const [parseResult, setParseResult] = useState(null);

  // Step 2 State
  const [columnMapping, setColumnMapping] = useState({});

  // Step 3 State
  const [previewData, setPreviewData] = useState(null);

  // Step 4 State
  const [importSummary, setImportSummary] = useState(null);

  // --- Step 1: Upload & Parse ---
  async function handleFileSelected(file) {
    setError('');
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/tenant/products/import/parse', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to parse file.');
      }

      setParseResult(data);
      setColumnMapping(data.detectedMapping || {});
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // --- Step 2: Validate & Preview ---
  async function handleProceedToPreview() {
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/tenant/products/import/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rows: parseResult.allRows,
          columnMapping,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Validation failed.');
      }

      setPreviewData(data);
      setStep(3);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // --- Step 3: Execute Bulk Import ---
  async function handleExecuteImport() {
    setError('');
    setLoading(true);

    try {
      const validRows = previewData.allValidatedRows.filter((r) => r.isValid);
      const invalidRows = previewData.allValidatedRows.filter((r) => !r.isValid);

      const collectedErrors = invalidRows.map((r) => ({
        rowNumber: r.rowNumber,
        productName: r.data.name || 'Unknown',
        error: r.errors.join('; '),
      }));

      const res = await fetch('/api/tenant/products/import/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          validRows,
          meta: {
            fileName: parseResult.fileName,
            fileType: parseResult.fileType,
            totalRows: parseResult.totalRows,
            invalidCount: previewData.invalidCount,
            duplicateCount: previewData.duplicateCount,
            collectedErrors,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Import execution failed.');
      }

      setImportSummary(data.summary);
      setStep(4);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-100">
            Import Product Catalog
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Bulk upload products from CSV or Excel spreadsheets into your isolated store database.
          </p>
        </div>

        <Link href="/tenant/products">
          <Button size="xs" variant="outline" className="text-xs">
            &larr; Back to Products
          </Button>
        </Link>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2 text-xs font-medium text-neutral-400">
        <span className={`px-2.5 py-1 rounded-full ${step >= 1 ? 'bg-indigo-500/20 text-indigo-400 font-semibold border border-indigo-500/30' : 'bg-neutral-900'}`}>
          1. Upload
        </span>
        <span>&rarr;</span>
        <span className={`px-2.5 py-1 rounded-full ${step >= 2 ? 'bg-indigo-500/20 text-indigo-400 font-semibold border border-indigo-500/30' : 'bg-neutral-900'}`}>
          2. Map Columns
        </span>
        <span>&rarr;</span>
        <span className={`px-2.5 py-1 rounded-full ${step >= 3 ? 'bg-indigo-500/20 text-indigo-400 font-semibold border border-indigo-500/30' : 'bg-neutral-900'}`}>
          3. Validate &amp; Preview
        </span>
        <span>&rarr;</span>
        <span className={`px-2.5 py-1 rounded-full ${step >= 4 ? 'bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30' : 'bg-neutral-900'}`}>
          4. Complete
        </span>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
          {error}
        </div>
      )}

      {/* STEP 1: UPLOAD */}
      {step === 1 && (
        <div className="space-y-4">
          <FileDropzone onFileSelected={handleFileSelected} loading={loading} />
        </div>
      )}

      {/* STEP 2: MAP COLUMNS */}
      {step === 2 && parseResult && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-300">
              Found <strong>{parseResult.totalRows}</strong> rows in <code className="font-mono text-indigo-400">{parseResult.fileName}</code>. Map columns below:
            </span>

            <Button
              size="xs"
              variant="outline"
              onClick={() => setStep(1)}
              className="text-xs"
            >
              Choose Different File
            </Button>
          </div>

          <ColumnMapper
            headers={parseResult.headers}
            mapping={columnMapping}
            onMappingChange={setColumnMapping}
            sampleRow={parseResult.sampleRows[0]}
          />

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="default"
              size="sm"
              disabled={loading}
              onClick={handleProceedToPreview}
              className="text-xs"
            >
              {loading ? 'Validating Catalog...' : 'Proceed to Validation & Preview &rarr;'}
            </Button>
          </div>
        </div>
      )}

      {/* STEP 3: PREVIEW */}
      {step === 3 && previewData && (
        <div className="space-y-5">
          <ImportPreviewTable previewData={previewData} />

          <div className="flex items-center justify-between pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStep(2)}
              className="text-xs"
            >
              &larr; Adjust Mapping
            </Button>

            <Button
              variant="default"
              size="sm"
              disabled={loading || previewData.validCount === 0}
              onClick={handleExecuteImport}
              className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              {loading ? 'Inserting Into Database...' : `Import ${previewData.validCount} Valid Products &rarr;`}
            </Button>
          </div>
        </div>
      )}

      {/* STEP 4: SUMMARY */}
      {step === 4 && importSummary && (
        <div className="p-8 rounded-xl border border-emerald-500/30 bg-emerald-500/5 text-center space-y-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 mx-auto">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-bold text-neutral-100">
              Catalog Import Finished!
            </h2>
            <p className="text-xs text-neutral-400">
              Products have been committed directly into your isolated store database.
            </p>
          </div>

          <div className="max-w-md mx-auto grid grid-cols-3 gap-3 p-4 rounded-lg bg-neutral-900/80 border border-neutral-800 text-center font-mono text-xs">
            <div>
              <span className="text-neutral-500 block text-[11px]">Total Processed</span>
              <span className="text-neutral-200 font-bold text-lg">{importSummary.totalRows}</span>
            </div>

            <div>
              <span className="text-emerald-400 block text-[11px]">Successfully Imported</span>
              <span className="text-emerald-400 font-bold text-lg">{importSummary.importedRows}</span>
            </div>

            <div>
              <span className="text-red-400 block text-[11px]">Failed Rows</span>
              <span className="text-red-400 font-bold text-lg">{importSummary.failedRows}</span>
            </div>
          </div>

          <div className="flex justify-center gap-3 pt-2">
            <Link href="/tenant/products">
              <Button size="sm" variant="default" className="text-xs">
                View Product Catalog &rarr;
              </Button>
            </Link>

            {importSummary.failedRows > 0 && (
              <a
                href={`/api/tenant/products/import/errors/${importSummary.historyId}`}
                download
              >
                <Button size="sm" variant="outline" className="text-xs text-red-400 border-red-500/30">
                  Download Error CSV Report
                </Button>
              </a>
            )}

            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setStep(1);
                setParseResult(null);
                setPreviewData(null);
                setImportSummary(null);
              }}
              className="text-xs text-neutral-400"
            >
              Import Another File
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

const TARGET_FIELDS = [
  { value: 'name', label: 'Product Name * (Required)', desc: 'Full name of item' },
  { value: 'category', label: 'Category', desc: 'Classification group' },
  { value: 'brand', label: 'Brand / Manufacturer', desc: 'Brand name' },
  { value: 'mrp', label: 'MRP * (Max Retail Price)', desc: 'Retail sticker price' },
  { value: 'dp', label: 'DP (Dealer Price)', desc: 'Cost / Dealer purchase price' },
  { value: 'sp', label: 'SP (Catalog Field)', desc: 'Imported numeric field (not assumed selling price)' },
  { value: 'packSize', label: 'Pack Size / Unit Size', desc: 'Pack size e.g. 100g, 500ml (NOT stock quantity)' },
  { value: 'unit', label: 'Unit of Measure', desc: 'PCS, g, ml, etc.' },
  { value: 'sku', label: 'SKU / Item Code', desc: 'Unique store item code' },
  { value: 'barcode', label: 'Barcode / EAN', desc: 'Scannable barcode' },
  { value: 'openingStock', label: 'Opening Stock', desc: 'Initial stock units' },
  { value: 'minimumStock', label: 'Minimum Stock', desc: 'Low stock threshold' },
  { value: 'reorderLevel', label: 'Reorder Level', desc: 'Reorder trigger point' },
  { value: 'ignore', label: '— Ignore Column —', desc: 'Do not import this column' },
];

export function ColumnMapper({ headers, mapping, onMappingChange, sampleRow }) {
  function handleSelect(header, targetField) {
    onMappingChange({
      ...mapping,
      [header]: targetField,
    });
  }

  return (
    <div className="space-y-4">
      {/* Informational Callout */}
      <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs space-y-1">
        <p className="font-semibold text-indigo-200">Catalog Field Mapping Rules:</p>
        <ul className="list-disc list-inside space-y-0.5 text-neutral-300">
          <li><strong>SP</strong>: Stored as a raw numeric catalog field without assuming it is selling price.</li>
          <li><strong>Qty (100g, 500ml, etc.)</strong>: Mapped to <strong>Pack Size</strong>, NOT inventory stock quantity.</li>
        </ul>
      </div>

      <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-neutral-900 border-b border-neutral-800 text-neutral-400">
            <tr>
              <th className="py-2.5 px-4 font-medium">Source Column in File</th>
              <th className="py-2.5 px-4 font-medium">Sample Value</th>
              <th className="py-2.5 px-4 font-medium">Maps To Product Field</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800/60">
            {headers.map((h) => {
              const currentTarget = mapping[h] || 'ignore';
              const sampleVal = sampleRow ? sampleRow[h] : '';

              return (
                <tr key={h} className="hover:bg-neutral-800/20 transition-colors">
                  <td className="py-3 px-4 font-mono font-medium text-neutral-200">
                    {h}
                  </td>
                  <td className="py-3 px-4 text-neutral-400 font-mono text-[11px] truncate max-w-xs">
                    {String(sampleVal || '—')}
                  </td>
                  <td className="py-3 px-4">
                    <select
                      value={currentTarget}
                      onChange={(e) => handleSelect(h, e.target.value)}
                      className={`w-full max-w-xs rounded-lg border px-2.5 py-1.5 text-xs focus:outline-none ${
                        currentTarget === 'name' || currentTarget === 'mrp'
                          ? 'border-emerald-500/50 bg-neutral-950 text-emerald-400 font-medium'
                          : currentTarget === 'ignore'
                          ? 'border-neutral-800 bg-neutral-950/60 text-neutral-500'
                          : 'border-neutral-700 bg-neutral-950 text-neutral-200'
                      }`}
                    >
                      {TARGET_FIELDS.map((tf) => (
                        <option key={tf.value} value={tf.value}>
                          {tf.label}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

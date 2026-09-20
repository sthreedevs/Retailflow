import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { ValidationError } from '../lib/errors.js';

export class ImportParserService {
  /**
   * Parses file buffer (CSV or XLSX) into raw row objects and header names
   * @param {Buffer} buffer
   * @param {string} filename
   * @returns {{ headers: string[], rows: object[], totalRows: number }}
   */
  static parseBuffer(buffer, filename) {
    if (!buffer || !filename) {
      throw new ValidationError('File buffer and filename are required.');
    }

    const ext = filename.split('.').pop().toLowerCase();

    if (ext === 'csv') {
      const text = buffer.toString('utf-8');
      const parsed = Papa.parse(text, {
        header: true,
        skipEmptyLines: 'greedy',
        transformHeader: (h) => h.trim(),
      });

      if (parsed.errors && parsed.errors.length > 0 && parsed.data.length === 0) {
        throw new ValidationError(`CSV parsing error: ${parsed.errors[0]?.message}`);
      }

      const headers = parsed.meta.fields ? parsed.meta.fields.map((h) => h.trim()) : [];
      return {
        headers,
        rows: parsed.data,
        totalRows: parsed.data.length,
      };
    }

    if (ext === 'xlsx' || ext === 'xls') {
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const firstSheetName = workbook.SheetNames[0];
      if (!firstSheetName) {
        throw new ValidationError('Excel workbook contains no sheets.');
      }

      const sheet = workbook.Sheets[firstSheetName];
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });

      const headers = rows.length > 0 ? Object.keys(rows[0]).map((h) => h.trim()) : [];

      return {
        headers,
        rows,
        totalRows: rows.length,
      };
    }

    throw new ValidationError(`Unsupported file type: ".${ext}". Please upload a CSV or XLSX file.`);
  }

  /**
   * Auto-detects suggested target field mappings for detected column headers
   * Special Rule: 'Qty' maps strictly to 'packSize' (NOT inventory stock).
   * Special Rule: 'SP' maps strictly to raw numeric 'sp' (NOT selling price).
   *
   * @param {string[]} headers
   * @returns {Record<string, string>} Mapping of sourceHeader -> targetField
   */
  static detectColumnMappings(headers) {
    const mapping = {};

    const targetFieldRules = [
      { field: 'name', regex: /^(product\s*name|item\s*name|name|product_name)$/i },
      { field: 'category', regex: /^(category|item\s*category|cat)$/i },
      { field: 'brand', regex: /^(brand|manufacturer|mfg)$/i },
      { field: 'mrp', regex: /^(mrp|max.*retail.*price|retail.*price)$/i },
      { field: 'dp', regex: /^(dp|dealer.*price|purchase.*price)$/i },
      { field: 'sp', regex: /^(sp|sales.*points?)$/i },
      // Important: 'Qty' in catalog is Pack/Unit Size (e.g. 100g, 500ml)
      { field: 'packSize', regex: /^(qty|quantity|pack\s*size|pack|net\s*wt|weight)$/i },
      { field: 'unit', regex: /^(unit|uom)$/i },
      { field: 'sku', regex: /^(sku|item\s*code|product\s*code)$/i },
      { field: 'barcode', regex: /^(barcode|ean|upc)$/i },
      { field: 'description', regex: /^(description|desc|details)$/i },
      { field: 'openingStock', regex: /^(opening\s*stock|opening\s*qty)$/i },
      { field: 'minimumStock', regex: /^(min.*stock|minimum\s*stock)$/i },
      { field: 'reorderLevel', regex: /^(reorder\s*level|reorder)$/i },
    ];

    for (const header of headers) {
      const trimmed = header.trim();
      for (const rule of targetFieldRules) {
        if (rule.regex.test(trimmed) && !Object.values(mapping).includes(rule.field)) {
          mapping[trimmed] = rule.field;
          break;
        }
      }
    }

    return mapping;
  }
}

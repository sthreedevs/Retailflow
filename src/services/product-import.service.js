import { getProductModel } from '../models/tenant/product.model.js';
import { getImportHistoryModel } from '../models/tenant/import-history.model.js';
import { ValidationError } from '../lib/errors.js';

export class ProductImportService {
  /**
   * Cleans and parses a numeric string into a valid number (e.g. "₹ 232.00", "2,073" -> 2073)
   * @param {any} val
   * @param {number} defaultVal
   * @returns {number}
   */
  static parseCleanNumber(val, defaultVal = 0) {
    if (val === null || val === undefined || val === '') return defaultVal;
    if (typeof val === 'number') return isNaN(val) ? defaultVal : val;
    const cleanStr = String(val).replace(/[^0-9.-]/g, '');
    const num = parseFloat(cleanStr);
    return isNaN(num) ? defaultVal : num;
  }

  /**
   * Validates in-memory rows against the mapping, detects duplicates, and checks existing DB records.
   *
   * @param {object[]} rawRows
   * @param {Record<string, string>} columnMapping - { sourceHeader: targetField }
   * @param {import('mongoose').Connection} tenantConn
   */
  static async validateAndPreview(rawRows, columnMapping, tenantConn) {
    if (!rawRows || !Array.isArray(rawRows)) {
      throw new ValidationError('Invalid row data provided for validation.');
    }

    const Product = getProductModel(tenantConn);

    // Invert mapping for quick lookup: targetField -> sourceHeader
    const fieldToSource = {};
    for (const [sourceHeader, targetField] of Object.entries(columnMapping || {})) {
      if (targetField && targetField !== 'ignore') {
        fieldToSource[targetField] = sourceHeader;
      }
    }

    if (!fieldToSource.name) {
      throw new ValidationError('Mapping must include a column mapped to "Product Name" (name).');
    }

    // Pre-fetch all existing SKUs and Barcodes in this tenant to detect duplicates
    const [existingSkus, existingBarcodes] = await Promise.all([
      Product.distinct('sku', { sku: { $exists: true, $ne: '' } }),
      Product.distinct('barcode', { barcode: { $exists: true, $ne: '' } }),
    ]);

    const existingSkuSet = new Set(existingSkus.map((s) => String(s).trim().toLowerCase()));
    const existingBarcodeSet = new Set(existingBarcodes.map((b) => String(b).trim().toLowerCase()));

    const seenFileSkus = new Set();
    const seenFileBarcodes = new Set();

    const validatedRows = [];
    let validCount = 0;
    let invalidCount = 0;
    let duplicateCount = 0;

    rawRows.forEach((rawRow, index) => {
      const rowNumber = index + 1;
      const errors = [];
      const warnings = [];

      // Extract mapped values
      const name = String(rawRow[fieldToSource.name] || '').trim();
      const category = fieldToSource.category ? String(rawRow[fieldToSource.category] || '').trim() : 'General';
      const brand = fieldToSource.brand ? String(rawRow[fieldToSource.brand] || '').trim() : '';
      const sku = fieldToSource.sku ? String(rawRow[fieldToSource.sku] || '').trim() : '';
      const barcode = fieldToSource.barcode ? String(rawRow[fieldToSource.barcode] || '').trim() : '';
      const description = fieldToSource.description ? String(rawRow[fieldToSource.description] || '').trim() : '';

      // Catalog pricing & packaging
      const rawMrp = fieldToSource.mrp ? rawRow[fieldToSource.mrp] : undefined;
      const mrp = this.parseCleanNumber(rawMrp, 0);

      const rawDp = fieldToSource.dp ? rawRow[fieldToSource.dp] : undefined;
      const dp = this.parseCleanNumber(rawDp, 0);

      // IMPORTANT: SP is a numeric catalog field whose meaning is currently unconfirmed.
      // Do NOT treat SP as selling price.
      const rawSp = fieldToSource.sp ? rawRow[fieldToSource.sp] : undefined;
      const sp = this.parseCleanNumber(rawSp, 0);

      // IMPORTANT: CSV Qty values such as 100g, 500ml and 1000ml represent pack size, NOT current inventory quantity.
      const packSize = fieldToSource.packSize ? String(rawRow[fieldToSource.packSize] || '').trim() : '';

      let unit = fieldToSource.unit ? String(rawRow[fieldToSource.unit] || '').trim() : '';
      if (!unit) {
        // Simple unit inference if packSize has trailing units (e.g. 500ml -> ml, 100g -> g)
        const unitMatch = packSize.match(/[a-zA-Z]+$/);
        unit = unitMatch ? unitMatch[0].toUpperCase() : 'PCS';
      }

      // Inventory config
      const openingStock = fieldToSource.openingStock ? this.parseCleanNumber(rawRow[fieldToSource.openingStock], 0) : 0;
      const minimumStock = fieldToSource.minimumStock ? this.parseCleanNumber(rawRow[fieldToSource.minimumStock], 0) : 0;
      const reorderLevel = fieldToSource.reorderLevel ? this.parseCleanNumber(rawRow[fieldToSource.reorderLevel], 0) : 0;

      // --- Validation Rules ---
      if (!name) {
        errors.push('Product name is required');
      }

      if (rawMrp !== undefined && isNaN(parseFloat(String(rawMrp).replace(/[^0-9.-]/g, '')))) {
        errors.push('Invalid MRP value');
      } else if (mrp < 0) {
        errors.push('MRP cannot be negative');
      }

      // Check SKU uniqueness
      if (sku) {
        const skuLower = sku.toLowerCase();
        if (seenFileSkus.has(skuLower)) {
          errors.push(`Duplicate SKU "${sku}" found within file`);
          duplicateCount++;
        } else if (existingSkuSet.has(skuLower)) {
          warnings.push(`SKU "${sku}" already exists in store catalog (will be updated)`);
        }
        seenFileSkus.add(skuLower);
      }

      // Check Barcode uniqueness
      if (barcode) {
        const barcodeLower = barcode.toLowerCase();
        if (seenFileBarcodes.has(barcodeLower)) {
          errors.push(`Duplicate Barcode "${barcode}" found within file`);
          duplicateCount++;
        } else if (existingBarcodeSet.has(barcodeLower)) {
          warnings.push(`Barcode "${barcode}" already exists in store catalog`);
        }
        seenFileBarcodes.add(barcodeLower);
      }

      const isValid = errors.length === 0;
      if (isValid) {
        validCount++;
      } else {
        invalidCount++;
      }

      validatedRows.push({
        rowNumber,
        isValid,
        errors,
        warnings,
        data: {
          name,
          category: category || 'General',
          brand: brand || '',
          sku: sku || undefined,
          barcode: barcode || undefined,
          description,
          mrp,
          dp,
          sp, // Raw numeric catalog field
          packSize, // Pack/Unit size
          unit: unit || 'PCS',
          openingStock,
          minimumStock,
          reorderLevel,
          status: 'ACTIVE',
        },
        raw: rawRow,
      });
    });

    return {
      totalRows: rawRows.length,
      validCount,
      invalidCount,
      duplicateCount,
      previewRows: validatedRows.slice(0, 50),
      allValidatedRows: validatedRows,
    };
  }

  /**
   * Executes high-throughput bulk insertion of validated products into the tenant database
   *
   * @param {object[]} validRows - Array of validated row items
   * @param {{ fileName: string, fileType: string, totalRows: number }} meta
   * @param {import('mongoose').Connection} tenantConn
   * @param {{ userId: string, email: string }} user
   */
  static async executeBulkImport(validRows, meta, tenantConn, user) {
    if (!validRows || validRows.length === 0) {
      throw new ValidationError('No valid rows provided for import.');
    }

    const Product = getProductModel(tenantConn);
    const ImportHistory = getImportHistoryModel(tenantConn);

    const operations = [];
    const productsToInsert = [];

    for (const item of validRows) {
      const rawP = item.data || item;
      const p = {
        name: String(rawP.name || '').trim(),
        category: String(rawP.category || 'General').trim(),
        brand: String(rawP.brand || '').trim(),
        sku: rawP.sku ? String(rawP.sku).trim() : undefined,
        barcode: rawP.barcode ? String(rawP.barcode).trim() : undefined,
        description: String(rawP.description || '').trim(),
        mrp: Math.max(0, Number(rawP.mrp) || 0),
        dp: Math.max(0, Number(rawP.dp) || 0),
        sp: Math.max(0, Number(rawP.sp) || 0),
        packSize: String(rawP.packSize || '').trim(),
        unit: String(rawP.unit || 'PCS').trim(),
        openingStock: Math.max(0, Number(rawP.openingStock) || 0),
        minimumStock: Math.max(0, Number(rawP.minimumStock) || 0),
        reorderLevel: Math.max(0, Number(rawP.reorderLevel) || 0),
        status: ['ACTIVE', 'INACTIVE', 'ARCHIVED'].includes(rawP.status) ? rawP.status : 'ACTIVE',
      };

      // If product has SKU or Barcode, perform upsert to prevent duplicates
      if (p.sku) {
        operations.push({
          updateOne: {
            filter: { sku: p.sku },
            update: { $set: p },
            upsert: true,
          },
        });
      } else if (p.barcode) {
        operations.push({
          updateOne: {
            filter: { barcode: p.barcode },
            update: { $set: p },
            upsert: true,
          },
        });
      } else {
        productsToInsert.push(p);
      }
    }

    let importedCount = 0;
    const errors = [];

    // Execute bulk write for items with SKU/barcode
    if (operations.length > 0) {
      try {
        const bulkRes = await Product.bulkWrite(operations, { ordered: false });
        importedCount += (bulkRes.upsertedCount || 0) + (bulkRes.modifiedCount || 0) + (bulkRes.insertedCount || 0);
      } catch (err) {
        if (err.writeErrors) {
          err.writeErrors.forEach((we) => {
            errors.push({
              rowNumber: we.index + 1,
              productName: 'Unknown',
              error: we.errmsg || 'Write error during bulk write',
            });
          });
        }
      }
    }

    // Execute insertMany for items without SKU/barcode
    if (productsToInsert.length > 0) {
      try {
        const inserted = await Product.insertMany(productsToInsert, { ordered: false });
        importedCount += inserted.length;
      } catch (err) {
        if (err.insertedDocs) {
          importedCount += err.insertedDocs.length;
        }
        if (err.writeErrors) {
          err.writeErrors.forEach((we) => {
            errors.push({
              rowNumber: we.index + 1,
              productName: 'Unknown',
              error: we.errmsg,
            });
          });
        }
      }
    }

    const totalRows = meta.totalRows || validRows.length;
    const failedCount = (meta.invalidCount || 0) + errors.length;

    const status = failedCount === 0 ? 'SUCCESS' : importedCount > 0 ? 'PARTIAL' : 'FAILED';

    // Record in tenant import history
    const historyDoc = await ImportHistory.create({
      fileName: meta.fileName || 'catalog_import',
      fileType: meta.fileType || 'CSV',
      totalRows,
      importedRows: importedCount,
      failedRows: failedCount,
      duplicateRows: meta.duplicateCount || 0,
      status,
      rowErrors: [...(meta.collectedErrors || []), ...errors],
      importedBy: {
        userId: user.userId,
        email: user.email,
      },
    });

    return {
      historyId: historyDoc._id.toString(),
      totalRows,
      importedRows: importedCount,
      failedRows: failedCount,
      duplicateRows: meta.duplicateCount || 0,
      status,
    };
  }

  /**
   * Retrieves import history list for this tenant
   */
  static async getImportHistory(tenantConn, limit = 20) {
    const ImportHistory = getImportHistoryModel(tenantConn);
    return ImportHistory.find().sort({ createdAt: -1 }).limit(limit).lean();
  }

  /**
   * Generates a downloadable CSV string of errors for a specific import job
   */
  static async generateErrorReportCsv(tenantConn, historyId) {
    const ImportHistory = getImportHistoryModel(tenantConn);
    const history = await ImportHistory.findById(historyId).lean();

    if (!history || !history.rowErrors || history.rowErrors.length === 0) {
      return 'Row Number,Product Name,Error Reason\n';
    }

    const header = 'Row Number,Product Name,Error Reason\n';
    const rows = history.rowErrors.map((e) => {
      const cleanProd = String(e.productName || 'N/A').replace(/"/g, '""');
      const cleanErr = String(e.error || 'Unknown error').replace(/"/g, '""');
      return `${e.rowNumber || 0},"${cleanProd}","${cleanErr}"`;
    });

    return header + rows.join('\n');
  }
}

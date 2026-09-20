import PDFDocument from 'pdfkit';

/**
 * Generates a clean, professional PDF buffer for an invoice.
 * Supports A4, 80mm thermal, and 58mm thermal layouts.
 *
 * @param {object} sale - Sale record
 * @param {object} store - Store settings
 * @param {string} [layout='A4'] - 'A4' | '80mm' | '58mm'
 * @returns {Promise<Buffer>}
 */
export async function generateInvoicePDFBuffer(sale, store = {}, layout = 'A4') {
  return new Promise((resolve, reject) => {
    try {
      const isThermal58 = layout === '58mm';
      const isThermal80 = layout === '80mm';
      const isThermal = isThermal58 || isThermal80;

      // Dimensions in points (72 points = 1 inch = 25.4 mm)
      // 58mm = ~164 pt, 80mm = ~226 pt, A4 = 595 x 842 pt
      const docWidth = isThermal58 ? 164 : isThermal80 ? 226 : 595.28;
      const docHeight = isThermal58 ? 600 : isThermal80 ? 700 : 841.89;
      const margin = isThermal58 ? 10 : isThermal80 ? 14 : 36;

      const doc = new PDFDocument({
        size: [docWidth, docHeight],
        margin,
        bufferPages: true,
      });

      const chunks = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      const storeName = store.storeName || 'RETAIL STORE';
      const storePhone = store.phone ? `Phone: ${store.phone}` : '';
      const storeAddress = store.address || '';
      const invoiceNumber = sale.invoiceNumber || 'INV-0000';
      const dateStr = sale.createdAt ? new Date(sale.createdAt).toLocaleDateString() : new Date().toLocaleDateString();
      const timeStr = sale.createdAt ? new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
      const customerName = sale.customer?.name || 'Walk-in Customer';
      const customerPhone = sale.customer?.phone || '';
      const cashierName = sale.billedBy?.name || 'Store Cashier';
      const footerMsg = store.footerMessage || 'Thank you for shopping with us! Visit again.';

      // Helvetica WinAnsi encoding safe currency representation (avoids dropped Unicode glyphs)
      const rawSym = store.currencySymbol || 'Rs.';
      const currSym = rawSym === '₹' ? 'Rs.' : rawSym;

      if (isThermal) {
        // --- THERMAL RECEIPT LAYOUT (80mm / 58mm) ---
        const fontSizeHeader = isThermal58 ? 11 : 13;
        const fontSizeRegular = isThermal58 ? 8 : 9;
        const fontSizeSmall = isThermal58 ? 7 : 8;

        // Store Header
        doc.font('Helvetica-Bold').fontSize(fontSizeHeader).text(storeName.toUpperCase(), { align: 'center' });
        doc.font('Helvetica').fontSize(fontSizeSmall);
        if (storeAddress) doc.text(storeAddress, { align: 'center' });
        if (storePhone) doc.text(storePhone, { align: 'center' });

        doc.moveDown(0.4);
        doc.fontSize(fontSizeSmall).text('------------------------------------------------------------', { align: 'center' });
        doc.moveDown(0.2);

        // Receipt Meta
        doc.fontSize(fontSizeSmall);
        doc.text(`Invoice: ${invoiceNumber}`);
        doc.text(`Date: ${dateStr} ${timeStr}`);
        doc.text(`Customer: ${customerName}`);
        if (customerPhone) doc.text(`Phone: ${customerPhone}`);
        doc.text(`Cashier: ${cashierName}`);

        doc.moveDown(0.3);
        doc.text('------------------------------------------------------------', { align: 'center' });
        doc.moveDown(0.2);

        // Items Header
        doc.font('Helvetica-Bold').fontSize(fontSizeSmall);
        const colItemW = isThermal58 ? 75 : 110;
        const colQtyW = isThermal58 ? 35 : 45;

        doc.text('Item', { continued: true, width: colItemW });
        doc.text('Qty x Rate', { continued: true, width: colQtyW, align: 'right' });
        doc.text('Total', { align: 'right' });
        doc.font('Helvetica');

        doc.moveDown(0.2);

        // Items List
        (sale.items || []).forEach((item) => {
          const name = item.name.length > (isThermal58 ? 16 : 22) ? item.name.substring(0, isThermal58 ? 14 : 20) + '..' : item.name;
          doc.text(name, { continued: true, width: colItemW });
          doc.text(`${item.quantity}x${item.unitPrice}`, { continued: true, width: colQtyW, align: 'right' });
          doc.text(`${currSym} ${item.lineTotal}`, { align: 'right' });
        });

        doc.moveDown(0.3);
        doc.text('------------------------------------------------------------', { align: 'center' });
        doc.moveDown(0.2);

        // Totals
        doc.fontSize(fontSizeSmall);
        doc.text(`Subtotal:`, { continued: true });
        doc.text(`${currSym} ${sale.subtotal}`, { align: 'right' });

        if (sale.discountTotal > 0) {
          doc.text(`Discount:`, { continued: true });
          doc.text(`-${currSym} ${sale.discountTotal}`, { align: 'right' });
        }

        if (sale.taxTotal > 0) {
          doc.text(`Tax / GST:`, { continued: true });
          doc.text(`+${currSym} ${sale.taxTotal}`, { align: 'right' });
        }

        doc.font('Helvetica-Bold').fontSize(fontSizeRegular);
        doc.text(`GRAND TOTAL:`, { continued: true });
        doc.text(`${currSym} ${sale.grandTotal}`, { align: 'right' });
        doc.font('Helvetica').fontSize(fontSizeSmall);

        doc.moveDown(0.3);
        doc.text(`Payment: ${sale.paymentMethod} (PAID)`);
        if (sale.paymentMethod === 'CASH') {
          doc.text(`Tendered: ${currSym} ${sale.amountPaid || sale.grandTotal} | Change: ${currSym} ${sale.changeDue || 0}`);
        }

        doc.moveDown(0.5);
        doc.text('------------------------------------------------------------', { align: 'center' });
        doc.moveDown(0.3);
        doc.fontSize(fontSizeSmall).text(footerMsg, { align: 'center' });
      } else {
        // --- STANDARD A4 INVOICE LAYOUT ---
        // Header
        doc.font('Helvetica-Bold').fontSize(22).fillColor('#111827').text(storeName);
        doc.font('Helvetica').fontSize(9).fillColor('#4B5563');
        if (storeAddress) doc.text(storeAddress);
        if (storePhone) doc.text(storePhone);

        // Invoice Badge top right
        doc.rect(390, 36, 170, 75).fillAndStroke('#F9FAFB', '#E5E7EB');
        doc.fillColor('#111827').font('Helvetica-Bold').fontSize(14).text('TAX INVOICE', 405, 48);
        doc.font('Helvetica').fontSize(9).fillColor('#374151');
        doc.text(`Invoice #: ${invoiceNumber}`, 405, 68);
        doc.text(`Date: ${dateStr} ${timeStr}`, 405, 82);
        doc.text(`Cashier: ${cashierName}`, 405, 96);

        doc.moveDown(2);

        // Bill To Box
        const startY = 135;
        doc.rect(36, startY, 524, 55).fillAndStroke('#F9FAFB', '#E5E7EB');
        doc.font('Helvetica-Bold').fontSize(9).fillColor('#4B5563').text('BILL TO / CUSTOMER', 48, startY + 10);
        doc.font('Helvetica-Bold').fontSize(11).fillColor('#111827').text(customerName, 48, startY + 24);
        doc.font('Helvetica').fontSize(9).fillColor('#4B5563');
        const custInfo = [];
        if (customerPhone) custInfo.push(`Phone: ${customerPhone}`);
        if (sale.customer?.address) custInfo.push(`Address: ${sale.customer.address}`);
        if (custInfo.length > 0) doc.text(custInfo.join(' • '), 48, startY + 40);

        // Table Header
        const tableY = startY + 70;
        doc.rect(36, tableY, 524, 24).fill('#1F2937');
        doc.font('Helvetica-Bold').fontSize(9).fillColor('#FFFFFF');
        doc.text('#', 44, tableY + 7, { width: 25 });
        doc.text('Item & Description', 75, tableY + 7, { width: 195 });
        doc.text('Pack', 275, tableY + 7, { width: 50 });
        doc.text('Rate', 330, tableY + 7, { width: 55, align: 'right' });
        doc.text('Qty', 390, tableY + 7, { width: 45, align: 'right' });
        doc.text('Disc', 440, tableY + 7, { width: 45, align: 'right' });
        doc.text('Total', 490, tableY + 7, { width: 60, align: 'right' });

        // Items Rows
        let rowY = tableY + 24;
        doc.font('Helvetica').fontSize(9).fillColor('#1F2937');

        (sale.items || []).forEach((item, idx) => {
          const rowBg = idx % 2 === 1 ? '#F9FAFB' : '#FFFFFF';
          doc.rect(36, rowY, 524, 20).fill(rowBg);
          doc.fillColor('#1F2937');

          doc.text(String(idx + 1), 44, rowY + 5, { width: 25 });
          doc.text(item.name, 75, rowY + 5, { width: 195, lineBreak: false });
          doc.text(item.packSize || '-', 275, rowY + 5, { width: 50 });
          doc.text(`${currSym} ${item.unitPrice}`, 330, rowY + 5, { width: 55, align: 'right' });
          doc.text(`${item.quantity} ${item.unit || ''}`, 390, rowY + 5, { width: 45, align: 'right' });
          doc.text(item.discount > 0 ? `${currSym} ${item.discount}` : '-', 440, rowY + 5, { width: 45, align: 'right' });
          doc.text(`${currSym} ${item.lineTotal}`, 490, rowY + 5, { width: 60, align: 'right' });

          rowY += 20;
        });

        // Horizontal line below table
        doc.moveTo(36, rowY).lineTo(560, rowY).stroke('#E5E7EB');

        // Summary Table
        const summaryY = rowY + 15;
        const summaryX = 350;

        doc.rect(summaryX, summaryY, 210, 100).fillAndStroke('#F9FAFB', '#E5E7EB');
        doc.font('Helvetica').fontSize(9).fillColor('#4B5563');

        doc.text('Subtotal:', summaryX + 15, summaryY + 12);
        doc.text(`${currSym} ${sale.subtotal}`, summaryX + 110, summaryY + 12, { width: 85, align: 'right' });

        if (sale.discountTotal > 0) {
          doc.fillColor('#059669');
          doc.text('Discount:', summaryX + 15, summaryY + 28);
          doc.text(`-${currSym} ${sale.discountTotal}`, summaryX + 110, summaryY + 28, { width: 85, align: 'right' });
          doc.fillColor('#4B5563');
        }

        if (sale.taxTotal > 0) {
          doc.text('Tax / GST:', summaryX + 15, summaryY + 44);
          doc.text(`+${currSym} ${sale.taxTotal}`, summaryX + 110, summaryY + 44, { width: 85, align: 'right' });
        }

        doc.moveTo(summaryX, summaryY + 62).lineTo(summaryX + 210, summaryY + 62).stroke('#E5E7EB');

        doc.font('Helvetica-Bold').fontSize(11).fillColor('#111827');
        doc.text('GRAND TOTAL:', summaryX + 15, summaryY + 74);
        doc.text(`${currSym} ${sale.grandTotal}`, summaryX + 110, summaryY + 74, { width: 85, align: 'right' });

        // Payment Info (Left of summary)
        doc.rect(36, summaryY, 280, 100).fillAndStroke('#F9FAFB', '#E5E7EB');
        doc.font('Helvetica-Bold').fontSize(9).fillColor('#374151').text('PAYMENT DETAILS', 48, summaryY + 12);
        doc.font('Helvetica').fontSize(9).fillColor('#4B5563');
        doc.text(`Method: ${sale.paymentMethod}`, 48, summaryY + 28);
        doc.text(`Status: ${sale.paymentStatus}`, 48, summaryY + 44);
        if (sale.paymentMethod === 'CASH') {
          doc.text(`Amount Tendered: ${currSym} ${sale.amountPaid || sale.grandTotal}   Change Due: ${currSym} ${sale.changeDue || 0}`, 48, summaryY + 60);
        }
        if (sale.notes) {
          doc.text(`Notes: ${sale.notes}`, 48, summaryY + 76, { width: 255 });
        }

        // Footer Message
        const footerY = summaryY + 130;
        doc.moveTo(36, footerY).lineTo(560, footerY).stroke('#E5E7EB');
        doc.font('Helvetica-Oblique').fontSize(9).fillColor('#6B7280').text(footerMsg, 36, footerY + 12, { align: 'center', width: 524 });
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

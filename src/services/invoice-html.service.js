/**
 * Service to generate standalone, print-ready HTML documents for invoices.
 * Supports Marg ERP / Retail POS style:
 * 1. 80mm Thermal Receipt (POS Counter standard)
 * 2. A4 Marg-Style Tax Invoice (Indian GST compliant boxed format)
 */

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function amountToWords(num) {
  if (!num || isNaN(num)) return 'Zero Rupees Only';
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const n = Math.floor(Math.abs(num));
  if (n === 0) return 'Zero Rupees Only';

  function convert(val) {
    if (val < 20) return a[val];
    if (val < 100) return b[Math.floor(val / 10)] + (val % 10 !== 0 ? ' ' + a[val % 10] : ' ');
    if (val < 1000) return a[Math.floor(val / 100)] + 'Hundred ' + (val % 100 !== 0 ? convert(val % 100) : '');
    if (val < 100000) return convert(Math.floor(val / 1000)) + 'Thousand ' + (val % 1000 !== 0 ? convert(val % 1000) : '');
    if (val < 10000000) return convert(Math.floor(val / 100000)) + 'Lakh ' + (val % 100000 !== 0 ? convert(val % 100000) : '');
    return convert(Math.floor(val / 10000000)) + 'Crore ' + (val % 10000000 !== 0 ? convert(val % 10000000) : '');
  }

  return ('Rupees ' + convert(n).trim() + ' Only').replace(/\s+/g, ' ');
}

export function generateInvoiceHTML(sale, store = {}, layout = '80mm', autoprint = true) {
  const isA4 = layout === 'A4';
  const storeName = escapeHtml(store.storeName || 'RETAIL STORE');
  const storeAddress = escapeHtml(store.address || '');
  const storePhone = escapeHtml(store.phone || '');
  const storeTaxId = escapeHtml(store.taxId || '');
  const footerMessage = escapeHtml(store.footerMessage || 'Thank you for shopping with us! Visit again.');
  const currency = escapeHtml(store.currencySymbol || '₹');

  const invoiceNumber = escapeHtml(sale.invoiceNumber || 'INV-0000');
  const dateStr = sale.createdAt ? new Date(sale.createdAt).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN');
  const timeStr = sale.createdAt ? new Date(sale.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '';
  const customerName = escapeHtml(sale.customer?.name || 'Walk-in Customer');
  const customerPhone = escapeHtml(sale.customer?.phone || '');
  const customerAddress = escapeHtml(sale.customer?.address || '');
  const cashierName = escapeHtml(sale.billedBy?.name || 'Cashier');
  const paymentMethod = escapeHtml(sale.paymentMethod || 'CASH');

  const items = sale.items || [];
  const subtotal = Number(sale.subtotal || 0).toFixed(2);
  const discountTotal = Number(sale.discountTotal || 0).toFixed(2);
  const taxTotal = Number(sale.taxTotal || 0).toFixed(2);
  const grandTotal = Number(sale.grandTotal || 0).toFixed(2);
  const amountPaid = Number(sale.amountPaid || grandTotal).toFixed(2);
  const changeDue = Number(sale.changeDue || 0).toFixed(2);
  const words = amountToWords(sale.grandTotal);

  // Common toolbar for screen viewing (hidden during print)
  const toolbarHtml = `
    <div class="no-print print-toolbar">
      <div class="toolbar-content">
        <div class="toolbar-title">
          <strong>${invoiceNumber}</strong> &bull; ${storeName}
        </div>
        <div class="toolbar-actions">
          <a href="?format=80mm&autoprint=0" class="btn ${!isA4 ? 'btn-active' : 'btn-secondary'}">80mm Thermal</a>
          <a href="?format=A4&autoprint=0" class="btn ${isA4 ? 'btn-active' : 'btn-secondary'}">A4 Tax Invoice</a>
          <button onclick="window.print()" class="btn btn-primary">🖨️ Print Bill</button>
          <a href="/api/tenant/pos/bills/${sale._id}/pdf?format=${isA4 ? 'A4' : '80mm'}" target="_blank" class="btn btn-secondary">📥 Download PDF</a>
          <button onclick="window.close()" class="btn btn-danger">✕ Close</button>
        </div>
      </div>
    </div>
  `;

  // --- 80MM THERMAL RECEIPT LAYOUT ---
  const thermalBodyHtml = `
    <div class="receipt-wrapper">
      <div class="thermal-receipt">
        <!-- Store Header -->
        <div class="text-center pb-2 border-b-dashed">
          <div class="store-name">${storeName}</div>
          ${storeAddress ? `<div class="store-info">${storeAddress}</div>` : ''}
          ${storePhone ? `<div class="store-info">Tel: ${storePhone}</div>` : ''}
          ${storeTaxId ? `<div class="store-info">GSTIN: ${storeTaxId}</div>` : ''}
          <div class="invoice-title">*** TAX INVOICE / RETAIL RECEIPT ***</div>
          <div class="store-info">${dateStr} ${timeStr}</div>
        </div>

        <!-- Meta Section -->
        <div class="py-2 border-b-dashed text-small">
          <div class="flex-between">
            <span class="label">Invoice No:</span>
            <span class="value font-bold">${invoiceNumber}</span>
          </div>
          <div class="flex-between">
            <span class="label">Customer:</span>
            <span class="value font-bold">${customerName}</span>
          </div>
          ${customerPhone ? `
          <div class="flex-between">
            <span class="label">Mobile:</span>
            <span class="value">${customerPhone}</span>
          </div>` : ''}
          <div class="flex-between">
            <span class="label">Cashier:</span>
            <span class="value">${cashierName}</span>
          </div>
        </div>

        <!-- Items Table -->
        <div class="py-2 border-b-dashed">
          <table class="items-table">
            <thead>
              <tr class="border-b-solid">
                <th class="text-left w-item">ITEM</th>
                <th class="text-right w-qty">QTY x RATE</th>
                <th class="text-right w-tot">AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              ${items.map((it) => `
                <tr>
                  <td class="text-left">
                    <div class="font-bold">${escapeHtml(it.name)}</div>
                    ${it.packSize ? `<div class="text-xs text-muted">${escapeHtml(it.packSize)}</div>` : ''}
                  </td>
                  <td class="text-right whitespace-nowrap">${it.quantity} x ${currency}${Number(it.unitPrice || 0).toFixed(2)}</td>
                  <td class="text-right font-bold whitespace-nowrap">${currency}${Number(it.lineTotal || 0).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <!-- Totals Section -->
        <div class="py-2 border-b-dashed text-small">
          <div class="flex-between">
            <span>Subtotal:</span>
            <span>${currency}${subtotal}</span>
          </div>
          ${Number(discountTotal) > 0 ? `
          <div class="flex-between font-bold">
            <span>Discount:</span>
            <span>-${currency}${discountTotal}</span>
          </div>` : ''}
          ${Number(taxTotal) > 0 ? `
          <div class="flex-between">
            <span>Tax / GST:</span>
            <span>+${currency}${taxTotal}</span>
          </div>` : ''}
          <div class="flex-between grand-total-row border-t-solid mt-1 pt-1">
            <span>NET PAYABLE:</span>
            <span class="grand-total-amount">${currency}${grandTotal}</span>
          </div>
        </div>

        <!-- Settlement -->
        <div class="py-2 border-b-dashed text-small">
          <div class="flex-between">
            <span class="label">Payment Mode:</span>
            <span class="value font-bold">${paymentMethod}</span>
          </div>
          ${paymentMethod === 'CASH' ? `
          <div class="flex-between">
            <span class="label">Cash Tendered:</span>
            <span class="value">${currency}${amountPaid}</span>
          </div>
          <div class="flex-between font-bold">
            <span class="label">Change Returned:</span>
            <span class="value">${currency}${changeDue}</span>
          </div>` : ''}
        </div>

        <!-- Footer -->
        <div class="text-center pt-2 footer-note">
          <div>${words}</div>
          <div class="mt-1">${footerMessage}</div>
          <div class="powered-by">Powered by RetailFlow</div>
        </div>
      </div>
    </div>
  `;

  // --- A4 MARG / RETAIL TAX INVOICE LAYOUT ---
  const a4BodyHtml = `
    <div class="a4-wrapper">
      <div class="a4-invoice">
        <!-- Top Store Header (Marg Style Box) -->
        <div class="a4-header-box">
          <div class="a4-store-details">
            <h1 class="a4-store-title">${storeName}</h1>
            ${storeAddress ? `<p class="a4-store-sub">${storeAddress}</p>` : ''}
            <p class="a4-store-sub">
              ${storePhone ? `Phone: ${storePhone} &bull; ` : ''}
              ${storeTaxId ? `<strong>GSTIN:</strong> ${storeTaxId}` : ''}
            </p>
          </div>
          <div class="a4-invoice-badge">
            <div class="badge-title">TAX INVOICE</div>
            <div class="badge-sub">Original for Recipient</div>
          </div>
        </div>

        <!-- Meta Grid Box (Billed To & Invoice Meta) -->
        <div class="a4-meta-grid">
          <div class="a4-meta-col border-right">
            <div class="meta-col-header">DETAILS OF RECIPIENT / BILLED TO:</div>
            <div class="meta-field"><strong>Name:</strong> ${customerName}</div>
            ${customerPhone ? `<div class="meta-field"><strong>Contact:</strong> ${customerPhone}</div>` : ''}
            ${customerAddress ? `<div class="meta-field"><strong>Address:</strong> ${customerAddress}</div>` : ''}
            <div class="meta-field"><strong>Place of Supply:</strong> Intra-State</div>
          </div>
          <div class="a4-meta-col">
            <div class="meta-col-header">INVOICE & PAYMENT DETAILS:</div>
            <div class="meta-field"><strong>Invoice No:</strong> ${invoiceNumber}</div>
            <div class="meta-field"><strong>Date & Time:</strong> ${dateStr} ${timeStr}</div>
            <div class="meta-field"><strong>Payment Mode:</strong> ${paymentMethod}</div>
            <div class="meta-field"><strong>Cashier / Billed By:</strong> ${cashierName}</div>
          </div>
        </div>

        <!-- Line Items Table (Marg Boxed Ledger Grid) -->
        <table class="a4-table">
          <thead>
            <tr>
              <th style="width: 35px;">#</th>
              <th>Description of Goods / Services</th>
              <th style="width: 70px;">Pack</th>
              <th style="width: 60px;" class="text-center">Qty</th>
              <th style="width: 80px;" class="text-right">Rate (${currency})</th>
              <th style="width: 70px;" class="text-right">Disc (${currency})</th>
              <th style="width: 90px;" class="text-right">Amount (${currency})</th>
            </tr>
          </thead>
          <tbody>
            ${items.map((it, idx) => `
              <tr>
                <td class="text-center">${idx + 1}</td>
                <td>
                  <strong>${escapeHtml(it.name)}</strong>
                  ${it.barcode ? `<span class="text-muted text-xs"> [${escapeHtml(it.barcode)}]</span>` : ''}
                </td>
                <td>${escapeHtml(it.packSize || '-')}</td>
                <td class="text-center font-bold">${it.quantity}</td>
                <td class="text-right">${Number(it.unitPrice || 0).toFixed(2)}</td>
                <td class="text-right">${Number(it.discount || 0).toFixed(2)}</td>
                <td class="text-right font-bold">${Number(it.lineTotal || 0).toFixed(2)}</td>
              </tr>
            `).join('')}
            <!-- Empty rows to preserve format height if few items -->
            ${items.length < 4 ? Array.from({ length: 4 - items.length }).map(() => `
              <tr class="empty-row">
                <td>&nbsp;</td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
              </tr>
            `).join('') : ''}
          </tbody>
        </table>

        <!-- Summary & Footer Box (Marg Style Ledger Total) -->
        <div class="a4-summary-grid">
          <div class="a4-summary-left">
            <div class="amount-words-box">
              <span class="label">Amount in Words:</span>
              <div class="words-text">${words}</div>
            </div>
            <div class="terms-box">
              <div class="terms-title">Terms & Conditions:</div>
              <ol class="terms-list">
                <li>Goods once sold will not be taken back or exchanged.</li>
                <li>Invoice subject to jurisdiction of local court only.</li>
                <li>${footerMessage}</li>
              </ol>
            </div>
          </div>
          <div class="a4-summary-right">
            <div class="sum-row">
              <span>Subtotal:</span>
              <span>${currency}${subtotal}</span>
            </div>
            ${Number(discountTotal) > 0 ? `
            <div class="sum-row text-green">
              <span>Total Discount:</span>
              <span>-${currency}${discountTotal}</span>
            </div>` : ''}
            ${Number(taxTotal) > 0 ? `
            <div class="sum-row">
              <span>Tax / GST:</span>
              <span>+${currency}${taxTotal}</span>
            </div>` : ''}
            <div class="sum-row grand-total-box">
              <span>NET PAYABLE:</span>
              <span class="grand-total-val">${currency}${grandTotal}</span>
            </div>
            <div class="sign-box">
              <div class="sign-store">For ${storeName}</div>
              <div class="sign-space"></div>
              <div class="sign-label">Authorised Signatory</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice - ${invoiceNumber}</title>
  <style>
    /* Reset and Clean Print Standard CSS */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: #f3f4f6;
      color: #000000;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      font-size: 12px;
      line-height: 1.4;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    /* Screen Toolbar */
    .print-toolbar {
      position: sticky;
      top: 0;
      left: 0;
      right: 0;
      background: #1e293b;
      color: #ffffff;
      padding: 10px 20px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.15);
      z-index: 1000;
    }
    .toolbar-content {
      max-width: 1000px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 10px;
    }
    .toolbar-title { font-size: 14px; }
    .toolbar-actions { display: flex; align-items: center; gap: 8px; }
    .btn {
      display: inline-flex;
      align-items: center;
      padding: 6px 12px;
      font-size: 12px;
      font-weight: 600;
      border-radius: 6px;
      text-decoration: none;
      cursor: pointer;
      border: 1px solid transparent;
      transition: all 0.15s ease;
    }
    .btn-primary { background: #10b981; color: #ffffff; }
    .btn-primary:hover { background: #059669; }
    .btn-secondary { background: #334155; color: #e2e8f0; border-color: #475569; }
    .btn-secondary:hover { background: #475569; color: #ffffff; }
    .btn-active { background: #3b82f6; color: #ffffff; }
    .btn-danger { background: #ef4444; color: #ffffff; }
    .btn-danger:hover { background: #dc2626; }

    /* Utility Helpers */
    .text-center { text-align: center; }
    .text-left { text-align: left; }
    .text-right { text-align: right; }
    .font-bold { font-weight: bold; }
    .text-small { font-size: 11px; }
    .text-xs { font-size: 10px; }
    .text-muted { color: #555555; }
    .text-green { color: #059669; }
    .whitespace-nowrap { white-space: nowrap; }
    .flex-between { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 2px; }
    .border-b-dashed { border-bottom: 1px dashed #000000; }
    .border-b-solid { border-bottom: 1px solid #000000; }
    .border-t-solid { border-top: 1px solid #000000; }
    .py-2 { padding-top: 6px; padding-bottom: 6px; }
    .pb-2 { padding-bottom: 6px; }
    .pt-2 { padding-top: 6px; }
    .mt-1 { margin-top: 4px; }

    /* --- 80mm Thermal Receipt Styles --- */
    .receipt-wrapper {
      display: flex;
      justify-content: center;
      padding: 24px 10px;
    }
    .thermal-receipt {
      width: 78mm;
      max-width: 78mm;
      background: #ffffff;
      padding: 12px;
      font-family: "Courier New", Courier, monospace;
      font-size: 11px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.1);
      border-radius: 4px;
    }
    .store-name { font-size: 15px; font-weight: bold; text-transform: uppercase; font-family: sans-serif; letter-spacing: 0.5px; }
    .store-info { font-size: 10px; color: #333333; margin-top: 2px; }
    .invoice-title { font-size: 10px; font-weight: bold; margin-top: 4px; }
    .items-table { width: 100%; border-collapse: collapse; font-size: 10.5px; }
    .items-table th { padding: 4px 0; font-size: 10px; }
    .items-table td { padding: 3px 0; vertical-align: top; }
    .w-item { width: 50%; }
    .w-qty { width: 28%; }
    .w-tot { width: 22%; }
    .grand-total-row { font-size: 13px; font-weight: 900; }
    .grand-total-amount { font-size: 14px; }
    .footer-note { font-size: 10px; color: #444444; }
    .powered-by { font-size: 9px; color: #888888; margin-top: 3px; }

    /* --- A4 Marg / Tax Invoice Styles --- */
    .a4-wrapper {
      display: flex;
      justify-content: center;
      padding: 24px 10px;
    }
    .a4-invoice {
      width: 210mm;
      min-height: 297mm;
      background: #ffffff;
      padding: 12mm 15mm;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
      font-size: 11px;
      border: 1px solid #d1d5db;
    }
    .a4-header-box {
      display: flex;
      justify-content: space-between;
      border: 1px solid #000000;
      padding: 12px 16px;
      margin-bottom: -1px;
    }
    .a4-store-title { font-size: 20px; font-weight: 900; text-transform: uppercase; margin-bottom: 3px; }
    .a4-store-sub { font-size: 11px; color: #333333; }
    .a4-invoice-badge { text-align: right; }
    .badge-title { font-size: 16px; font-weight: bold; border-bottom: 2px solid #000; padding-bottom: 2px; }
    .badge-sub { font-size: 10px; font-style: italic; color: #555; margin-top: 3px; }
    .a4-meta-grid {
      display: flex;
      border: 1px solid #000000;
      margin-bottom: -1px;
    }
    .a4-meta-col { flex: 1; padding: 10px 14px; }
    .border-right { border-right: 1px solid #000000; }
    .meta-col-header { font-weight: bold; font-size: 10px; text-decoration: underline; margin-bottom: 6px; color: #222; }
    .meta-field { margin-bottom: 3px; font-size: 11px; }
    .a4-table {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid #000000;
      margin-bottom: -1px;
    }
    .a4-table th {
      background: #f1f5f9;
      border: 1px solid #000000;
      padding: 6px 8px;
      font-size: 10px;
      font-weight: bold;
      text-transform: uppercase;
    }
    .a4-table td {
      border: 1px solid #000000;
      padding: 6px 8px;
      vertical-align: middle;
      font-size: 11px;
    }
    .empty-row td { height: 24px; }
    .a4-summary-grid {
      display: flex;
      border: 1px solid #000000;
    }
    .a4-summary-left {
      flex: 1.2;
      border-right: 1px solid #000000;
      padding: 10px 14px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .a4-summary-right { flex: 0.8; padding: 10px 14px; }
    .amount-words-box { margin-bottom: 12px; }
    .amount-words-box .label { font-size: 10px; font-weight: bold; text-transform: uppercase; color: #555; }
    .words-text { font-size: 11px; font-weight: bold; margin-top: 2px; }
    .terms-box { font-size: 9.5px; color: #444; }
    .terms-title { font-weight: bold; text-decoration: underline; margin-bottom: 3px; }
    .terms-list { padding-left: 14px; }
    .terms-list li { margin-bottom: 2px; }
    .sum-row { display: flex; justify-content: space-between; padding: 3px 0; font-size: 11px; }
    .grand-total-box {
      border-top: 2px solid #000000;
      border-bottom: 2px solid #000000;
      font-size: 13px;
      font-weight: bold;
      margin-top: 6px;
      padding: 6px 0;
    }
    .grand-total-val { font-size: 15px; font-weight: 900; }
    .sign-box { margin-top: 24px; text-align: right; }
    .sign-store { font-size: 10px; font-weight: bold; }
    .sign-space { height: 35px; }
    .sign-label { font-size: 10px; border-top: 1px dashed #000; display: inline-block; padding-top: 2px; }

    /* Print Media Rules */
    @media print {
      body {
        background: #ffffff !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      .no-print { display: none !important; }
      .receipt-wrapper, .a4-wrapper {
        padding: 0 !important;
        margin: 0 !important;
        display: block !important;
      }
      .thermal-receipt {
        width: 100% !important;
        max-width: 78mm !important;
        box-shadow: none !important;
        border-radius: 0 !important;
        padding: 2mm !important;
        margin: 0 auto !important;
      }
      .a4-invoice {
        width: 100% !important;
        max-width: none !important;
        box-shadow: none !important;
        border: none !important;
        padding: 5mm !important;
        margin: 0 !important;
      }
      @page {
        margin: 3mm auto;
        size: ${isA4 ? 'A4 portrait' : 'auto'};
      }
    }
  </style>
</head>
<body>
  ${toolbarHtml}
  ${isA4 ? a4BodyHtml : thermalBodyHtml}

  ${autoprint ? `
  <script>
    window.addEventListener('load', function() {
      setTimeout(function() {
        window.print();
      }, 300);
    });
  </script>
  ` : ''}
</body>
</html>`;
}

'use client';

import React, { useState } from 'react';
import { InvoiceLayoutA4 } from './InvoiceLayoutA4';
import { InvoiceLayout80mm } from './InvoiceLayout80mm';
import { InvoiceLayout58mm } from './InvoiceLayout58mm';

/**
 * InvoiceViewer Component
 * Offers layout preview switching (A4, 80mm, 58mm), browser printing with print styles,
 * PDF download, and WhatsApp sharing.
 */
export function InvoiceViewer({
  sale,
  store,
  delivery,
  pdfDownloadUrl,
}) {
  const defaultLayout = store?.receiptWidth || 'A4';
  const [layout, setLayout] = useState(defaultLayout);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    const targetUrl = pdfDownloadUrl
      ? `${pdfDownloadUrl}?layout=${layout}`
      : `/api/tenant/pos/bills/${sale._id}/pdf?layout=${layout}`;
    window.open(targetUrl, '_blank');
  };

  const handleWhatsApp = () => {
    if (!delivery?.whatsappUrl) {
      alert('WhatsApp sharing link is not available.');
      return;
    }
    window.open(delivery.whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-full space-y-6">
      {/* Controls Bar - Hidden during printing */}
      <div className="print:hidden bg-card border rounded-xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Layout Switcher */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Format:
          </span>
          <div className="inline-flex rounded-lg border bg-muted/40 p-1">
            <button
              type="button"
              onClick={() => setLayout('A4')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                layout === 'A4'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              A4 Standard
            </button>
            <button
              type="button"
              onClick={() => setLayout('80mm')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                layout === '80mm'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              80mm Thermal
            </button>
            <button
              type="button"
              onClick={() => setLayout('58mm')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                layout === '58mm'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              58mm Mini
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          {delivery?.whatsappUrl && (
            <button
              type="button"
              onClick={handleWhatsApp}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-sm"
              title="Share invoice via WhatsApp"
            >
              <svg
                className="w-4 h-4"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.599 2.679-.702c.971.558 1.99.853 3.011.853h.001c3.182 0 5.768-2.586 5.768-5.766 0-3.18-2.586-5.767-5.768-5.767zm7.989 5.766c0 4.406-3.585 7.99-7.99 7.99-.001 0-.001 0 0 0-1.396 0-2.735-.371-3.905-1.033l-4.325 1.134 1.157-4.223c-.742-1.229-1.162-2.653-1.162-4.135 0-4.405 3.585-7.99 7.99-7.99s7.99 3.585 7.99 7.99z" />
              </svg>
              WhatsApp
            </button>
          )}

          <button
            type="button"
            onClick={handleDownloadPdf}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-lg border border-input bg-background hover:bg-muted text-foreground transition-colors shadow-sm"
            title="Download PDF"
          >
            <svg
              className="w-4 h-4 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Download PDF
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-1.5 text-xs font-medium rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground transition-colors shadow-sm"
            title="Print invoice"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4H7v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
              />
            </svg>
            Print
          </button>
        </div>
      </div>

      {/* Invoice Container for on-screen preview and window.print() */}
      <div className="flex justify-center p-2 sm:p-4 bg-muted/20 rounded-xl border print:border-none print:p-0 print:bg-transparent">
        <div className="invoice-print-area transition-all duration-200">
          {layout === 'A4' && <InvoiceLayoutA4 sale={sale} store={store} />}
          {layout === '80mm' && <InvoiceLayout80mm sale={sale} store={store} />}
          {layout === '58mm' && <InvoiceLayout58mm sale={sale} store={store} />}
        </div>
      </div>

      {/* Print-specific style block */}
      <style jsx global>{`
        @media print {
          body {
            background-color: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          /* Hide header, navigation, sidebar, and non-printable elements */
          header,
          nav,
          aside,
          footer,
          .print\\:hidden {
            display: none !important;
          }

          .invoice-print-area {
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }

          @page {
            margin: 8mm;
            size: ${layout === 'A4' ? 'A4 portrait' : 'auto'};
          }
        }
      `}</style>
    </div>
  );
}

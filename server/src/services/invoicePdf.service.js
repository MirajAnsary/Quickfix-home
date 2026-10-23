import PDFDocument from 'pdfkit';

const NAVY = '#0B1F3A';
const TEAL = '#0D9488';
// Built-in PDF fonts have no ₹ glyph, so amounts use "Rs.".
const money = (n) => `Rs. ${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const date = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-');

/** Streams an invoice PDF to the response. */
export function streamInvoicePdf(res, invoice) {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${invoice.invoiceNo}.pdf"`);
  res.setHeader('Cache-Control', 'private, no-store');
  doc.pipe(res);

  // Header band
  doc.rect(0, 0, doc.page.width, 90).fill(NAVY);
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(22).text('QuickFix ', 50, 30, { continued: true }).fillColor('#2DD4BF').text('Home');
  doc.fillColor('#9FB3C8').font('Helvetica').fontSize(9).text('Repair • Restore • Relax', 50, 58);
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(16).text('INVOICE', 0, 34, { align: 'right', width: doc.page.width - 50 });

  // Meta
  const b = invoice.booking || {};
  const c = invoice.customer || {};
  const a = b.address || {};
  doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(10).text('Bill To', 50, 120);
  doc.font('Helvetica').fillColor('#334155')
    .text(c.fullName || '')
    .text(c.phone ? `+91 ${c.phone}` : '')
    .text(c.email || '')
    .text([a.line1, a.line2, a.city, a.pincode].filter(Boolean).join(', '), { width: 260 });

  const right = 340;
  const row = (label, value, y) => {
    doc.font('Helvetica-Bold').fillColor(NAVY).text(label, right, y);
    doc.font('Helvetica').fillColor('#334155').text(value, right + 90, y);
  };
  row('Invoice No', invoice.invoiceNo, 120);
  row('Date', date(invoice.createdAt), 136);
  row('Booking', b.bookingNo || '-', 152);
  row('Service', b.service?.name || '-', 168);
  row('Status', invoice.status === 'paid' ? `PAID ${date(invoice.paidAt)}` : 'UNPAID', 184);

  // Items table
  let y = 240;
  doc.rect(50, y, doc.page.width - 100, 24).fill('#E7F6F4');
  doc.fillColor(NAVY).font('Helvetica-Bold').text('Description', 60, y + 7).text('Amount', 0, y + 7, { align: 'right', width: doc.page.width - 60 });
  y += 30;
  doc.font('Helvetica').fillColor('#334155');
  for (const item of invoice.items || []) {
    doc.text(item.description, 60, y, { width: 330 });
    doc.text(money(item.amount), 0, y, { align: 'right', width: doc.page.width - 60 });
    y += 22;
    doc.moveTo(50, y - 6).lineTo(doc.page.width - 50, y - 6).strokeColor('#E3E8EF').stroke();
  }

  // Totals
  y += 8;
  const total = (label, value, bold) => {
    doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fillColor(bold ? NAVY : '#334155');
    doc.text(label, 330, y).text(value, 0, y, { align: 'right', width: doc.page.width - 60 });
    y += 18;
  };
  total('Subtotal', money(invoice.subtotal));
  if (invoice.taxRate) total(`GST (${invoice.taxRate}%)`, money(invoice.taxAmount));
  total('Total', money(invoice.total), true);

  doc.fillColor(TEAL).font('Helvetica-Bold').fontSize(10).text('Thank you for choosing QuickFix Home!', 50, 720, { align: 'center', width: doc.page.width - 100 });
  doc.fillColor('#94a3b8').font('Helvetica').fontSize(8).text('This is a computer-generated invoice.', { align: 'center', width: doc.page.width - 100 });
  doc.end();
}

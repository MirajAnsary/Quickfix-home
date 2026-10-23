import { invoiceApi, paymentApi } from '../api/endpoints';
import { getBlobErrorMessage } from '../api/client';

export async function downloadInvoicePdf(invoice) {
  try {
    const res = await invoiceApi.pdf(invoice._id);
    const url = URL.createObjectURL(res.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${invoice.invoiceNo}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (err) {
    throw new Error(await getBlobErrorMessage(err));
  }
}

function loadRazorpayScript() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve();
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Could not load the payment window. Check your internet connection.'));
    document.body.appendChild(s);
    return undefined;
  });
}

/**
 * Online payment: the server creates the Razorpay order (amount comes from the invoice in
 * the database, never from the browser) and later verifies the signature with the secret key.
 */
export async function payInvoiceOnline(invoiceId) {
  const { data } = await paymentApi.createOrder(invoiceId);
  await loadRazorpayScript();
  return new Promise((resolve, reject) => {
    const rz = new window.Razorpay({
      key: data.keyId,
      amount: data.amount,
      currency: data.currency,
      order_id: data.orderId,
      name: 'QuickFix Home',
      description: `Invoice ${data.invoiceNo}`,
      prefill: data.prefill,
      theme: { color: '#0D9488' },
      handler: async (response) => {
        try {
          // Send only the three signed fields: the server schema is strict and rejects extras.
          const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = response;
          await paymentApi.verify({ razorpay_order_id, razorpay_payment_id, razorpay_signature });
          resolve();
        } catch (e) {
          reject(e);
        }
      },
      modal: { ondismiss: () => reject(new Error('Payment window closed. You have not been charged.')) },
    });
    rz.on('payment.failed', (r) => reject(new Error(r?.error?.description || 'Payment failed. Please try again.')));
    rz.open();
  });
}

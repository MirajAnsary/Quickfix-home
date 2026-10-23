import { useState } from 'react';
import { invoiceApi } from '../../api/endpoints';
import { getErrorMessage } from '../../api/client';
import { useApi } from '../../hooks/useApi';
import { EmptyState, ErrorBox, Notice, Pagination, Spinner, StatusBadge } from '../../components/ui';
import { formatDate, formatINR } from '../../utils/format';
import { downloadInvoicePdf, payInvoiceOnline } from '../../utils/invoiceActions';

export default function MyInvoices() {
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useApi(() => invoiceApi.mine({ page, limit: 10 }), [page]);
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState({ type: '', text: '' });

  const download = async (inv) => {
    setBusy(`pdf-${inv._id}`);
    try {
      await downloadInvoicePdf(inv);
    } catch (e) {
      setMsg({ type: 'danger', text: e.message });
    } finally {
      setBusy('');
    }
  };

  const pay = async (inv) => {
    setBusy(`pay-${inv._id}`);
    setMsg({ type: '', text: '' });
    try {
      await payInvoiceOnline(inv._id);
      setMsg({ type: 'success', text: `Payment for ${inv.invoiceNo} received. Thank you!` });
      reload();
    } catch (e) {
      setMsg({ type: 'danger', text: getErrorMessage(e) });
    } finally {
      setBusy('');
    }
  };

  const list = data?.invoices || [];

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Invoices</h1>
          <p>Download invoices and pay pending bills</p>
        </div>
      </div>
      <Notice type={msg.type} message={msg.text} onClose={() => setMsg({ type: '', text: '' })} />
      <ErrorBox message={error} onRetry={reload} />
      <div className="qf-card">
        {loading ? (
          <Spinner />
        ) : list.length === 0 ? (
          <EmptyState icon="bi-receipt" text="Invoices appear here after a job is completed." />
        ) : (
          <div className="table-responsive">
            <table className="table table-qf table-hover">
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Service</th>
                  <th>Date</th>
                  <th className="text-end">Amount</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.map((inv) => (
                  <tr key={inv._id}>
                    <td className="fw-600">{inv.invoiceNo}</td>
                    <td>{inv.booking?.service?.name}<div className="small-xs text-muted-qf">#{inv.booking?.bookingNo}</div></td>
                    <td>{formatDate(inv.createdAt)}</td>
                    <td className="text-end fw-600">{formatINR(inv.total)}</td>
                    <td><StatusBadge status={inv.status} /></td>
                    <td className="text-end text-nowrap">
                      <button type="button" className="btn btn-outline-teal btn-sm me-2" disabled={Boolean(busy)} onClick={() => download(inv)}>
                        <i className="bi bi-download me-1" />{busy === `pdf-${inv._id}` ? '…' : 'PDF'}
                      </button>
                      {inv.status === 'unpaid' && (
                        <button type="button" className="btn btn-teal btn-sm" disabled={Boolean(busy)} onClick={() => pay(inv)}>
                          {busy === `pay-${inv._id}` ? 'Opening…' : 'Pay Online'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <Pagination page={data?.page || 1} pages={data?.pages} onChange={setPage} />
      <p className="small-xs text-muted-qf mt-3">You can also pay unpaid invoices in cash to the technician. They record it and the invoice updates automatically.</p>
    </>
  );
}

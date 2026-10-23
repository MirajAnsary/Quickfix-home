import { useState } from 'react';
import { paymentApi } from '../../api/endpoints';
import { useApi } from '../../hooks/useApi';
import { EmptyState, ErrorBox, Pagination, Spinner, StatusBadge } from '../../components/ui';
import { formatDateTime, formatINR } from '../../utils/format';

const FILTERS = [
  ['', 'All'],
  ['razorpay', 'Online'],
  ['cash', 'Cash'],
];

export default function PaymentHistory() {
  const [method, setMethod] = useState('');
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useApi(() => paymentApi.mine({ method: method || undefined, page, limit: 10 }), [method, page]);
  const list = data?.payments || [];

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Payment History</h1>
          <p>All online and cash payments</p>
        </div>
      </div>
      <div className="filter-pills mb-3">
        {FILTERS.map(([v, l]) => (
          <button key={v} type="button" className={method === v ? 'active' : ''} onClick={() => { setMethod(v); setPage(1); }}>{l}</button>
        ))}
      </div>
      <ErrorBox message={error} onRetry={reload} />
      <div className="qf-card">
        {loading ? (
          <Spinner />
        ) : list.length === 0 ? (
          <EmptyState icon="bi-credit-card" text="No payments found." />
        ) : (
          <div className="table-responsive">
            <table className="table table-qf">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Invoice</th>
                  <th>Method</th>
                  <th>Reference</th>
                  <th className="text-end">Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {list.map((p) => (
                  <tr key={p._id}>
                    <td>{formatDateTime(p.paidAt || p.createdAt)}</td>
                    <td className="fw-600">{p.invoice?.invoiceNo}</td>
                    <td><i className={`bi ${p.method === 'cash' ? 'bi-cash' : 'bi-credit-card'} text-teal me-1`} />{p.method === 'cash' ? 'Cash' : 'Razorpay'}</td>
                    <td className="small text-muted-qf">{p.razorpayPaymentId || (p.method === 'cash' ? 'Collected by technician' : '—')}</td>
                    <td className="text-end fw-600">{formatINR(p.amount)}</td>
                    <td><StatusBadge status={p.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <Pagination page={data?.page || 1} pages={data?.pages} onChange={setPage} />
    </>
  );
}

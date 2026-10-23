import { useState } from 'react';
import { adminApi } from '../../api/endpoints';
import { getErrorMessage } from '../../api/client';
import { useApi } from '../../hooks/useApi';
import ApplianceIcon from '../../components/ApplianceIcon';
import { ErrorBox, Notice, Spinner } from '../../components/ui';

export default function AdminServices() {
  const { data, loading, error, reload } = useApi(() => adminApi.services(), []);
  const [prices, setPrices] = useState({});
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState({ type: '', text: '' });

  const save = async (s, body) => {
    setBusy(s._id);
    try {
      await adminApi.updateService(s._id, body);
      setMsg({ type: 'success', text: `${s.name} updated.` });
      reload();
    } catch (e) {
      setMsg({ type: 'danger', text: getErrorMessage(e) });
    } finally {
      setBusy('');
    }
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Services &amp; Prices</h1>
          <p>Starting prices shown on the home page and used for new bookings</p>
        </div>
      </div>
      <Notice type={msg.type} message={msg.text} onClose={() => setMsg({ type: '', text: '' })} />
      <ErrorBox message={error} onRetry={reload} />
      {loading ? (
        <Spinner />
      ) : (
        <div className="row g-3">
          {(data?.services || []).map((s) => {
            const price = prices[s._id] ?? s.startingPrice;
            return (
              <div className="col-md-6 col-xl-4" key={s._id}>
                <div className="qf-card qf-card-body d-flex gap-3 align-items-center">
                  <span className="thumb" style={{ width: 60, height: 60 }}><ApplianceIcon slug={s.slug} size={44} /></span>
                  <div className="flex-grow-1">
                    <strong className="text-navy d-block">{s.name}</strong>
                    <div className="input-group input-group-sm mt-1">
                      <span className="input-group-text">₹</span>
                      <input type="number" min="0" max="100000" className="form-control" aria-label={`${s.name} starting price`} value={price} onChange={(e) => setPrices({ ...prices, [s._id]: e.target.value })} />
                      <button type="button" className="btn btn-teal" disabled={busy === s._id || Number(price) === s.startingPrice} onClick={() => save(s, { startingPrice: Number(price) })}>Save</button>
                    </div>
                    <div className="form-check form-switch mt-2 small">
                      <input id={`act-${s._id}`} className="form-check-input" type="checkbox" checked={s.isActive} disabled={busy === s._id} onChange={() => save(s, { isActive: !s.isActive })} />
                      <label htmlFor={`act-${s._id}`} className="form-check-label">{s.isActive ? 'Shown on website' : 'Hidden'}</label>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

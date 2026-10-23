import { useState } from 'react';
import { adminApi } from '../../api/endpoints';
import { getErrorMessage } from '../../api/client';
import { EmptyState, ErrorBox, Notice, Pagination, Spinner, StatusBadge } from '../../components/ui';
import { formatDate } from '../../utils/format';

/** Shared list for customers and technicians, with enable/disable. */
export default function UserTable({ state, page, onPage, showSkills = false }) {
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [busy, setBusy] = useState('');
  const { data, loading, error, reload } = state;

  const toggle = async (u) => {
    setBusy(u._id);
    try {
      await adminApi.setUserStatus(u._id, !u.isActive);
      setMsg({ type: 'success', text: `${u.fullName} ${u.isActive ? 'disabled' : 'enabled'}.` });
      reload();
    } catch (e) {
      setMsg({ type: 'danger', text: getErrorMessage(e) });
    } finally {
      setBusy('');
    }
  };

  return (
    <>
      <Notice type={msg.type} message={msg.text} onClose={() => setMsg({ type: '', text: '' })} />
      <ErrorBox message={error} onRetry={reload} />
      {loading ? (
        <Spinner />
      ) : (data?.users || []).length === 0 ? (
        <EmptyState icon="bi-people" text="No users yet." />
      ) : (
        <div className="table-responsive">
          <table className="table table-qf">
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Email</th>
                {showSkills && <th>Skills</th>}
                <th>Joined</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data.users.map((u) => (
                <tr key={u._id}>
                  <td className="fw-600">{u.fullName}{!u.isVerified && <span className="badge bg-warning-subtle text-warning-emphasis ms-1">Unverified</span>}</td>
                  <td>+91 {u.phone}</td>
                  <td className="text-break">{u.email}</td>
                  {showSkills && <td className="small">{(u.skills || []).join(', ') || '—'}</td>}
                  <td>{formatDate(u.createdAt)}</td>
                  <td><StatusBadge status={u.isActive ? 'active' : 'inactive'} /></td>
                  <td className="text-end">
                    <button type="button" className={`btn btn-sm ${u.isActive ? 'btn-outline-danger' : 'btn-outline-teal'}`} disabled={busy === u._id} onClick={() => toggle(u)}>
                      {u.isActive ? 'Disable' : 'Enable'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={page} pages={data?.pages} onChange={onPage} />
    </>
  );
}

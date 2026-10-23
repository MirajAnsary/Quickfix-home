import { useState } from 'react';
import { adminApi } from '../../api/endpoints';
import { useApi } from '../../hooks/useApi';
import UserTable from './UserTable';

export default function AdminCustomers() {
  const [page, setPage] = useState(1);
  const state = useApi(() => adminApi.users({ role: 'customer', page, limit: 15 }), [page]);
  return (
    <>
      <div className="page-head">
        <div>
          <h1>Customers</h1>
          <p>{state.data?.total ?? '…'} registered customers</p>
        </div>
      </div>
      <section className="qf-card qf-card-body">
        <UserTable state={state} page={page} onPage={setPage} />
      </section>
    </>
  );
}

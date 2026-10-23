import { useCallback, useEffect, useRef, useState } from 'react';
import { getErrorMessage } from '../api/client';

/** Runs an API call on mount (and when deps change). Returns { data, loading, error, reload }. */
export function useApi(request, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: '' });
  const requestRef = useRef(request);
  requestRef.current = request;

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: '' }));
    try {
      const res = await requestRef.current();
      setState({ data: res.data, loading: false, error: '' });
    } catch (e) {
      setState({ data: null, loading: false, error: getErrorMessage(e) });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, reload: load };
}

import { useState, useEffect, useCallback } from 'react';

/**
 * useApi — generic data fetching hook
 *
 * Usage:
 *   const { data, loading, error, refetch } = useApi(getProducts, ['bottles', '1l']);
 *
 * @param {Function} apiFn   - API function from src/api/index.js
 * @param {Array}    args    - Arguments to pass to apiFn
 * @param {Object}   options - { immediate: bool (default true), transform: fn }
 */
export function useApi(apiFn, args = [], options = {}) {
  const { immediate = true, transform } = options;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);

  const execute = useCallback(async (...overrideArgs) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFn(...(overrideArgs.length ? overrideArgs : args));
      const raw = res?.data ?? res;
      setData(transform ? transform(raw) : raw);
      return raw;
    } catch (err) {
      setError(err?.message || 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiFn, JSON.stringify(args)]);

  useEffect(() => {
    if (immediate) execute();
  }, []);

  return { data, loading, error, refetch: execute };
}

/**
 * useMutation — for POST/PUT/DELETE actions
 *
 * Usage:
 *   const { mutate, loading, error } = useMutation(addToCart);
 *   await mutate(productId, qty, boxes);
 */
export function useMutation(apiFn, options = {}) {
  const { onSuccess, onError } = options;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const mutate = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFn(...args);
      const data = res?.data ?? res;
      onSuccess?.(data);
      return data;
    } catch (err) {
      const msg = err?.message || 'An error occurred';
      setError(msg);
      onError?.(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiFn]);

  return { mutate, loading, error };
}

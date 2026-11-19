import { useCallback, useEffect, useState } from 'react'
import { api } from '../api.js'

// GET helper for admin pages: { data, error, loading, reload }
export function useApi(path) {
  const [state, setState] = useState({ data: null, error: '', loading: true })
  const reload = useCallback(() => {
    setState((s) => ({ ...s, loading: true }))
    return api(path)
      .then((data) => setState({ data, error: '', loading: false }))
      .catch((e) => setState({ data: null, error: e.message, loading: false }))
  }, [path])
  useEffect(() => { reload() }, [reload])
  return { ...state, reload }
}

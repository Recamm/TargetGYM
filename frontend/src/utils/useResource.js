import { useCallback, useEffect, useRef, useState } from 'react';
import { useNotifications } from '../components/NotificationContext.js';

export default function useResource(loader, pollMs = 0) {
    const [data, setData] = useState({ loader: null, value: null });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [version, setVersion] = useState(0);
    const { error: notifyError } = useNotifications();
    const lastError = useRef('');
    useEffect(() => {
        let live = true, controller;
        async function load(initial = false) {
            controller?.abort(); controller = new AbortController();
            const signal = controller.signal;
            if (initial) { setLoading(true); setError(null); }
            try {
                const result = await loader(signal);
                if (live && !signal.aborted) { setData({ loader, value: result }); setError(null); lastError.current = ''; }
            } catch (failure) {
                if (live && !signal.aborted && failure.name !== 'AbortError') {
                    setError(failure);
                    setData(previous => previous.loader === loader ? previous : { loader, value: null });
                    if (lastError.current !== failure.message) notifyError(failure);
                    lastError.current = failure.message;
                }
            } finally { if (live && !signal.aborted) setLoading(false); }
        }
        load(true);
        const interval = pollMs ? setInterval(() => load(), pollMs) : null;
        return () => { live = false; controller?.abort(); if (interval) clearInterval(interval); };
    }, [loader, pollMs, version, notifyError]);
    const reload = useCallback(() => setVersion(value => value + 1), []);
    return { data: data.loader === loader ? data.value : null, loading: loading || data.loader !== loader, error: data.loader === loader ? error : null, reload };
}

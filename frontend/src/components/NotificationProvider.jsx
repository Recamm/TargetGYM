import { useCallback, useEffect, useRef, useState } from 'react';
import { NotificationContext } from './NotificationContext.js';

function Notice({ notice, dismiss }) {
    const element = useRef(null), previousFocus = useRef(null);
    const { id, type, message } = notice;
    const close = useCallback(() => {
        if (element.current?.contains(document.activeElement)) {
            const target = previousFocus.current?.isConnected ? previousFocus.current : document.getElementById('contenido');
            target?.focus({ preventScroll: true });
        }
        dismiss(id);
    }, [id, dismiss]);
    useEffect(() => {
        const timer = setTimeout(close, type === 'error' ? 8000 : 4000);
        return () => clearTimeout(timer);
    }, [type, close]);
    return <div ref={element} className={`notice ${type}`} role={type === 'error' ? 'alert' : 'status'}
        onFocusCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) previousFocus.current = event.relatedTarget; }}>
        <span>{type === 'error' ? 'Atención: ' : 'Listo: '}{message}</span>
        <button type="button" className="notice-close" aria-label="Cerrar notificación" onClick={close}>×</button>
    </div>;
}

export default function NotificationProvider({ children }) {
    const [notices, setNotices] = useState([]);
    const dismiss = useCallback(id => setNotices(previous => previous.filter(item => item.id !== id)), []);
    const notify = useCallback((message, type = 'success') => setNotices(previous => [...previous, { id: crypto.randomUUID(), message, type }]), []);
    const error = useCallback(failure => notify(failure.message, 'error'), [notify]);
    return <NotificationContext.Provider value={{ notify, error }}>
        {notices.length > 0 && <aside className="notification-stack" aria-label="Notificaciones">
            {notices.map(notice => <Notice key={notice.id} notice={notice} dismiss={dismiss} />)}
        </aside>}
        {children}
    </NotificationContext.Provider>;
}

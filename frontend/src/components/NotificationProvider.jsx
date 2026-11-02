import { useCallback, useEffect, useState } from 'react';
import { NotificationContext } from './NotificationContext.js';

function Notice({ notice, dismiss }) {
    const [hovered, setHovered] = useState(false), [focused, setFocused] = useState(false);
    const { id, type, message } = notice;
    useEffect(() => {
        if (hovered || focused) return;
        const timer = setTimeout(() => dismiss(id), type === 'error' ? 10000 : 6000);
        return () => clearTimeout(timer);
    }, [id, type, hovered, focused, dismiss]);
    return <div className={`notice ${type}`} role={type === 'error' ? 'alert' : 'status'}
        onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
        onFocusCapture={() => setFocused(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}>
        <span>{type === 'error' ? 'Atención: ' : 'Listo: '}{message}</span>
        <button type="button" className="notice-close" aria-label="Cerrar notificación" onClick={() => dismiss(id)}>×</button>
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

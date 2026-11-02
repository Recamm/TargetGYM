import { useCallback, useState } from 'react';
import { NotificationContext } from './NotificationContext.js';

export default function NotificationProvider({ children }) {
    const [notices, setNotices] = useState([]);
    const notify = useCallback((message, type = 'success') => setNotices(previous => [...previous, { id: crypto.randomUUID(), message, type }]), []);
    const error = useCallback(failure => notify(failure.message, 'error'), [notify]);
    return <NotificationContext.Provider value={{ notify, error }}>
        {notices.length > 0 && <aside className="notification-stack" aria-label="Notificaciones">
            {notices.map(notice => <div key={notice.id} className={`notice ${notice.type}`} role={notice.type === 'error' ? 'alert' : 'status'}>
                <span>{notice.type === 'error' ? 'Atención: ' : 'Listo: '}{notice.message}</span>
                <button type="button" className="notice-close" aria-label="Cerrar notificación" onClick={() => setNotices(previous => previous.filter(item => item.id !== notice.id))}>×</button>
            </div>)}
        </aside>}
        {children}
    </NotificationContext.Provider>;
}

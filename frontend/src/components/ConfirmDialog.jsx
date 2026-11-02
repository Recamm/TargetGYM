import { useEffect, useRef, useState } from 'react';
import { useNotifications } from './NotificationContext.js';
import Button from './Button.jsx';

export default function ConfirmDialog({ title, children, onConfirm, onClose, confirmLabel = 'Confirmar', getReturnFocus }) {
    const dialog = useRef(null), cancel = useRef(null);
    const [busy, setBusy] = useState(false), [error, setError] = useState(null);
    const notices = useNotifications();
    useEffect(() => {
        const previous = document.activeElement;
        const element = dialog.current;
        element.showModal(); cancel.current.focus();
        return () => {
            element.close();
            const target = getReturnFocus?.();
            if (target?.isConnected) target.focus();
            else if (previous?.isConnected) previous.focus();
            else document.querySelector('main h1')?.focus();
        };
    }, [getReturnFocus]);
    async function confirm() {
        setBusy(true); setError(null);
        try { await onConfirm(); }
        catch (failure) { setError(failure); notices.error(failure); }
        finally { setBusy(false); }
    }
    return <dialog className="confirm-dialog" ref={dialog} aria-labelledby="confirm-title" aria-describedby="confirm-description" onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}>
        <h2 id="confirm-title">{title}</h2><div id="confirm-description">{children}</div>
        {error && <p className="field-error" role="alert">{error.message}</p>}
        <div className="actions"><button ref={cancel} type="button" className="button secondary" disabled={busy} onClick={onClose}>Volver</button><Button busy={busy} onClick={confirm}>{confirmLabel}</Button></div>
    </dialog>;
}

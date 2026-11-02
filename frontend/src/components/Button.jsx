export default function Button({ children, busy = false, disabled = false, variant = 'primary', type = 'button', ...props }) {
    return <button {...props} type={type} disabled={disabled || busy} aria-busy={busy || undefined} className={`button ${variant}`}>{busy ? 'Procesando…' : children}</button>;
}

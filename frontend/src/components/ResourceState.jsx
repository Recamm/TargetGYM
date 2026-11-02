import Button from './Button.jsx';
export function LoadingState() { return <div className="state-panel" role="status" aria-busy="true">Cargando información…</div>; }
export function EmptyState({ children }) { return <div className="state-panel"><p>{children}</p></div>; }
export function ErrorState({ error, retry }) { return <div className="state-panel error-panel"><h2>No pudimos cargar la información</h2><p>{error.message}</p>{retry && <Button variant="secondary" onClick={retry}>Reintentar</Button>}</div>; }
export default function ResourceState({ resource, children }) {
    if (resource.loading && resource.data === null) return <LoadingState />;
    return <>{resource.error && <ErrorState error={resource.error} retry={resource.reload} />}{resource.data !== null && children}</>;
}

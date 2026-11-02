import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext.js';
import { LoadingState, ErrorState } from './ResourceState.jsx';
export default function ProtectedRoute({ roles = [] }) {
    const { usuario, loading, error, refresh } = useAuth();
    if (loading) return <LoadingState />;
    if (error) return <ErrorState error={error} retry={refresh} />;
    if (!usuario) return <Navigate to="/login" replace />;
    if (roles.length && !roles.includes(usuario.rol)) return <div className="state-panel"><h1 tabIndex={-1}>Acceso no permitido</h1><p>Tu cuenta no tiene permisos para esta pantalla.</p></div>;
    return <Outlet />;
}

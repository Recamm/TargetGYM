import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext, inicioPorRol } from './AuthContext.js';
import { useNotifications } from './NotificationContext.js';
import { consultarSesion, iniciarSesion, registrarUsuario, cerrarSesion, actualizarPerfil, activarAcceso } from '../services/authService.js';
import { onSessionExpired } from '../services/api.js';

export default function AuthProvider({ children }) {
    const [usuario, setUsuario] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { error: notifyError, notify } = useNotifications();
    const navigate = useNavigate();
    async function refresh() {
        setLoading(true); setError(null);
        try { setUsuario((await consultarSesion()).usuario); }
        catch (failure) { setError(failure); notifyError(failure); }
        finally { setLoading(false); }
    }
    useEffect(() => {
        let active = true;
        consultarSesion().then(data => { if (active) { setUsuario(data.usuario); setLoading(false); } })
            .catch(failure => { if (active) { setError(failure); setLoading(false); notifyError(failure); } });
        onSessionExpired(() => { setUsuario(null); notify('Tu sesión venció. Volvé a ingresar.', 'error'); });
        return () => { active = false; onSessionExpired(null); };
    }, [notifyError, notify]);
    const login = async datos => { const result = await iniciarSesion(datos); setUsuario(result.usuario); setError(null); navigate(inicioPorRol(result.usuario.rol)); return result.usuario; };
    const registro = async datos => { const result = await registrarUsuario(datos); setUsuario(result.usuario); setError(null); navigate('/mi-espacio'); return result.usuario; };
    const aceptarInvitacion = async datos => { const result = await activarAcceso(datos); setUsuario(result.usuario); setError(null); navigate(inicioPorRol(result.usuario.rol)); return result.usuario; };
    const logout = async () => { await cerrarSesion(); setUsuario(null); navigate('/'); };
    const editarPerfil = async datos => { const updated = await actualizarPerfil(datos); setUsuario(updated); return updated; };
    return <AuthContext.Provider value={{ usuario, loading, error, refresh, login, registro, logout, editarPerfil, aceptarInvitacion }}>{children}</AuthContext.Provider>;
}

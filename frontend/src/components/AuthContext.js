import { createContext, useContext } from 'react';
export const AuthContext = createContext(null);
export function useAuth() {
    const value = useContext(AuthContext);
    if (!value) throw new Error('Falta AuthProvider.');
    return value;
}
export function inicioPorRol(rol) { return rol === 'Administrador' ? '/gestion/clases' : rol === 'Instructor' ? '/instructor/clases' : '/clases'; }

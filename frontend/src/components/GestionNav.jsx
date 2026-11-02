import { NavLink } from 'react-router-dom';
export default function GestionNav() {
    return <nav className="section-nav" aria-label="Gestión del gimnasio">{[
        ['/gestion','Resumen'], ['/gestion/clases','Clases'], ['/gestion/socios','Socios'], ['/gestion/pagos','Pagos'],
        ['/gestion/planes','Planes'], ['/gestion/instructores','Instructores'], ['/gestion/reportes','Reportes'],
    ].map(([to, label]) => <NavLink key={to} to={to} end={to === '/gestion'}>{label}</NavLink>)}</nav>;
}

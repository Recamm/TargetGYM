import { NavLink } from 'react-router-dom';
export default function SocioNav() {
    return <nav className="section-nav" aria-label="Espacio del socio">{[
        ['/clases','Agenda'], ['/mi-membresia','Mi membresía'], ['/mis-inscripciones','Mis inscripciones'], ['/mi-historial','Mi asistencia'],
    ].map(([to, label]) => <NavLink key={to} to={to}>{label}</NavLink>)}</nav>;
}

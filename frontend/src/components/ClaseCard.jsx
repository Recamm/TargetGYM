import { fechaTexto } from '../utils/validation.js';
export default function ClaseCard({ clase, children }) {
    return <article className="clase-card">
        <div className="clase-card-top"><span>{clase.tipo}</span><span className="badge">{clase.estado}</span></div>
        <h3>{clase.nombre}</h3>
        <p>{fechaTexto(clase.fecha)} · {clase.horaInicio} h</p>
        <dl><div><dt>Instructor</dt><dd>{clase.instructor}</dd></div><div><dt>Duración</dt><dd>{clase.duracionMinutos} min</dd></div><div><dt>Disponibilidad</dt><dd>{clase.cupoDisponible} de {clase.cupoMaximo} lugares</dd></div></dl>
        {children && <div className="actions">{children}</div>}
    </article>;
}

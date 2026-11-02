import { Link } from 'react-router-dom';
import { useAuth } from '../components/AuthContext.js';
import ResourceState, { EmptyState } from '../components/ResourceState.jsx';
import { listarPlanes } from '../services/membresiasService.js';
import useResource from '../utils/useResource.js';
import PlanPrice from '../components/PlanPrice.jsx';

const actividades = [
    ['Musculación', 'Pesas y máquinas para trabajar fuerza y construir tu rutina, con acompañamiento en el entrenamiento.'],
    ['Funcional', 'Ejercicios que combinan fuerza, coordinación y movilidad en un entrenamiento grupal.'],
    ['Cardio', 'Equipamiento para trabajar resistencia e incorporar movimiento a tu rutina.'],
    ['Clases grupales', 'Entrenamiento compartido y guiado. Consultá las clases disponibles y sus horarios en la agenda.'],
];

export default function HomePage() {
    const planes = useResource(listarPlanes, 30000);
    const { usuario } = useAuth();
    const planAction = !usuario ? ['/asociate', 'Asociate']
        : usuario.rol === 'Socio' ? ['/mi-membresia', 'Ver mi membresía']
            : usuario.rol === 'Administrador' ? ['/gestion/planes', 'Configurar planes']
                : ['/#contacto', 'Consultar en el gimnasio'];
    return <>
        <section className="hero container" aria-labelledby="hero-title">
            <div className="hero-copy">
                <p className="location-line">Tu gimnasio de barrio, en Florida.</p>
                <h1 id="hero-title" tabIndex={-1}>Qué bueno<br /> que viniste.</h1>
                <p className="hero-description">Musculación, cardio y clases grupales. Con acompañamiento, desde tu primer día.</p>
                <Link className="button primary" to="/#servicios">Ver actividades</Link>
            </div>
            <figure className="hero-photo">
                <img src="/marca/gimnasio-referencia.webp" alt="Sala de entrenamiento con mancuernas, bancos y máquinas, en un gimnasio de referencia" width="1920" height="1040" fetchPriority="high" />
            </figure>
        </section>

        <section className="container services-section" id="servicios" tabIndex={-1} aria-labelledby="services-title">
            <div className="section-intro">
                <h2 id="services-title">Encontrá tu actividad.</h2>
                <p>Consultá los días, horarios y lugares disponibles en la agenda.</p>
                <Link className="button secondary" to="/clases">Ver clases</Link>
            </div>
            <div className="activity-list">
                {actividades.map(([title, copy], index) => <details className="activity" key={title} open={index === 0}>
                    <summary>{title}<span className="disclosure-mark" aria-hidden="true" /></summary>
                    <div className="activity-content"><p>{copy}</p></div>
                </details>)}
            </div>
        </section>

        <section className="container plans-section" id="planes" tabIndex={-1} aria-labelledby="plans-title">
            <div className="section-intro">
                <h2 id="plans-title">Un plan para tu rutina.</h2>
                <p>Precios en pesos argentinos por el período completo. El pago se coordina en el gimnasio, no se realiza un cobro online.</p>
            </div>
            <ResourceState resource={planes}>
                {planes.data?.length === 0 ? <EmptyState>Todavía no hay planes disponibles. Consultá en el gimnasio.</EmptyState> : <div className="plan-grid">
                    {planes.data?.map(plan => <article className="plan-card" key={plan.tipo} aria-labelledby={`plan-${plan.tipo}`}>
                        <h3 id={`plan-${plan.tipo}`}>{plan.nombre}</h3>
                        <PlanPrice plan={plan} />
                        <p className="plan-period">Por {plan.meses === 1 ? '1 mes calendario' : `${plan.meses} meses calendario`}</p>
                        {!usuario && plan.precioCentavos !== null && <Link className="text-link" to={`/asociate?plan=${encodeURIComponent(plan.tipo)}`}>Elegir {plan.nombre}</Link>}
                    </article>)}
                </div>}
                {planes.data?.length > 0 && <Link className="button secondary" to={planAction[0]}>{planAction[1]}</Link>}
            </ResourceState>
        </section>

        <section className="about-section" id="nosotros" tabIndex={-1} aria-labelledby="about-title">
            <div className="container about-grid">
                <h2 id="about-title">Un equipo cerca.</h2>
                <div>
                    <p>Somos un gimnasio de barrio en Florida, Vicente López. Un espacio para entrenar fuerza, moverte y encontrar una rutina que encaje con tu día.</p>
                    <p>Musculación, entrenamiento funcional y actividades grupales, con el acompañamiento de nuestros instructores.</p>
                    <Link className="text-link" to={usuario ? '/clases' : '/asociate'}>{usuario ? 'Ver la agenda' : 'Quiero asociarme'}</Link>
                </div>
            </div>
        </section>
    </>;
}

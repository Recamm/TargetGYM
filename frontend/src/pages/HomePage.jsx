import { Link } from 'react-router-dom';

const actividades = [
    ['Musculación', 'Pesas y máquinas para trabajar fuerza y construir tu rutina, con acompañamiento en el entrenamiento.'],
    ['Funcional', 'Ejercicios que combinan fuerza, coordinación y movilidad en un entrenamiento grupal.'],
    ['Cardio', 'Equipamiento para trabajar resistencia e incorporar movimiento a tu rutina.'],
    ['Clases grupales', 'Entrenamiento compartido y guiado. Consultá las clases disponibles y sus horarios en la agenda.'],
];

export default function HomePage() {
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
                <figcaption>Fotografía de referencia. No corresponde a Target GYM. <a href="https://unsplash.com/photos/woman-standing-surrounded-by-exercise-equipment-CQfNt66ttZM">Danielle Cerullo / Unsplash</a>.</figcaption>
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

        <section className="about-section" id="nosotros" tabIndex={-1} aria-labelledby="about-title">
            <div className="container about-grid">
                <h2 id="about-title">Un equipo cerca.</h2>
                <div>
                    <p>Somos un gimnasio de barrio en Florida, Vicente López. Un espacio para entrenar fuerza, moverte y encontrar una rutina que encaje con tu día.</p>
                    <p>Musculación, entrenamiento funcional y actividades grupales, con el acompañamiento de nuestros instructores.</p>
                    <Link className="text-link" to="/registro">Crear mi cuenta</Link>
                </div>
            </div>
        </section>
    </>;
}

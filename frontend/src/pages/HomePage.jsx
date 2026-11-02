import { Link } from 'react-router-dom';
export default function HomePage() {
    return <>
        <section className="hero container" aria-labelledby="hero-title">
            <div className="hero-copy"><p className="location-line">Tu gimnasio en Florida</p><h1 id="hero-title" tabIndex={-1}>Tu lugar.<br /><span>Tu ritmo.</span></h1>
                <p className="hero-description">Entrená cerca, con espacio para tus objetivos y una comunidad que te acompaña. Esto es Target GYM.</p>
                <div className="actions"><Link className="button primary" to="/clases">Ver clases</Link><a className="button secondary" href="#contacto">Contactar</a></div>
                <p className="hero-hours">Lunes a viernes · 6 a 22 h</p>
            </div>
            <div className="hero-art" aria-hidden="true"><div className="training-mark">TARGET</div><div className="barbell"><i /><i /><b /><i /><i /></div><div className="art-caption">Fuerza. Movimiento. Constancia.</div></div>
        </section>
        <section className="about-section" id="nosotros" tabIndex={-1}><div className="container about-grid"><h2>Más cerca.<br />Más constante.</h2><div><p>Somos un gimnasio de barrio en Florida, Vicente López. Un espacio para entrenar fuerza, moverte y encontrar una rutina que encaje con tu día.</p><p>Musculación, entrenamiento funcional y actividades grupales, con el acompañamiento de nuestros instructores.</p><Link className="text-link" to="/registro">Sumate a Target GYM</Link></div></div></section>
        <section className="container services-section" id="servicios" tabIndex={-1}><div className="section-heading"><h2>Encontrá tu forma<br />de entrenar.</h2><p>Distintas propuestas, el mismo objetivo: moverte.</p></div><div className="services-grid">
            {[['Musculación','Un espacio dedicado al entrenamiento de fuerza.'],['Funcional','Movimiento y trabajo grupal para tu rutina.'],['Cardio','Equipamiento para el entrenamiento cardiovascular.'],['Clases grupales','Consultá las actividades y horarios disponibles en la agenda.']].map(([title, copy]) => <article key={title} className="service-card"><span className="service-line" aria-hidden="true" /><h3>{title}</h3><p>{copy}</p></article>)}
        </div><Link className="button secondary" to="/clases">Consultar la agenda</Link></section>
    </>;
}

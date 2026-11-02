import { Link } from 'react-router-dom';
import gimnasio from '../../../info/target-gym/datos-verificados.json';

export default function Footer() {
    return <footer className="site-footer" id="contacto" tabIndex={-1}>
        <div className="footer-visit">
            <div className="container footer-grid">
                <div><h2>Vení a conocernos.</h2><p>Estamos en {gimnasio.direccion.localidad}.</p>
                    <div className="footer-contact"><a href={gimnasio.contacto.telefonoHref}>Llamar: {gimnasio.contacto.telefono}</a>{gimnasio.contacto.whatsapp && <a href={gimnasio.contacto.whatsappHref}>WhatsApp: {gimnasio.contacto.whatsapp}</a>}<a href={gimnasio.contacto.instagram}>Instagram: {gimnasio.contacto.instagramUsuario}</a></div>
                </div>
                <div id="horarios" tabIndex={-1}><h3>Horarios</h3><dl className="hours">
                    <div><dt>Lunes a viernes</dt><dd>{gimnasio.horarios.lunesAViernes}</dd></div>
                    <div><dt>Sábados</dt><dd>{gimnasio.horarios.sabados}</dd></div>
                    <div><dt>Domingos</dt><dd>{gimnasio.horarios.domingos}</dd></div>
                    <div><dt>Feriados</dt><dd>{gimnasio.horarios.feriados}</dd></div>
                </dl></div>
                <div><h3>Dirección</h3><address>{gimnasio.direccion.calle}<br />{gimnasio.direccion.localidad}<br />{gimnasio.direccion.provincia}</address>
                    <a className="text-link" href={gimnasio.fuentes.maps}>Cómo llegar</a>
                </div>
            </div>
        </div>
        <div className="container footer-bottom">
            <Link to="/" className="brand-link" aria-label="Target GYM, volver al inicio">Target gym</Link>
            <span>Florida, Vicente López, Buenos Aires.</span>
            <Link className="text-link" to="/equipo">Acceso del equipo</Link>
        </div>
    </footer>;
}

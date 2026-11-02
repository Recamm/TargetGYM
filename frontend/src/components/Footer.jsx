import { Link } from 'react-router-dom';

export default function Footer() {
    return <footer className="site-footer" id="contacto" tabIndex={-1}>
        <div className="footer-visit">
            <div className="container footer-grid">
                <div><h2>Vení a conocernos.</h2><p>Estamos en Florida, Vicente López.</p></div>
                <div id="horarios" tabIndex={-1}><h3>Horarios</h3><dl className="hours">
                    <div><dt>Lunes a viernes</dt><dd>6 a 22 h</dd></div>
                    <div><dt>Sábados, domingos y feriados</dt><dd>Consultá en el gimnasio.</dd></div>
                </dl></div>
                <div><h3>Dirección</h3><address>Gral. José de San Martín 2462<br />Florida, Vicente López<br />Buenos Aires</address>
                    <a className="text-link" href="https://www.google.com/maps/search/?api=1&query=Gral.%20Jos%C3%A9%20de%20San%20Mart%C3%ADn%202462%2C%20Florida%2C%20Vicente%20L%C3%B3pez%2C%20Buenos%20Aires">Cómo llegar</a>
                </div>
            </div>
        </div>
        <div className="container footer-bottom">
            <Link to="/" className="brand-link" aria-label="Target GYM, volver al inicio"><img src="/marca/logo.svg" alt="" width="144" height="37" /></Link>
            <span>Florida, Vicente López, Buenos Aires.</span>
        </div>
    </footer>;
}

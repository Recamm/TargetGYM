import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import HomePage from './pages/HomePage.jsx';
import ClasesPage from './pages/ClasesPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegistroPage from './pages/RegistroPage.jsx';
import PerfilPage from './pages/PerfilPage.jsx';
import MembresiaPage from './pages/MembresiaPage.jsx';
import InscripcionesPage from './pages/InscripcionesPage.jsx';
import HistorialPage from './pages/HistorialPage.jsx';
import GestionClasesPage from './pages/GestionClasesPage.jsx';
import ClaseFormPage from './pages/ClaseFormPage.jsx';
import SociosPage from './pages/SociosPage.jsx';
import SocioFormPage from './pages/SocioFormPage.jsx';
import PlanesPage from './pages/PlanesPage.jsx';
import PagosPage from './pages/PagosPage.jsx';
import InstructoresPage from './pages/InstructoresPage.jsx';
import InstructorPage from './pages/InstructorPage.jsx';
import AsistenciaPage from './pages/AsistenciaPage.jsx';
import ReportesPage from './pages/ReportesPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import EquipoLayout from './components/EquipoLayout.jsx';
import { useAuth } from './components/AuthContext.js';
import MiEspacioPage from './pages/MiEspacioPage.jsx';
import GestionInicioPage from './pages/GestionInicioPage.jsx';
import ActivarAccesoPage from './pages/ActivarAccesoPage.jsx';
import './App.css';

export default function App() {
    const { pathname, hash, search } = useLocation(), { usuario } = useAuth();
    const equipo = pathname === '/equipo' || pathname.startsWith('/gestion') || pathname.startsWith('/instructor')
        || (pathname === '/mi-cuenta' && usuario && usuario.rol !== 'Socio');
    useEffect(() => {
        const frame = requestAnimationFrame(() => {
            const target = (hash && document.getElementById(hash.slice(1))) || document.querySelector('main h1') || document.getElementById('contenido');
            target?.focus({ preventScroll: true });
            if (hash) target?.scrollIntoView(); else window.scrollTo(0, 0);
            const title = document.querySelector('main h1')?.textContent;
            document.title = title ? `${title} | Target GYM` : 'Target GYM';
        });
        return () => cancelAnimationFrame(frame);
    }, [pathname, hash]);
    const contenido = <main id="contenido" tabIndex={-1} className={equipo ? 'equipo-content page-content' : pathname === '/' ? 'home-main' : 'container page-content'}>
        <Routes>
            <Route path="/" element={<HomePage />} /><Route path="/clases" element={<ClasesPage />} />
            <Route path="/login" element={<LoginPage />} /><Route path="/equipo" element={<LoginPage equipo />} />
            <Route path="/asociate" element={<RegistroPage />} /><Route path="/registro" element={<Navigate to={`/asociate${search}`} replace />} />
            <Route path="/activar-acceso" element={<ActivarAccesoPage />} />
            <Route element={<ProtectedRoute />}><Route path="/mi-cuenta" element={<PerfilPage />} /></Route>
            <Route element={<ProtectedRoute roles={['Socio']} />}>
                <Route path="/mi-espacio" element={<MiEspacioPage />} />
                <Route path="/mi-membresia" element={<MembresiaPage />} /><Route path="/mis-inscripciones" element={<InscripcionesPage />} /><Route path="/mi-historial" element={<HistorialPage />} />
            </Route>
            <Route element={<ProtectedRoute roles={['Administrador']} loginPath="/equipo" />}>
                <Route path="/gestion" element={<GestionInicioPage />} />
                <Route path="/gestion/clases" element={<GestionClasesPage />} /><Route path="/gestion/clases/nueva" element={<ClaseFormPage />} />
                <Route path="/gestion/clases/:id/editar" element={<ClaseFormPage />} /><Route path="/gestion/clases/:id/asistencia" element={<AsistenciaPage />} />
                <Route path="/gestion/socios" element={<SociosPage />} /><Route path="/gestion/socios/nuevo" element={<SocioFormPage />} /><Route path="/gestion/socios/:id" element={<SocioFormPage />} />
                <Route path="/gestion/planes" element={<PlanesPage />} /><Route path="/gestion/pagos" element={<PagosPage />} /><Route path="/gestion/instructores" element={<InstructoresPage />} /><Route path="/gestion/reportes" element={<ReportesPage />} />
            </Route>
            <Route element={<ProtectedRoute roles={['Instructor']} loginPath="/equipo" />}><Route path="/instructor/clases" element={<InstructorPage />} /><Route path="/instructor/clases/:id/asistencia" element={<AsistenciaPage />} /></Route>
            <Route path="*" element={<NotFoundPage />} />
        </Routes>
    </main>;
    return <><a className="skip-link" href="#contenido">Saltar al contenido</a>{equipo ? <EquipoLayout>{contenido}</EquipoLayout> : <><Header />{contenido}<Footer /></>}</>;
}

import { beforeEach, expect, test, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthContext, inicioPorRol } from '../components/AuthContext.js';
import NotificationProvider from '../components/NotificationProvider.jsx';
import ProtectedRoute from '../components/ProtectedRoute.jsx';
import Header from '../components/Header.jsx';
import LoginPage from './LoginPage.jsx';
import MiEspacioPage from './MiEspacioPage.jsx';
import GestionInicioPage from './GestionInicioPage.jsx';
import ActivarAccesoPage from './ActivarAccesoPage.jsx';
import { miMembresia, informarTransferencia } from '../services/membresiasService.js';
import { listarSocios } from '../services/sociosService.js';

vi.mock('../services/membresiasService.js', () => ({ miMembresia: vi.fn(), informarTransferencia: vi.fn() }));
vi.mock('../services/sociosService.js', () => ({ listarSocios: vi.fn() }));
const socio = { id: 1, nombre: 'Prueba', rol: 'Socio', estado: 'activo', tipoPlan: 'mensual', nombrePlanSolicitado: 'Plan mensual', metodoPagoSolicitado: 'Transferencia', pagoReportadoEn: null };
beforeEach(() => { vi.clearAllMocks(); miMembresia.mockResolvedValue(null); listarSocios.mockResolvedValue([]); });
function setup(element, auth = {}) {
    return render(<MemoryRouter><AuthContext.Provider value={{ usuario: null, loading: false, ...auth }}><NotificationProvider>{element}</NotificationProvider></AuthContext.Provider></MemoryRouter>);
}
test('visitante tiene Asociate y Ya soy socio; socio tiene Mi espacio', () => {
    const vista = setup(<Header />);
    expect(screen.getByRole('link', { name: 'Asociate' })).toHaveAttribute('href', '/asociate');
    expect(screen.getByRole('link', { name: 'Ya soy socio' })).toHaveAttribute('href', '/login');
    vista.unmount();
    setup(<Header />, { usuario: socio });
    expect(screen.getByRole('link', { name: 'Mi espacio' })).toHaveAttribute('href', '/mi-espacio');
    expect(screen.queryByRole('link', { name: 'Asociate' })).not.toBeInTheDocument();
});
test('portal del equipo no ofrece alta pública ni selector de roles', () => {
    setup(<LoginPage equipo />);
    expect(screen.getByRole('heading', { name: 'Acceso del equipo' })).toBeVisible();
    expect(screen.queryByRole('link', { name: 'Asociate' })).not.toBeInTheDocument();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(inicioPorRol('Administrador')).toBe('/gestion');
    expect(inicioPorRol('Instructor')).toBe('/instructor/clases');
    expect(inicioPorRol('Socio')).toBe('/mi-espacio');
});
test('ruta administrativa anónima usa el acceso del equipo; socio no obtiene permisos', () => {
    const rutas = <Routes><Route element={<ProtectedRoute roles={['Administrador']} loginPath="/equipo" />}><Route path="/" element={<p>Panel privado</p>} /></Route><Route path="/equipo" element={<p>Ingreso del equipo</p>} /></Routes>;
    const vista = setup(rutas);
    expect(screen.getByText('Ingreso del equipo')).toBeVisible();
    vista.unmount();
    setup(rutas, { usuario: socio });
    expect(screen.getByRole('heading', { name: 'Acceso no permitido' })).toBeVisible();
    expect(screen.queryByText('Panel privado')).not.toBeInTheDocument();
});
test('Mi espacio diferencia cuenta creada y pago; informar transferencia no activa', async () => {
    const refresh = vi.fn().mockResolvedValue();
    informarTransferencia.mockResolvedValue({ ...socio, pagoReportadoEn: '2030-01-01T15:00:00Z' });
    setup(<MiEspacioPage />, { usuario: socio, refresh });
    expect(screen.getByRole('heading', { name: 'Tu cuenta está creada' })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Ya realicé la transferencia' }));
    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(screen.queryByText('Membresía activa')).not.toBeInTheDocument();
    expect(screen.getByText(/solo se activa cuando el administrador confirma/)).toBeVisible();
});
test('Mi espacio muestra el caso sin plan, y los errores permiten reintentar', async () => {
    const vista = setup(<MiEspacioPage />, { usuario: { ...socio, tipoPlan: null } });
    expect(await screen.findByText(/Todavía no tenés una membresía. Elegí un plan/)).toBeVisible();
    vista.unmount();
    miMembresia.mockRejectedValueOnce(new Error('No se pudo consultar la membresía.'));
    setup(<MiEspacioPage />, { usuario: socio });
    expect(await screen.findByText('No se pudo consultar la membresía.')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeVisible();
});
test('resumen administrativo prioriza transferencias reportadas y distingue renovaciones', async () => {
    listarSocios.mockResolvedValue([{ ...socio, apellido: 'Efectivo', id: 2, metodoPagoSolicitado: 'Efectivo', membresia: null }, { ...socio, apellido: 'Transferencia', pagoReportadoEn: '2030-01-01T15:00:00Z', membresia: null }]);
    setup(<GestionInicioPage />);
    const links = await screen.findAllByRole('link', { name: 'Registrar pago confirmado' });
    expect(links[0]).toHaveAttribute('href', '/gestion/pagos?socio=1');
    expect(screen.getByText('Transferencia a revisar')).toBeVisible();
    expect(screen.getByText(/Una transferencia informada/)).toBeVisible();
});
test('primer acceso requiere enlace personal y explica que no activa membresía', () => {
    setup(<ActivarAccesoPage />);
    expect(screen.getByRole('heading', { name: 'Necesitás tu enlace de acceso' })).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Activar mi acceso' })).not.toBeInTheDocument();
});

test('primer acceso espera la sesión y permite reintentar errores de autenticación', () => {
    const vista = setup(<ActivarAccesoPage />, { loading: true });
    expect(screen.getByRole('status')).toHaveTextContent('Cargando información');
    expect(screen.queryByRole('button', { name: 'Activar mi acceso' })).not.toBeInTheDocument();
    vista.unmount();
    setup(<ActivarAccesoPage />, { error: new Error('No pudimos comprobar la sesión.'), refresh: vi.fn() });
    expect(screen.getByText('No pudimos comprobar la sesión.')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeVisible();
});

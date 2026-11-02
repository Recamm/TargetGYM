import { StrictMode } from 'react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Link, MemoryRouter } from 'react-router-dom';
import App from './App.jsx';

vi.mock('./components/AuthContext.js', () => ({ useAuth: () => ({ usuario: null }) }));
vi.mock('./components/Header.jsx', () => ({ default: () => null }));
vi.mock('./components/Footer.jsx', () => ({ default: () => null }));
vi.mock('./pages/HomePage.jsx', () => ({ default: () => <>
    <h1 tabIndex={-1}>Portada</h1>
    <Link to="/#planes">Ver planes</Link><Link to="/">Volver al inicio</Link>
    <Link to="/clases">Otra página</Link><Link to="/?actividad=funcional">Filtrar</Link>
    <section id="planes" tabIndex={-1}>Nuestros planes</section>
</> }));
vi.mock('./pages/ClasesPage.jsx', () => ({ default: () => <h1 tabIndex={-1}>Clases</h1> }));

const originalScroll = Object.getOwnPropertyDescriptor(Element.prototype, 'scrollIntoView');
beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    vi.stubGlobal('requestAnimationFrame', callback => { callback(0); return 1; });
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false })));
});
afterEach(() => {
    vi.restoreAllMocks(); vi.unstubAllGlobals();
    if (originalScroll) Object.defineProperty(Element.prototype, 'scrollIntoView', originalScroll);
    else delete Element.prototype.scrollIntoView;
});
function setup(path = '/') {
    render(<StrictMode><MemoryRouter initialEntries={[path]}><App /></MemoryRouter></StrictMode>);
    window.scrollTo.mockClear(); Element.prototype.scrollIntoView.mockClear();
}

test('anclas internas se animan y vuelven a funcionar al repetir el mismo enlace', () => {
    setup();
    fireEvent.click(screen.getByRole('link', { name: 'Ver planes' }));
    expect(Element.prototype.scrollIntoView).toHaveBeenLastCalledWith({ behavior: 'smooth' });
    expect(screen.getByText('Nuestros planes')).toHaveFocus();
    Element.prototype.scrollIntoView.mockClear();
    fireEvent.click(screen.getByRole('link', { name: 'Ver planes' }));
    expect(Element.prototype.scrollIntoView).toHaveBeenCalledOnce();
    expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });
});

test('volver al inicio de la misma página se anima, incluso sin cambiar la URL', () => {
    setup('/#planes');
    fireEvent.click(screen.getByRole('link', { name: 'Volver al inicio' }));
    expect(window.scrollTo).toHaveBeenLastCalledWith({ top: 0, left: 0, behavior: 'smooth' });
    window.scrollTo.mockClear();
    fireEvent.click(screen.getByRole('link', { name: 'Volver al inicio' }));
    expect(window.scrollTo).toHaveBeenCalledOnce();
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: 'smooth' });
});

test('cambiar filtros no mueve ni roba foco; otra página empieza arriba sin animación', () => {
    setup();
    const filtro = screen.getByRole('link', { name: 'Filtrar' });
    filtro.focus(); fireEvent.click(filtro);
    expect(window.scrollTo).not.toHaveBeenCalled();
    expect(filtro).toHaveFocus();
    fireEvent.click(screen.getByRole('link', { name: 'Otra página' }));
    expect(window.scrollTo).toHaveBeenLastCalledWith({ top: 0, left: 0, behavior: 'instant' });
    expect(screen.getByRole('heading', { name: 'Clases' })).toHaveFocus();
});

test('movimiento reducido e ingreso directo conservan navegación inmediata', () => {
    window.matchMedia.mockReturnValue({ matches: true });
    render(<StrictMode><MemoryRouter initialEntries={['/#planes']}><App /></MemoryRouter></StrictMode>);
    expect(Element.prototype.scrollIntoView.mock.calls.every(([options]) => options?.behavior === 'instant')).toBe(true);
    Element.prototype.scrollIntoView.mockClear();
    fireEvent.click(screen.getByRole('link', { name: 'Ver planes' }));
    expect(Element.prototype.scrollIntoView).toHaveBeenLastCalledWith({ behavior: 'instant' });
});

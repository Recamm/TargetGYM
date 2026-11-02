import { expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import HomePage from './HomePage.jsx';

test('mantiene la bienvenida de Cerca, identifica la referencia y enlaza la agenda real', () => {
    const { container } = render(<MemoryRouter><HomePage /></MemoryRouter>);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Qué bueno que viniste.');
    expect(screen.getByRole('link', { name: 'Ver actividades' })).toHaveAttribute('href', '/#servicios');
    expect(screen.getByRole('link', { name: 'Ver clases', exact: true })).toHaveAttribute('href', '/clases');
    expect(screen.getByText(/No corresponde a Target GYM/)).toBeVisible();
    expect(screen.getByRole('img')).toHaveAttribute('src', '/marca/gimnasio-referencia.webp');
    expect(container.querySelectorAll('details')).toHaveLength(4);
    expect(container.querySelectorAll('details[open]')).toHaveLength(1);
    expect(screen.getByRole('link', { name: 'Crear mi cuenta' })).toHaveAttribute('href', '/registro');
});

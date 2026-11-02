import { expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Footer from './Footer.jsx';

test('muestra WhatsApp confirmado con formato móvil argentino sin cambiar el teléfono fijo', () => {
    render(<MemoryRouter><Footer /></MemoryRouter>);
    expect(screen.getByRole('link', { name: 'WhatsApp: 11 6824-4559' })).toHaveAttribute('href', 'https://wa.me/5491168244559');
    expect(screen.getByRole('link', { name: 'Llamar: 011 4795-5087' })).toHaveAttribute('href', 'tel:+541147955087');
    expect(screen.getByRole('link', { name: 'Instagram: @targetgym_florida' })).toHaveAttribute('href', 'https://www.instagram.com/targetgym_florida/');
});

import AppError from '../exceptions/AppError.js';
import { Messages } from '../enums/Messages.js';

// Middleware centralizado de manejo de errores (debe registrarse al final de la app)
function errorHandler(err, req, res, next) {
    if (res.headersSent) return next(err);
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({ success: false, message: err.message });
    }

    if (err.type === 'entity.parse.failed') return res.status(400).json({ success: false, message: 'El cuerpo JSON no es valido.' });
    if (err.type === 'entity.too.large') return res.status(413).json({ success: false, message: 'El formulario es demasiado grande.' });
    if (err.code === '23505') return res.status(409).json({ success: false, message: 'Ya existe un registro con esos datos.' });
    if (err.code === '23503') return res.status(409).json({ success: false, message: 'El registro relacionado no esta disponible.' });
    console.error('Error de API:', err.code ?? err.name);
    return res.status(500).json({ success: false, message: Messages.INTERNAL_ERROR });
}

export default errorHandler;

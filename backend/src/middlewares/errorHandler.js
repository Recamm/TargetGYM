import AppError from '../exceptions/AppError.js';
import { Messages } from '../enums/Messages.js';

// Middleware centralizado de manejo de errores (debe registrarse al final de la app)
function errorHandler(err, req, res, next) {
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({ success: false, message: err.message });
    }

    console.error(err);
    return res.status(500).json({ success: false, message: Messages.INTERNAL_ERROR });
}

export default errorHandler;

// Error base de la aplicación, con codigo HTTP asociado
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.name = this.constructor.name;
        this.statusCode = statusCode;
    }
}

export class BadRequestError extends AppError {
    constructor(message) {
        super(message, 400);
    }
}

export class NotFoundError extends AppError {
    constructor(message) {
        super(message, 404);
    }
}

export class ConflictError extends AppError {
    constructor(message) {
        super(message, 409);
    }
}

export class InternalServerError extends AppError {
    constructor(message) {
        super(message, 500);
    }
}

export class UnauthorizedError extends AppError {
    constructor(message = 'Debes iniciar sesion.') { super(message, 401); }
}
export class ForbiddenError extends AppError {
    constructor(message = 'No tienes permiso para esta operacion.') { super(message, 403); }
}
export class TooManyRequestsError extends AppError {
    constructor(message) { super(message, 429); }
}

export default AppError;

// Formato consistente de respuestas exitosas de la API
export function sendSuccess(res, data = null, statusCode = 200) {
    return res.status(statusCode).json({ success: true, data });
}

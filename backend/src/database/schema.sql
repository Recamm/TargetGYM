CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY);
CREATE TABLE IF NOT EXISTS sistema_lock (id INTEGER PRIMARY KEY CHECK (id = 1));
INSERT INTO sistema_lock VALUES (1) ON CONFLICT DO NOTHING;
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nombre TEXT NOT NULL,
    apellido TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    dni TEXT UNIQUE,
    telefono TEXT,
    fecha_nacimiento TEXT,
    rol TEXT NOT NULL CHECK (rol IN ('Administrador', 'Socio', 'Instructor')),
    estado TEXT NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'suspendido', 'baja')),
    especialidad TEXT,
    plan_solicitado TEXT,
    fecha_alta TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS planes (
    tipo TEXT PRIMARY KEY CHECK (tipo IN ('mensual', 'trimestral', 'anual')),
    meses INTEGER NOT NULL CHECK (meses IN (1, 3, 12)),
    precio_centavos INTEGER CHECK (precio_centavos > 0),
    descuento_porcentaje INTEGER NOT NULL DEFAULT 0 CHECK (descuento_porcentaje BETWEEN 0 AND 99)
);
INSERT INTO planes (tipo, meses)
SELECT * FROM (VALUES ('mensual', 1), ('trimestral', 3), ('anual', 12)) AS iniciales(tipo,meses)
WHERE NOT EXISTS (SELECT 1 FROM schema_migrations WHERE version=2) ON CONFLICT DO NOTHING;
CREATE TABLE IF NOT EXISTS membresias (
    id SERIAL PRIMARY KEY,
    socio_id INTEGER NOT NULL REFERENCES usuarios(id),
    tipo_plan TEXT NOT NULL REFERENCES planes(tipo),
    fecha_inicio TIMESTAMPTZ NOT NULL,
    fecha_vencimiento TIMESTAMPTZ NOT NULL,
    estado TEXT NOT NULL CHECK (estado IN ('activa', 'vencida', 'reemplazada')),
    CHECK (fecha_vencimiento > fecha_inicio)
);
CREATE INDEX IF NOT EXISTS membresias_socio ON membresias(socio_id, id DESC);
CREATE TABLE IF NOT EXISTS pagos (
    id SERIAL PRIMARY KEY,
    socio_id INTEGER NOT NULL REFERENCES usuarios(id),
    membresia_id INTEGER NOT NULL REFERENCES membresias(id),
    tipo_plan TEXT NOT NULL REFERENCES planes(tipo),
    monto_centavos INTEGER NOT NULL CHECK (monto_centavos > 0),
    metodo_pago TEXT NOT NULL,
    operacion_id UUID NOT NULL UNIQUE,
    fecha TIMESTAMPTZ NOT NULL,
    administrador_id INTEGER NOT NULL REFERENCES usuarios(id)
);
CREATE TABLE IF NOT EXISTS clases (
    id SERIAL PRIMARY KEY,
    nombre TEXT NOT NULL,
    tipo TEXT NOT NULL,
    fecha TEXT NOT NULL,
    hora_inicio TEXT NOT NULL,
    inicio TIMESTAMPTZ NOT NULL,
    duracion_minutos INTEGER NOT NULL CHECK (duracion_minutos BETWEEN 1 AND 480),
    cupo_maximo INTEGER NOT NULL CHECK (cupo_maximo BETWEEN 1 AND 1000),
    instructor_id INTEGER NOT NULL REFERENCES usuarios(id),
    estado TEXT NOT NULL DEFAULT 'Programada' CHECK (estado IN ('Programada', 'En curso', 'Finalizada', 'Cancelada')),
    eliminada BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE TABLE IF NOT EXISTS inscripciones (
    id SERIAL PRIMARY KEY,
    socio_id INTEGER NOT NULL REFERENCES usuarios(id),
    clase_id INTEGER NOT NULL REFERENCES clases(id),
    estado TEXT NOT NULL CHECK (estado IN ('Pendiente', 'Confirmada', 'En curso', 'Finalizada', 'Cancelada')),
    fecha_inscripcion TIMESTAMPTZ NOT NULL,
    asistio BOOLEAN
);
CREATE UNIQUE INDEX IF NOT EXISTS inscripcion_activa_unica ON inscripciones(socio_id, clase_id)
WHERE estado IN ('Pendiente', 'Confirmada', 'En curso');
CREATE INDEX IF NOT EXISTS inscripciones_clase ON inscripciones(clase_id);
CREATE TABLE IF NOT EXISTS sesiones (sid TEXT PRIMARY KEY, datos JSONB NOT NULL, expira TIMESTAMPTZ NOT NULL);
CREATE TABLE IF NOT EXISTS intentos_auth (clave TEXT PRIMARY KEY, cantidad INTEGER NOT NULL, inicio TIMESTAMPTZ NOT NULL);
INSERT INTO schema_migrations VALUES (1) ON CONFLICT DO NOTHING;

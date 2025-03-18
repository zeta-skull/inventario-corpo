'use strict';

const { ValidationError } = require('sequelize');
const { opcionesValidacion } = require('../utils/validations');

// Middleware para validar datos usando Joi
const validarDatos = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, opcionesValidacion);
        
        if (error) {
            return res.status(400).json({
                error: true,
                mensaje: 'Error de validación',
                detalles: error.details.map(err => ({
                    campo: err.path.join('.'),
                    mensaje: err.message
                }))
            });
        }

        // Reemplazar el body con los datos validados y sanitizados
        req.body = value;
        next();
    };
};

// Middleware para validar IDs numéricos
const validarId = (req, res, next) => {
    const id = parseInt(req.params.id);
    
    if (isNaN(id) || id <= 0) {
        return res.status(400).json({
            error: true,
            mensaje: 'ID inválido'
        });
    }

    req.params.id = id;
    next();
};

// Middleware para validar parámetros de paginación
const validarPaginacion = (req, res, next) => {
    const pagina = parseInt(req.query.pagina) || 1;
    const limite = parseInt(req.query.limite) || parseInt(process.env.MAX_PRODUCTOS_POR_PAGINA) || 50;
    const orden = req.query.orden || 'DESC';
    const ordenar_por = req.query.ordenar_por || 'fecha_creacion';

    // Validar valores
    if (pagina < 1) {
        return res.status(400).json({
            error: true,
            mensaje: 'Número de página inválido'
        });
    }

    if (limite < 1 || limite > (parseInt(process.env.MAX_PRODUCTOS_POR_PAGINA) || 100)) {
        return res.status(400).json({
            error: true,
            mensaje: 'Límite de registros inválido'
        });
    }

    if (!['ASC', 'DESC'].includes(orden.toUpperCase())) {
        return res.status(400).json({
            error: true,
            mensaje: 'Orden inválido'
        });
    }

    // Agregar parámetros validados al request
    req.paginacion = {
        pagina,
        limite,
        offset: (pagina - 1) * limite,
        orden: orden.toUpperCase(),
        ordenar_por
    };

    next();
};

// Middleware para manejar errores
const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);

    // Errores de validación de Sequelize
    if (err instanceof ValidationError) {
        return res.status(400).json({
            error: true,
            mensaje: 'Error de validación',
            detalles: err.errors.map(error => ({
                campo: error.path,
                mensaje: error.message
            }))
        });
    }

    // Error de archivo muy grande
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
            error: true,
            mensaje: 'El archivo excede el tamaño máximo permitido'
        });
    }

    // Error de tipo de archivo no permitido
    if (err.code === 'LIMIT_FILE_TYPES') {
        return res.status(400).json({
            error: true,
            mensaje: 'Tipo de archivo no permitido'
        });
    }

    // Error de conexión a la base de datos
    if (err.name === 'SequelizeConnectionError') {
        return res.status(503).json({
            error: true,
            mensaje: 'Error de conexión a la base de datos'
        });
    }

    // Error de clave única
    if (err.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({
            error: true,
            mensaje: 'Ya existe un registro con estos datos',
            detalles: Object.keys(err.fields).map(field => ({
                campo: field,
                mensaje: `Ya existe un registro con este ${field}`
            }))
        });
    }

    // Error de clave foránea
    if (err.name === 'SequelizeForeignKeyConstraintError') {
        return res.status(400).json({
            error: true,
            mensaje: 'Error de referencia: el registro relacionado no existe'
        });
    }

    // Error de token JWT
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            error: true,
            mensaje: 'Token inválido'
        });
    }

    // Error de token expirado
    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            error: true,
            mensaje: 'Token expirado'
        });
    }

    // Error personalizado
    if (err.isOperational) {
        return res.status(err.statusCode || 400).json({
            error: true,
            mensaje: err.message
        });
    }

    // Error de servidor no manejado
    return res.status(500).json({
        error: true,
        mensaje: process.env.NODE_ENV === 'production' 
            ? 'Error interno del servidor' 
            : err.message
    });
};

// Clase para errores operacionales personalizados
class ErrorOperacional extends Error {
    constructor(mensaje, statusCode = 400) {
        super(mensaje);
        this.name = 'ErrorOperacional';
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = {
    validarDatos,
    validarId,
    validarPaginacion,
    errorHandler,
    ErrorOperacional
};

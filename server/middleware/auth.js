'use strict';

const jwt = require('jsonwebtoken');
const { Usuario } = require('../models');

// Middleware para verificar token JWT
const verificarToken = async (req, res, next) => {
    try {
        // Obtener token del header
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({
                error: true,
                mensaje: 'No se proporcionó token de acceso'
            });
        }

        // Verificar token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Buscar usuario y verificar que esté activo
        const usuario = await Usuario.findByPk(decoded.id);
        if (!usuario || !usuario.activo) {
            return res.status(401).json({
                error: true,
                mensaje: 'Usuario no encontrado o inactivo'
            });
        }

        // Agregar usuario al request
        req.usuario = usuario;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: true,
                mensaje: 'Token expirado'
            });
        }
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                error: true,
                mensaje: 'Token inválido'
            });
        }
        next(error);
    }
};

// Middleware para verificar roles
const verificarRol = (...roles) => {
    return (req, res, next) => {
        if (!req.usuario) {
            return res.status(401).json({
                error: true,
                mensaje: 'Usuario no autenticado'
            });
        }

        if (!roles.includes(req.usuario.rol)) {
            return res.status(403).json({
                error: true,
                mensaje: 'No tiene permisos para realizar esta acción'
            });
        }

        next();
    };
};

// Middleware para verificar permisos específicos
const verificarPermiso = (permiso) => {
    return (req, res, next) => {
        if (!req.usuario) {
            return res.status(401).json({
                error: true,
                mensaje: 'Usuario no autenticado'
            });
        }

        if (!req.usuario.tienePermiso(permiso)) {
            return res.status(403).json({
                error: true,
                mensaje: 'No tiene el permiso requerido'
            });
        }

        next();
    };
};

// Middleware para verificar propiedad del recurso
const verificarPropietario = (campo = 'id') => {
    return (req, res, next) => {
        // Si es admin, permitir acceso
        if (req.usuario.rol === 'admin') {
            return next();
        }

        // Verificar si el ID del recurso coincide con el ID del usuario
        const recursoId = req.params[campo];
        if (recursoId !== req.usuario.id.toString()) {
            return res.status(403).json({
                error: true,
                mensaje: 'No tiene permisos para acceder a este recurso'
            });
        }

        next();
    };
};

// Middleware para verificar límites de cliente
const verificarLimiteCliente = async (req, res, next) => {
    try {
        if (!req.body.cliente_id || !req.body.total) {
            return next();
        }

        const cliente = await Cliente.findByPk(req.body.cliente_id);
        if (!cliente) {
            return res.status(404).json({
                error: true,
                mensaje: 'Cliente no encontrado'
            });
        }

        const puedeRealizar = await cliente.verificarLimiteMensual(req.body.total);
        if (!puedeRealizar) {
            return res.status(403).json({
                error: true,
                mensaje: 'La operación excede el límite mensual del cliente'
            });
        }

        next();
    } catch (error) {
        next(error);
    }
};

// Middleware para verificar stock suficiente
const verificarStock = async (req, res, next) => {
    try {
        if (!req.body.producto_id || !req.body.cantidad || req.body.tipo !== 'salida') {
            return next();
        }

        const producto = await Producto.findByPk(req.body.producto_id);
        if (!producto) {
            return res.status(404).json({
                error: true,
                mensaje: 'Producto no encontrado'
            });
        }

        if (!producto.tieneStockSuficiente(req.body.cantidad)) {
            return res.status(400).json({
                error: true,
                mensaje: 'Stock insuficiente',
                datos: {
                    stock_actual: producto.stock,
                    cantidad_solicitada: req.body.cantidad
                }
            });
        }

        next();
    } catch (error) {
        next(error);
    }
};

// Middleware para registrar actividad
const registrarActividad = async (req, res, next) => {
    const originalSend = res.send;
    res.send = function (data) {
        res.send = originalSend;
        
        // Solo registrar actividades en métodos que modifican datos
        if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
            const actividad = {
                usuario_id: req.usuario?.id,
                metodo: req.method,
                ruta: req.originalUrl,
                ip: req.ip,
                user_agent: req.get('user-agent'),
                estado: res.statusCode,
                fecha: new Date()
            };

            // Aquí podrías guardar la actividad en la base de datos
            // o enviarla a un sistema de logging
            console.log('Actividad registrada:', actividad);
        }

        return res.send(data);
    };
    next();
};

module.exports = {
    verificarToken,
    verificarRol,
    verificarPermiso,
    verificarPropietario,
    verificarLimiteCliente,
    verificarStock,
    registrarActividad
};

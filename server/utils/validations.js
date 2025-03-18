'use strict';

const Joi = require('joi');

// Opciones de validación globales
const opcionesValidacion = {
    abortEarly: false, // Reportar todos los errores, no solo el primero
    allowUnknown: true, // Permitir campos desconocidos
    stripUnknown: true  // Eliminar campos desconocidos
};

// Mensajes de error personalizados en español
const mensajesError = {
    'string.base': 'El campo {#label} debe ser un texto',
    'string.empty': 'El campo {#label} no puede estar vacío',
    'string.min': 'El campo {#label} debe tener al menos {#limit} caracteres',
    'string.max': 'El campo {#label} no puede tener más de {#limit} caracteres',
    'string.email': 'El campo {#label} debe ser un correo electrónico válido',
    'number.base': 'El campo {#label} debe ser un número',
    'number.min': 'El campo {#label} debe ser mayor o igual a {#limit}',
    'number.max': 'El campo {#label} debe ser menor o igual a {#limit}',
    'date.base': 'El campo {#label} debe ser una fecha válida',
    'any.required': 'El campo {#label} es obligatorio',
    'any.only': 'El campo {#label} debe ser uno de los siguientes valores: {#valids}',
    'object.base': 'El campo {#label} debe ser un objeto',
    'array.base': 'El campo {#label} debe ser un arreglo',
    'array.min': 'El campo {#label} debe tener al menos {#limit} elementos',
    'array.max': 'El campo {#label} debe tener como máximo {#limit} elementos'
};

// Esquemas de validación
const validaciones = {
    // Validaciones de autenticación
    auth: {
        login: Joi.object({
            email: Joi.string().email().required().messages(mensajesError),
            password: Joi.string().required().messages(mensajesError)
        }),

        recuperarPassword: Joi.object({
            email: Joi.string().email().required().messages(mensajesError)
        }),

        restablecerPassword: Joi.object({
            token: Joi.string().required().messages(mensajesError),
            password: Joi.string().min(8).required().messages(mensajesError)
        }),

        cambiarPassword: Joi.object({
            password_actual: Joi.string().required().messages(mensajesError),
            password_nueva: Joi.string().min(8).required().messages(mensajesError)
        }),

        actualizarTema: Joi.object({
            tema: Joi.string().valid('light', 'dark').required().messages(mensajesError)
        })
    },

    // Validaciones de usuario
    usuario: {
        crear: Joi.object({
            nombre: Joi.string().min(2).max(50).required().messages(mensajesError),
            apellido: Joi.string().min(2).max(50).required().messages(mensajesError),
            email: Joi.string().email().required().messages(mensajesError),
            password: Joi.string().min(8).required().messages(mensajesError),
            rol: Joi.string().valid('admin', 'supervisor', 'operador').required().messages(mensajesError)
        }),

        actualizar: Joi.object({
            nombre: Joi.string().min(2).max(50).messages(mensajesError),
            apellido: Joi.string().min(2).max(50).messages(mensajesError),
            email: Joi.string().email().messages(mensajesError)
        }),

        actualizarRol: Joi.object({
            rol: Joi.string().valid('admin', 'supervisor', 'operador').required().messages(mensajesError)
        }),

        cambiarEstado: Joi.object({
            activo: Joi.boolean().required().messages(mensajesError),
            motivo: Joi.when('activo', {
                is: false,
                then: Joi.string().required(),
                otherwise: Joi.string().allow('')
            }).messages(mensajesError)
        })
    },

    // Validaciones de producto
    producto: {
        crear: Joi.object({
            codigo: Joi.string().min(3).max(20).required().messages(mensajesError),
            nombre: Joi.string().min(3).max(100).required().messages(mensajesError),
            descripcion: Joi.string().max(500).allow('').messages(mensajesError),
            categoria_id: Joi.number().integer().required().messages(mensajesError),
            proveedor_id: Joi.number().integer().required().messages(mensajesError),
            precio_compra: Joi.number().min(0).required().messages(mensajesError),
            precio_venta: Joi.number().min(0).required().messages(mensajesError),
            stock: Joi.number().integer().min(0).required().messages(mensajesError),
            stock_minimo: Joi.number().integer().min(0).required().messages(mensajesError),
            ubicacion: Joi.string().max(50).allow('').messages(mensajesError)
        }),

        actualizar: Joi.object({
            codigo: Joi.string().min(3).max(20).messages(mensajesError),
            nombre: Joi.string().min(3).max(100).messages(mensajesError),
            descripcion: Joi.string().max(500).allow('').messages(mensajesError),
            categoria_id: Joi.number().integer().messages(mensajesError),
            proveedor_id: Joi.number().integer().messages(mensajesError),
            precio_compra: Joi.number().min(0).messages(mensajesError),
            precio_venta: Joi.number().min(0).messages(mensajesError),
            stock_minimo: Joi.number().integer().min(0).messages(mensajesError),
            ubicacion: Joi.string().max(50).allow('').messages(mensajesError)
        }),

        cambiarEstado: Joi.object({
            estado: Joi.string().valid('activo', 'inactivo').required().messages(mensajesError),
            motivo: Joi.when('estado', {
                is: 'inactivo',
                then: Joi.string().required(),
                otherwise: Joi.string().allow('')
            }).messages(mensajesError)
        }),

        cargaMasiva: Joi.object({
            archivo: Joi.any().required().messages(mensajesError)
        })
    },

    // Validaciones de categoría
    categoria: {
        crear: Joi.object({
            nombre: Joi.string().min(3).max(50).required().messages(mensajesError),
            descripcion: Joi.string().max(200).allow('').messages(mensajesError),
            color: Joi.string().regex(/^#[0-9A-Fa-f]{6}$/).allow('').messages(mensajesError),
            orden: Joi.number().integer().min(0).messages(mensajesError)
        }),

        actualizar: Joi.object({
            nombre: Joi.string().min(3).max(50).messages(mensajesError),
            descripcion: Joi.string().max(200).allow('').messages(mensajesError),
            color: Joi.string().regex(/^#[0-9A-Fa-f]{6}$/).allow('').messages(mensajesError),
            orden: Joi.number().integer().min(0).messages(mensajesError)
        }),

        actualizarOrdenes: Joi.object({
            ordenes: Joi.array().items(
                Joi.object({
                    id: Joi.number().integer().required(),
                    orden: Joi.number().integer().min(0).required()
                })
            ).required().messages(mensajesError)
        }),

        cambiarEstado: Joi.object({
            estado: Joi.string().valid('activo', 'inactivo').required().messages(mensajesError)
        })
    },

    // Validaciones de proveedor
    proveedor: {
        crear: Joi.object({
            rut: Joi.string().required().messages(mensajesError),
            razon_social: Joi.string().min(3).max(100).required().messages(mensajesError),
            nombre_contacto: Joi.string().min(3).max(100).required().messages(mensajesError),
            email: Joi.string().email().required().messages(mensajesError),
            telefono: Joi.string().allow('').messages(mensajesError),
            direccion: Joi.string().max(200).allow('').messages(mensajesError),
            comuna: Joi.string().max(50).allow('').messages(mensajesError),
            ciudad: Joi.string().max(50).allow('').messages(mensajesError),
            region: Joi.string().max(50).allow('').messages(mensajesError),
            sitio_web: Joi.string().uri().allow('').messages(mensajesError),
            condiciones_pago: Joi.string().max(200).allow('').messages(mensajesError)
        }),

        actualizar: Joi.object({
            rut: Joi.string().messages(mensajesError),
            razon_social: Joi.string().min(3).max(100).messages(mensajesError),
            nombre_contacto: Joi.string().min(3).max(100).messages(mensajesError),
            email: Joi.string().email().messages(mensajesError),
            telefono: Joi.string().allow('').messages(mensajesError),
            direccion: Joi.string().max(200).allow('').messages(mensajesError),
            comuna: Joi.string().max(50).allow('').messages(mensajesError),
            ciudad: Joi.string().max(50).allow('').messages(mensajesError),
            region: Joi.string().max(50).allow('').messages(mensajesError),
            sitio_web: Joi.string().uri().allow('').messages(mensajesError),
            condiciones_pago: Joi.string().max(200).allow('').messages(mensajesError)
        }),

        cambiarEstado: Joi.object({
            estado: Joi.string().valid('activo', 'inactivo').required().messages(mensajesError),
            motivo: Joi.when('estado', {
                is: 'inactivo',
                then: Joi.string().required(),
                otherwise: Joi.string().allow('')
            }).messages(mensajesError)
        }),

        validarRUT: Joi.object({
            rut: Joi.string().required().messages(mensajesError)
        })
    },

    // Validaciones de cliente
    cliente: {
        crear: Joi.object({
            rut: Joi.string().required().messages(mensajesError),
            nombre: Joi.string().min(2).max(50).required().messages(mensajesError),
            apellido: Joi.string().min(2).max(50).required().messages(mensajesError),
            email: Joi.string().email().required().messages(mensajesError),
            telefono: Joi.string().allow('').messages(mensajesError),
            direccion: Joi.string().max(200).allow('').messages(mensajesError),
            comuna: Joi.string().max(50).allow('').messages(mensajesError),
            ciudad: Joi.string().max(50).allow('').messages(mensajesError),
            region: Joi.string().max(50).allow('').messages(mensajesError),
            departamento: Joi.string().required().messages(mensajesError),
            cargo: Joi.string().allow('').messages(mensajesError),
            limite_mensual: Joi.number().min(0).allow(null).messages(mensajesError)
        }),

        actualizar: Joi.object({
            rut: Joi.string().messages(mensajesError),
            nombre: Joi.string().min(2).max(50).messages(mensajesError),
            apellido: Joi.string().min(2).max(50).messages(mensajesError),
            email: Joi.string().email().messages(mensajesError),
            telefono: Joi.string().allow('').messages(mensajesError),
            direccion: Joi.string().max(200).allow('').messages(mensajesError),
            comuna: Joi.string().max(50).allow('').messages(mensajesError),
            ciudad: Joi.string().max(50).allow('').messages(mensajesError),
            region: Joi.string().max(50).allow('').messages(mensajesError),
            departamento: Joi.string().messages(mensajesError),
            cargo: Joi.string().allow('').messages(mensajesError)
        }),

        cambiarEstado: Joi.object({
            estado: Joi.string().valid('activo', 'inactivo').required().messages(mensajesError),
            motivo: Joi.when('estado', {
                is: 'inactivo',
                then: Joi.string().required(),
                otherwise: Joi.string().allow('')
            }).messages(mensajesError)
        }),

        actualizarLimite: Joi.object({
            limite_mensual: Joi.number().min(0).required().messages(mensajesError)
        }),

        estadisticasDepartamento: Joi.object({
            fecha_inicio: Joi.date().messages(mensajesError),
            fecha_fin: Joi.date().min(Joi.ref('fecha_inicio')).messages(mensajesError)
        }),

        validarRUT: Joi.object({
            rut: Joi.string().required().messages(mensajesError)
        })
    },

    // Validaciones de movimiento
    movimiento: {
        registrar: Joi.object({
            tipo: Joi.string().valid('entrada', 'salida', 'ajuste', 'devolucion').required().messages(mensajesError),
            producto_id: Joi.number().integer().required().messages(mensajesError),
            cliente_id: Joi.when('tipo', {
                is: 'salida',
                then: Joi.number().integer().required(),
                otherwise: Joi.number().integer().allow(null)
            }).messages(mensajesError),
            proveedor_id: Joi.when('tipo', {
                is: 'entrada',
                then: Joi.number().integer().required(),
                otherwise: Joi.number().integer().allow(null)
            }).messages(mensajesError),
            cantidad: Joi.number().integer().min(1).required().messages(mensajesError),
            precio_unitario: Joi.number().min(0).required().messages(mensajesError),
            numero_documento: Joi.string().allow('').messages(mensajesError),
            motivo: Joi.string().max(200).allow('').messages(mensajesError)
        }),

        anular: Joi.object({
            motivo: Joi.string().required().messages(mensajesError)
        })
    }
};

module.exports = {
    opcionesValidacion,
    validaciones
};

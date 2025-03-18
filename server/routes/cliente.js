'use strict';

const express = require('express');
const router = express.Router();
const clienteController = require('../controllers/clienteController');
const { validarDatos, validarId, validarPaginacion } = require('../middleware/error');
const { validaciones } = require('../utils/validations');
const { verificarPermiso } = require('../middleware/auth');

// Middleware de validación de permisos base
router.use(verificarPermiso('ver_clientes'));

// Listar clientes
router.get('/',
    validarPaginacion,
    clienteController.listar
);

// Obtener cliente específico
router.get('/:id',
    validarId,
    clienteController.obtener
);

// Crear cliente
router.post('/',
    verificarPermiso('crear_clientes'),
    validarDatos(validaciones.cliente.crear),
    clienteController.crear
);

// Actualizar cliente
router.put('/:id',
    validarId,
    verificarPermiso('editar_clientes'),
    validarDatos(validaciones.cliente.actualizar),
    clienteController.actualizar
);

// Eliminar cliente
router.delete('/:id',
    validarId,
    verificarPermiso('eliminar_clientes'),
    clienteController.eliminar
);

// Cambiar estado del cliente
router.patch('/:id/estado',
    validarId,
    verificarPermiso('editar_clientes'),
    validarDatos(validaciones.cliente.cambiarEstado),
    clienteController.cambiarEstado
);

// Actualizar límite mensual
router.patch('/:id/limite',
    validarId,
    verificarPermiso('editar_clientes'),
    validarDatos(validaciones.cliente.actualizarLimite),
    clienteController.actualizarLimite
);

// Obtener historial de movimientos
router.get('/:id/historial',
    validarId,
    validarPaginacion,
    clienteController.obtenerHistorial
);

// Obtener estadísticas por departamento
router.get('/departamento/:departamento/estadisticas',
    validarDatos(validaciones.cliente.estadisticasDepartamento),
    clienteController.obtenerEstadisticasDepartamento
);

// Validar RUT
router.post('/validar-rut',
    validarDatos(validaciones.cliente.validarRUT),
    clienteController.validarRUT
);

// Documentación de la API
/**
 * @api {get} /clientes Listar clientes
 * @apiName ListarClientes
 * @apiGroup Clientes
 * @apiVersion 1.0.0
 * @apiHeader {String} Authorization Token de autenticación
 * 
 * @apiParam {String} [buscar] Término de búsqueda
 * @apiParam {String} [departamento] Filtrar por departamento
 * @apiParam {String} [estado] Filtrar por estado
 * @apiParam {Number} [pagina=1] Número de página
 * @apiParam {Number} [limite=10] Registros por página
 * 
 * @apiSuccess {Boolean} error Indica si hubo un error
 * @apiSuccess {Object} datos Lista de clientes y metadata
 */

/**
 * @api {get} /clientes/:id Obtener cliente
 * @apiName ObtenerCliente
 * @apiGroup Clientes
 * @apiVersion 1.0.0
 * @apiHeader {String} Authorization Token de autenticación
 * 
 * @apiParam {Number} id ID del cliente
 * 
 * @apiSuccess {Boolean} error Indica si hubo un error
 * @apiSuccess {Object} datos Datos del cliente
 */

/**
 * @api {post} /clientes Crear cliente
 * @apiName CrearCliente
 * @apiGroup Clientes
 * @apiVersion 1.0.0
 * @apiHeader {String} Authorization Token de autenticación
 * 
 * @apiParam {String} rut RUT del cliente
 * @apiParam {String} nombre Nombre del cliente
 * @apiParam {String} apellido Apellido del cliente
 * @apiParam {String} email Email del cliente
 * @apiParam {String} [telefono] Teléfono
 * @apiParam {String} [direccion] Dirección
 * @apiParam {String} [comuna] Comuna
 * @apiParam {String} [ciudad] Ciudad
 * @apiParam {String} [region] Región
 * @apiParam {String} departamento Departamento
 * @apiParam {String} [cargo] Cargo
 * @apiParam {Number} [limite_mensual] Límite mensual
 * 
 * @apiSuccess {Boolean} error Indica si hubo un error
 * @apiSuccess {String} mensaje Mensaje de respuesta
 * @apiSuccess {Object} datos Cliente creado
 */

/**
 * @api {put} /clientes/:id Actualizar cliente
 * @apiName ActualizarCliente
 * @apiGroup Clientes
 * @apiVersion 1.0.0
 * @apiHeader {String} Authorization Token de autenticación
 * 
 * @apiParam {Number} id ID del cliente
 * @apiParam {String} [rut] RUT del cliente
 * @apiParam {String} [nombre] Nombre del cliente
 * @apiParam {String} [apellido] Apellido del cliente
 * @apiParam {String} [email] Email del cliente
 * @apiParam {String} [telefono] Teléfono
 * @apiParam {String} [direccion] Dirección
 * @apiParam {String} [comuna] Comuna
 * @apiParam {String} [ciudad] Ciudad
 * @apiParam {String} [region] Región
 * @apiParam {String} [departamento] Departamento
 * @apiParam {String} [cargo] Cargo
 * 
 * @apiSuccess {Boolean} error Indica si hubo un error
 * @apiSuccess {String} mensaje Mensaje de respuesta
 * @apiSuccess {Object} datos Cliente actualizado
 */

/**
 * @api {delete} /clientes/:id Eliminar cliente
 * @apiName EliminarCliente
 * @apiGroup Clientes
 * @apiVersion 1.0.0
 * @apiHeader {String} Authorization Token de autenticación
 * 
 * @apiParam {Number} id ID del cliente
 * 
 * @apiSuccess {Boolean} error Indica si hubo un error
 * @apiSuccess {String} mensaje Mensaje de respuesta
 */

/**
 * @api {patch} /clientes/:id/estado Cambiar estado
 * @apiName CambiarEstado
 * @apiGroup Clientes
 * @apiVersion 1.0.0
 * @apiHeader {String} Authorization Token de autenticación
 * 
 * @apiParam {Number} id ID del cliente
 * @apiParam {String} estado Nuevo estado
 * @apiParam {String} [motivo] Motivo del cambio
 * 
 * @apiSuccess {Boolean} error Indica si hubo un error
 * @apiSuccess {String} mensaje Mensaje de respuesta
 * @apiSuccess {Object} datos Cliente actualizado
 */

/**
 * @api {patch} /clientes/:id/limite Actualizar límite
 * @apiName ActualizarLimite
 * @apiGroup Clientes
 * @apiVersion 1.0.0
 * @apiHeader {String} Authorization Token de autenticación
 * 
 * @apiParam {Number} id ID del cliente
 * @apiParam {Number} limite_mensual Nuevo límite mensual
 * 
 * @apiSuccess {Boolean} error Indica si hubo un error
 * @apiSuccess {String} mensaje Mensaje de respuesta
 * @apiSuccess {Object} datos Resultado de la actualización
 */

/**
 * @api {get} /clientes/:id/historial Obtener historial
 * @apiName ObtenerHistorial
 * @apiGroup Clientes
 * @apiVersion 1.0.0
 * @apiHeader {String} Authorization Token de autenticación
 * 
 * @apiParam {Number} id ID del cliente
 * @apiParam {Number} [pagina=1] Número de página
 * @apiParam {Number} [limite=10] Registros por página
 * 
 * @apiSuccess {Boolean} error Indica si hubo un error
 * @apiSuccess {Object} datos Historial de movimientos
 */

/**
 * @api {get} /clientes/departamento/:departamento/estadisticas Estadísticas por departamento
 * @apiName EstadisticasDepartamento
 * @apiGroup Clientes
 * @apiVersion 1.0.0
 * @apiHeader {String} Authorization Token de autenticación
 * 
 * @apiParam {String} departamento Nombre del departamento
 * @apiParam {String} [fecha_inicio] Fecha inicial
 * @apiParam {String} [fecha_fin] Fecha final
 * 
 * @apiSuccess {Boolean} error Indica si hubo un error
 * @apiSuccess {Object} datos Estadísticas del departamento
 */

/**
 * @api {post} /clientes/validar-rut Validar RUT
 * @apiName ValidarRUT
 * @apiGroup Clientes
 * @apiVersion 1.0.0
 * @apiHeader {String} Authorization Token de autenticación
 * 
 * @apiParam {String} rut RUT a validar
 * 
 * @apiSuccess {Boolean} error Indica si hubo un error
 * @apiSuccess {Object} datos Resultado de la validación
 */

module.exports = router;

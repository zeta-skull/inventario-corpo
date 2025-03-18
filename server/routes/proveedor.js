'use strict';

const express = require('express');
const router = express.Router();
const proveedorController = require('../controllers/proveedorController');
const { validarDatos, validarId, validarPaginacion } = require('../middleware/error');
const { validaciones } = require('../utils/validations');
const { verificarPermiso } = require('../middleware/auth');
const { upload, procesarImagen } = require('../middleware/upload');

// Middleware de validación de permisos base
router.use(verificarPermiso('ver_proveedores'));

// Listar proveedores
router.get('/',
    validarPaginacion,
    proveedorController.listar
);

// Obtener proveedor específico
router.get('/:id',
    validarId,
    proveedorController.obtener
);

// Crear proveedor
router.post('/',
    verificarPermiso('crear_proveedores'),
    upload.proveedor.single('logo_proveedor'),
    procesarImagen({ width: 400, height: 400, quality: 80 }),
    validarDatos(validaciones.proveedor.crear),
    proveedorController.crear
);

// Actualizar proveedor
router.put('/:id',
    validarId,
    verificarPermiso('editar_proveedores'),
    upload.proveedor.single('logo_proveedor'),
    procesarImagen({ width: 400, height: 400, quality: 80 }),
    validarDatos(validaciones.proveedor.actualizar),
    proveedorController.actualizar
);

// Eliminar proveedor
router.delete('/:id',
    validarId,
    verificarPermiso('eliminar_proveedores'),
    proveedorController.eliminar
);

// Cambiar estado del proveedor
router.patch('/:id/estado',
    validarId,
    verificarPermiso('editar_proveedores'),
    validarDatos(validaciones.proveedor.cambiarEstado),
    proveedorController.cambiarEstado
);

// Obtener productos de un proveedor
router.get('/:id/productos',
    validarId,
    validarPaginacion,
    proveedorController.obtenerProductos
);

// Obtener historial de movimientos
router.get('/:id/historial',
    validarId,
    validarPaginacion,
    proveedorController.obtenerHistorial
);

// Validar RUT
router.post('/validar-rut',
    validarDatos(validaciones.proveedor.validarRUT),
    proveedorController.validarRUT
);

// Documentación de la API
/**
 * @api {get} /proveedores Listar proveedores
 * @apiName ListarProveedores
 * @apiGroup Proveedores
 * @apiVersion 1.0.0
 * @apiHeader {String} Authorization Token de autenticación
 * 
 * @apiParam {String} [buscar] Término de búsqueda
 * @apiParam {String} [estado] Filtrar por estado
 * @apiParam {Number} [pagina=1] Número de página
 * @apiParam {Number} [limite=10] Registros por página
 * 
 * @apiSuccess {Boolean} error Indica si hubo un error
 * @apiSuccess {Object} datos Lista de proveedores y metadata
 */

/**
 * @api {get} /proveedores/:id Obtener proveedor
 * @apiName ObtenerProveedor
 * @apiGroup Proveedores
 * @apiVersion 1.0.0
 * @apiHeader {String} Authorization Token de autenticación
 * 
 * @apiParam {Number} id ID del proveedor
 * 
 * @apiSuccess {Boolean} error Indica si hubo un error
 * @apiSuccess {Object} datos Datos del proveedor
 */

/**
 * @api {post} /proveedores Crear proveedor
 * @apiName CrearProveedor
 * @apiGroup Proveedores
 * @apiVersion 1.0.0
 * @apiHeader {String} Authorization Token de autenticación
 * 
 * @apiParam {String} rut RUT del proveedor
 * @apiParam {String} razon_social Razón social
 * @apiParam {String} nombre_contacto Nombre del contacto
 * @apiParam {String} email Email del proveedor
 * @apiParam {String} [telefono] Teléfono
 * @apiParam {String} [direccion] Dirección
 * @apiParam {String} [comuna] Comuna
 * @apiParam {String} [ciudad] Ciudad
 * @apiParam {String} [region] Región
 * @apiParam {File} [logo_proveedor] Logo del proveedor
 * @apiParam {String} [sitio_web] Sitio web
 * @apiParam {String} [condiciones_pago] Condiciones de pago
 * 
 * @apiSuccess {Boolean} error Indica si hubo un error
 * @apiSuccess {String} mensaje Mensaje de respuesta
 * @apiSuccess {Object} datos Proveedor creado
 */

/**
 * @api {put} /proveedores/:id Actualizar proveedor
 * @apiName ActualizarProveedor
 * @apiGroup Proveedores
 * @apiVersion 1.0.0
 * @apiHeader {String} Authorization Token de autenticación
 * 
 * @apiParam {Number} id ID del proveedor
 * @apiParam {String} [rut] RUT del proveedor
 * @apiParam {String} [razon_social] Razón social
 * @apiParam {String} [nombre_contacto] Nombre del contacto
 * @apiParam {String} [email] Email del proveedor
 * @apiParam {String} [telefono] Teléfono
 * @apiParam {String} [direccion] Dirección
 * @apiParam {String} [comuna] Comuna
 * @apiParam {String} [ciudad] Ciudad
 * @apiParam {String} [region] Región
 * @apiParam {File} [logo_proveedor] Logo del proveedor
 * @apiParam {String} [sitio_web] Sitio web
 * @apiParam {String} [condiciones_pago] Condiciones de pago
 * 
 * @apiSuccess {Boolean} error Indica si hubo un error
 * @apiSuccess {String} mensaje Mensaje de respuesta
 * @apiSuccess {Object} datos Proveedor actualizado
 */

/**
 * @api {delete} /proveedores/:id Eliminar proveedor
 * @apiName EliminarProveedor
 * @apiGroup Proveedores
 * @apiVersion 1.0.0
 * @apiHeader {String} Authorization Token de autenticación
 * 
 * @apiParam {Number} id ID del proveedor
 * 
 * @apiSuccess {Boolean} error Indica si hubo un error
 * @apiSuccess {String} mensaje Mensaje de respuesta
 */

/**
 * @api {patch} /proveedores/:id/estado Cambiar estado
 * @apiName CambiarEstado
 * @apiGroup Proveedores
 * @apiVersion 1.0.0
 * @apiHeader {String} Authorization Token de autenticación
 * 
 * @apiParam {Number} id ID del proveedor
 * @apiParam {String} estado Nuevo estado
 * @apiParam {String} [motivo] Motivo del cambio
 * 
 * @apiSuccess {Boolean} error Indica si hubo un error
 * @apiSuccess {String} mensaje Mensaje de respuesta
 * @apiSuccess {Object} datos Proveedor actualizado
 */

/**
 * @api {get} /proveedores/:id/productos Obtener productos
 * @apiName ObtenerProductos
 * @apiGroup Proveedores
 * @apiVersion 1.0.0
 * @apiHeader {String} Authorization Token de autenticación
 * 
 * @apiParam {Number} id ID del proveedor
 * @apiParam {Number} [pagina=1] Número de página
 * @apiParam {Number} [limite=10] Registros por página
 * 
 * @apiSuccess {Boolean} error Indica si hubo un error
 * @apiSuccess {Object} datos Lista de productos y metadata
 */

/**
 * @api {get} /proveedores/:id/historial Obtener historial
 * @apiName ObtenerHistorial
 * @apiGroup Proveedores
 * @apiVersion 1.0.0
 * @apiHeader {String} Authorization Token de autenticación
 * 
 * @apiParam {Number} id ID del proveedor
 * @apiParam {Number} [pagina=1] Número de página
 * @apiParam {Number} [limite=10] Registros por página
 * 
 * @apiSuccess {Boolean} error Indica si hubo un error
 * @apiSuccess {Object} datos Historial de movimientos
 */

/**
 * @api {post} /proveedores/validar-rut Validar RUT
 * @apiName ValidarRUT
 * @apiGroup Proveedores
 * @apiVersion 1.0.0
 * @apiHeader {String} Authorization Token de autenticación
 * 
 * @apiParam {String} rut RUT a validar
 * 
 * @apiSuccess {Boolean} error Indica si hubo un error
 * @apiSuccess {Object} datos Resultado de la validación
 */

module.exports = router;

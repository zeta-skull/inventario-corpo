'use strict';

const express = require('express');
const router = express.Router();
const productoController = require('../controllers/productoController');
const { validarDatos, validarId, validarPaginacion } = require('../middleware/error');
const { validaciones } = require('../utils/validations');
const { verificarPermiso } = require('../middleware/auth');
const { upload, procesarImagen } = require('../middleware/upload');
const { verificarStock } = require('../middleware/auth');

// Middleware de validación de permisos base
router.use(verificarPermiso('ver_productos'));

// Listar productos
router.get('/',
    validarPaginacion,
    productoController.listar
);

// Obtener producto específico
router.get('/:id',
    validarId,
    productoController.obtener
);

// Crear producto
router.post('/',
    verificarPermiso('crear_productos'),
    upload.producto.single('imagen_producto'),
    procesarImagen({ width: 800, height: 800, quality: 80 }),
    validarDatos(validaciones.producto.crear),
    productoController.crear
);

// Actualizar producto
router.put('/:id',
    validarId,
    verificarPermiso('editar_productos'),
    upload.producto.single('imagen_producto'),
    procesarImagen({ width: 800, height: 800, quality: 80 }),
    validarDatos(validaciones.producto.actualizar),
    productoController.actualizar
);

// Eliminar producto
router.delete('/:id',
    validarId,
    verificarPermiso('eliminar_productos'),
    productoController.eliminar
);

// Cambiar estado del producto
router.patch('/:id/estado',
    validarId,
    verificarPermiso('editar_productos'),
    validarDatos(validaciones.producto.cambiarEstado),
    productoController.cambiarEstado
);

// Exportar a Excel
router.get('/exportar/excel',
    verificarPermiso('exportar_reportes'),
    productoController.exportarExcel
);

// Exportar a PDF
router.get('/exportar/pdf',
    verificarPermiso('exportar_reportes'),
    productoController.exportarPDF
);

// Carga masiva de productos
router.post('/carga-masiva',
    verificarPermiso('crear_productos'),
    upload.cargaMasiva,
    validarDatos(validaciones.producto.cargaMasiva),
    productoController.cargaMasiva
);

// Documentación de la API
/**
 * @api {get} /productos Listar productos
 * @apiName ListarProductos
 * @apiGroup Productos
 * @apiVersion 1.0.0
 * @apiHeader {String} Authorization Token de autenticación
 * 
 * @apiParam {String} [buscar] Término de búsqueda
 * @apiParam {Number} [categoria_id] Filtrar por categoría
 * @apiParam {Number} [proveedor_id] Filtrar por proveedor
 * @apiParam {String} [estado] Filtrar por estado
 * @apiParam {Boolean} [stock_bajo] Filtrar productos con stock bajo
 * @apiParam {Number} [pagina=1] Número de página
 * @apiParam {Number} [limite=10] Registros por página
 * 
 * @apiSuccess {Boolean} error Indica si hubo un error
 * @apiSuccess {Object} datos Lista de productos y metadata
 */

/**
 * @api {get} /productos/:id Obtener producto
 * @apiName ObtenerProducto
 * @apiGroup Productos
 * @apiVersion 1.0.0
 * @apiHeader {String} Authorization Token de autenticación
 * 
 * @apiParam {Number} id ID del producto
 * 
 * @apiSuccess {Boolean} error Indica si hubo un error
 * @apiSuccess {Object} datos Datos del producto
 */

/**
 * @api {post} /productos Crear producto
 * @apiName CrearProducto
 * @apiGroup Productos
 * @apiVersion 1.0.0
 * @apiHeader {String} Authorization Token de autenticación
 * 
 * @apiParam {String} codigo Código del producto
 * @apiParam {String} nombre Nombre del producto
 * @apiParam {String} descripcion Descripción del producto
 * @apiParam {Number} categoria_id ID de la categoría
 * @apiParam {Number} proveedor_id ID del proveedor
 * @apiParam {Number} precio_compra Precio de compra
 * @apiParam {Number} precio_venta Precio de venta
 * @apiParam {Number} stock Stock inicial
 * @apiParam {Number} stock_minimo Stock mínimo
 * @apiParam {String} ubicacion Ubicación en bodega
 * @apiParam {File} [imagen_producto] Imagen del producto
 * 
 * @apiSuccess {Boolean} error Indica si hubo un error
 * @apiSuccess {String} mensaje Mensaje de respuesta
 * @apiSuccess {Object} datos Producto creado
 */

/**
 * @api {put} /productos/:id Actualizar producto
 * @apiName ActualizarProducto
 * @apiGroup Productos
 * @apiVersion 1.0.0
 * @apiHeader {String} Authorization Token de autenticación
 * 
 * @apiParam {Number} id ID del producto
 * @apiParam {String} [codigo] Código del producto
 * @apiParam {String} [nombre] Nombre del producto
 * @apiParam {String} [descripcion] Descripción del producto
 * @apiParam {Number} [categoria_id] ID de la categoría
 * @apiParam {Number} [proveedor_id] ID del proveedor
 * @apiParam {Number} [precio_compra] Precio de compra
 * @apiParam {Number} [precio_venta] Precio de venta
 * @apiParam {Number} [stock_minimo] Stock mínimo
 * @apiParam {String} [ubicacion] Ubicación en bodega
 * @apiParam {File} [imagen_producto] Imagen del producto
 * 
 * @apiSuccess {Boolean} error Indica si hubo un error
 * @apiSuccess {String} mensaje Mensaje de respuesta
 * @apiSuccess {Object} datos Producto actualizado
 */

/**
 * @api {delete} /productos/:id Eliminar producto
 * @apiName EliminarProducto
 * @apiGroup Productos
 * @apiVersion 1.0.0
 * @apiHeader {String} Authorization Token de autenticación
 * 
 * @apiParam {Number} id ID del producto
 * 
 * @apiSuccess {Boolean} error Indica si hubo un error
 * @apiSuccess {String} mensaje Mensaje de respuesta
 */

/**
 * @api {patch} /productos/:id/estado Cambiar estado
 * @apiName CambiarEstado
 * @apiGroup Productos
 * @apiVersion 1.0.0
 * @apiHeader {String} Authorization Token de autenticación
 * 
 * @apiParam {Number} id ID del producto
 * @apiParam {String} estado Nuevo estado
 * @apiParam {String} [motivo] Motivo del cambio
 * 
 * @apiSuccess {Boolean} error Indica si hubo un error
 * @apiSuccess {String} mensaje Mensaje de respuesta
 * @apiSuccess {Object} datos Producto actualizado
 */

/**
 * @api {get} /productos/exportar/excel Exportar Excel
 * @apiName ExportarExcel
 * @apiGroup Productos
 * @apiVersion 1.0.0
 * @apiHeader {String} Authorization Token de autenticación
 * 
 * @apiSuccess {File} excel Archivo Excel con productos
 */

/**
 * @api {get} /productos/exportar/pdf Exportar PDF
 * @apiName ExportarPDF
 * @apiGroup Productos
 * @apiVersion 1.0.0
 * @apiHeader {String} Authorization Token de autenticación
 * 
 * @apiSuccess {File} pdf Archivo PDF con productos
 */

/**
 * @api {post} /productos/carga-masiva Carga masiva
 * @apiName CargaMasiva
 * @apiGroup Productos
 * @apiVersion 1.0.0
 * @apiHeader {String} Authorization Token de autenticación
 * 
 * @apiParam {File} archivo_csv Archivo CSV con productos
 * 
 * @apiSuccess {Boolean} error Indica si hubo un error
 * @apiSuccess {String} mensaje Mensaje de respuesta
 */

module.exports = router;

'use strict';

const express = require('express');
const router = express.Router();
const movimientoController = require('../controllers/movimientoController');
const { validarDatos, validarId, validarPaginacion } = require('../middleware/error');
const { validaciones } = require('../utils/validations');
const { verificarPermiso } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const { verificarStock, verificarLimiteCliente } = require('../middleware/auth');

// Middleware de validación de permisos base
router.use(verificarPermiso('ver_movimientos'));

// Obtener lista de movimientos
router.get('/',
    validarPaginacion,
    movimientoController.obtenerMovimientos
);

// Obtener movimiento específico
router.get('/:id',
    validarId,
    movimientoController.obtenerMovimiento
);

// Registrar nuevo movimiento
router.post('/',
    verificarPermiso('crear_movimientos'),
    upload.documento.single('archivo_adjunto'),
    validarDatos(validaciones.movimiento.registrar),
    verificarStock,
    verificarLimiteCliente,
    movimientoController.registrarMovimiento
);

// Anular movimiento
router.patch('/:id/anular',
    validarId,
    verificarPermiso('anular_movimientos'),
    validarDatos(validaciones.movimiento.anular),
    movimientoController.anularMovimiento
);

// Exportar a Excel
router.get('/exportar/excel',
    verificarPermiso('exportar_reportes'),
    movimientoController.exportarExcel
);

// Exportar a PDF
router.get('/exportar/pdf',
    verificarPermiso('exportar_reportes'),
    movimientoController.exportarPDF
);

// Obtener estadísticas
router.get('/estadisticas',
    verificarPermiso('exportar_reportes'),
    movimientoController.obtenerEstadisticas
);

// Obtener reporte diario
router.get('/reporte-diario',
    verificarPermiso('exportar_reportes'),
    movimientoController.obtenerReporteDiario
);

// Documentación de la API
/**
 * @api {get} /movimientos Listar movimientos
 * @apiName ListarMovimientos
 * @apiGroup Movimientos
 * @apiVersion 1.0.0
 * @apiHeader {String} Authorization Token de autenticación
 * 
 * @apiParam {String} [tipo] Filtrar por tipo (entrada/salida/ajuste/devolucion)
 * @apiParam {Number} [producto_id] Filtrar por producto
 * @apiParam {Number} [cliente_id] Filtrar por cliente
 * @apiParam {Number} [proveedor_id] Filtrar por proveedor
 * @apiParam {String} [fecha_inicio] Fecha inicial
 * @apiParam {String} [fecha_fin] Fecha final
 * @apiParam {String} [estado] Filtrar por estado
 * @apiParam {Number} [pagina=1] Número de página
 * @apiParam {Number} [limite=10] Registros por página
 * 
 * @apiSuccess {Boolean} error Indica si hubo un error
 * @apiSuccess {Object} datos Lista de movimientos y metadata
 */

/**
 * @api {get} /movimientos/:id Obtener movimiento
 * @apiName ObtenerMovimiento
 * @apiGroup Movimientos
 * @apiVersion 1.0.0
 * @apiHeader {String} Authorization Token de autenticación
 * 
 * @apiParam {Number} id ID del movimiento
 * 
 * @apiSuccess {Boolean} error Indica si hubo un error
 * @apiSuccess {Object} datos Datos del movimiento
 */

/**
 * @api {post} /movimientos Registrar movimiento
 * @apiName RegistrarMovimiento
 * @apiGroup Movimientos
 * @apiVersion 1.0.0
 * @apiHeader {String} Authorization Token de autenticación
 * 
 * @apiParam {String} tipo Tipo de movimiento (entrada/salida/ajuste/devolucion)
 * @apiParam {Number} producto_id ID del producto
 * @apiParam {Number} [cliente_id] ID del cliente (requerido para salidas)
 * @apiParam {Number} [proveedor_id] ID del proveedor (requerido para entradas)
 * @apiParam {Number} cantidad Cantidad de productos
 * @apiParam {Number} precio_unitario Precio unitario
 * @apiParam {String} [numero_documento] Número de documento
 * @apiParam {File} [archivo_adjunto] Documento adjunto
 * @apiParam {String} [motivo] Motivo del movimiento
 * 
 * @apiSuccess {Boolean} error Indica si hubo un error
 * @apiSuccess {String} mensaje Mensaje de respuesta
 * @apiSuccess {Object} datos Movimiento registrado
 */

/**
 * @api {patch} /movimientos/:id/anular Anular movimiento
 * @apiName AnularMovimiento
 * @apiGroup Movimientos
 * @apiVersion 1.0.0
 * @apiHeader {String} Authorization Token de autenticación
 * 
 * @apiParam {Number} id ID del movimiento
 * @apiParam {String} motivo Motivo de la anulación
 * 
 * @apiSuccess {Boolean} error Indica si hubo un error
 * @apiSuccess {String} mensaje Mensaje de respuesta
 * @apiSuccess {Object} datos Detalles de la anulación
 */

/**
 * @api {get} /movimientos/exportar/excel Exportar Excel
 * @apiName ExportarExcel
 * @apiGroup Movimientos
 * @apiVersion 1.0.0
 * @apiHeader {String} Authorization Token de autenticación
 * 
 * @apiParam {String} [fecha_inicio] Fecha inicial
 * @apiParam {String} [fecha_fin] Fecha final
 * 
 * @apiSuccess {File} excel Archivo Excel con movimientos
 */

/**
 * @api {get} /movimientos/exportar/pdf Exportar PDF
 * @apiName ExportarPDF
 * @apiGroup Movimientos
 * @apiVersion 1.0.0
 * @apiHeader {String} Authorization Token de autenticación
 * 
 * @apiParam {String} [fecha_inicio] Fecha inicial
 * @apiParam {String} [fecha_fin] Fecha final
 * 
 * @apiSuccess {File} pdf Archivo PDF con movimientos
 */

/**
 * @api {get} /movimientos/estadisticas Obtener estadísticas
 * @apiName ObtenerEstadisticas
 * @apiGroup Movimientos
 * @apiVersion 1.0.0
 * @apiHeader {String} Authorization Token de autenticación
 * 
 * @apiParam {String} [fecha_inicio] Fecha inicial
 * @apiParam {String} [fecha_fin] Fecha final
 * 
 * @apiSuccess {Boolean} error Indica si hubo un error
 * @apiSuccess {Object} datos Estadísticas de movimientos
 */

/**
 * @api {get} /movimientos/reporte-diario Obtener reporte diario
 * @apiName ObtenerReporteDiario
 * @apiGroup Movimientos
 * @apiVersion 1.0.0
 * @apiHeader {String} Authorization Token de autenticación
 * 
 * @apiSuccess {Boolean} error Indica si hubo un error
 * @apiSuccess {Object} datos Reporte diario de movimientos
 */

module.exports = router;

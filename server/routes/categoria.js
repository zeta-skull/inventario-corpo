'use strict';

const express = require('express');
const router = express.Router();
const categoriaController = require('../controllers/categoriaController');
const { validarDatos, validarId, validarPaginacion } = require('../middleware/error');
const { validaciones } = require('../utils/validations');
const { verificarPermiso } = require('../middleware/auth');

// Middleware de validación de permisos base
router.use(verificarPermiso('ver_categorias'));

// Listar categorías
router.get('/',
    validarPaginacion,
    categoriaController.listar
);

// Obtener categoría específica
router.get('/:id',
    validarId,
    categoriaController.obtener
);

// Crear categoría
router.post('/',
    verificarPermiso('crear_categorias'),
    validarDatos(validaciones.categoria.crear),
    categoriaController.crear
);

// Actualizar categoría
router.put('/:id',
    validarId,
    verificarPermiso('editar_categorias'),
    validarDatos(validaciones.categoria.actualizar),
    categoriaController.actualizar
);

// Eliminar categoría
router.delete('/:id',
    validarId,
    verificarPermiso('eliminar_categorias'),
    categoriaController.eliminar
);

// Actualizar orden de categorías
router.patch('/orden',
    verificarPermiso('editar_categorias'),
    validarDatos(validaciones.categoria.actualizarOrdenes),
    categoriaController.actualizarOrdenes
);

// Cambiar estado de categoría
router.patch('/:id/estado',
    validarId,
    verificarPermiso('editar_categorias'),
    validarDatos(validaciones.categoria.cambiarEstado),
    categoriaController.cambiarEstado
);

// Obtener productos de una categoría
router.get('/:id/productos',
    validarId,
    validarPaginacion,
    categoriaController.obtenerProductos
);

// Obtener productos con stock bajo por categoría
router.get('/:id/productos-stock-bajo',
    validarId,
    categoriaController.obtenerProductosStockBajo
);

// Documentación de la API
/**
 * @api {get} /categorias Listar categorías
 * @apiName ListarCategorias
 * @apiGroup Categorías
 * @apiVersion 1.0.0
 * @apiHeader {String} Authorization Token de autenticación
 * 
 * @apiParam {String} [buscar] Término de búsqueda
 * @apiParam {String} [estado] Filtrar por estado
 * @apiParam {Number} [pagina=1] Número de página
 * @apiParam {Number} [limite=10] Registros por página
 * 
 * @apiSuccess {Boolean} error Indica si hubo un error
 * @apiSuccess {Object} datos Lista de categorías y metadata
 */

/**
 * @api {get} /categorias/:id Obtener categoría
 * @apiName ObtenerCategoria
 * @apiGroup Categorías
 * @apiVersion 1.0.0
 * @apiHeader {String} Authorization Token de autenticación
 * 
 * @apiParam {Number} id ID de la categoría
 * 
 * @apiSuccess {Boolean} error Indica si hubo un error
 * @apiSuccess {Object} datos Datos de la categoría
 */

/**
 * @api {post} /categorias Crear categoría
 * @apiName CrearCategoria
 * @apiGroup Categorías
 * @apiVersion 1.0.0
 * @apiHeader {String} Authorization Token de autenticación
 * 
 * @apiParam {String} nombre Nombre de la categoría
 * @apiParam {String} [descripcion] Descripción de la categoría
 * @apiParam {String} [color] Color en formato hexadecimal
 * @apiParam {Number} [orden] Orden de visualización
 * 
 * @apiSuccess {Boolean} error Indica si hubo un error
 * @apiSuccess {String} mensaje Mensaje de respuesta
 * @apiSuccess {Object} datos Categoría creada
 */

/**
 * @api {put} /categorias/:id Actualizar categoría
 * @apiName ActualizarCategoria
 * @apiGroup Categorías
 * @apiVersion 1.0.0
 * @apiHeader {String} Authorization Token de autenticación
 * 
 * @apiParam {Number} id ID de la categoría
 * @apiParam {String} [nombre] Nombre de la categoría
 * @apiParam {String} [descripcion] Descripción de la categoría
 * @apiParam {String} [color] Color en formato hexadecimal
 * @apiParam {Number} [orden] Orden de visualización
 * 
 * @apiSuccess {Boolean} error Indica si hubo un error
 * @apiSuccess {String} mensaje Mensaje de respuesta
 * @apiSuccess {Object} datos Categoría actualizada
 */

/**
 * @api {delete} /categorias/:id Eliminar categoría
 * @apiName EliminarCategoria
 * @apiGroup Categorías
 * @apiVersion 1.0.0
 * @apiHeader {String} Authorization Token de autenticación
 * 
 * @apiParam {Number} id ID de la categoría
 * 
 * @apiSuccess {Boolean} error Indica si hubo un error
 * @apiSuccess {String} mensaje Mensaje de respuesta
 */

/**
 * @api {patch} /categorias/orden Actualizar orden
 * @apiName ActualizarOrden
 * @apiGroup Categorías
 * @apiVersion 1.0.0
 * @apiHeader {String} Authorization Token de autenticación
 * 
 * @apiParam {Array} ordenes Lista de objetos {id, orden}
 * 
 * @apiSuccess {Boolean} error Indica si hubo un error
 * @apiSuccess {String} mensaje Mensaje de respuesta
 */

/**
 * @api {patch} /categorias/:id/estado Cambiar estado
 * @apiName CambiarEstado
 * @apiGroup Categorías
 * @apiVersion 1.0.0
 * @apiHeader {String} Authorization Token de autenticación
 * 
 * @apiParam {Number} id ID de la categoría
 * @apiParam {String} estado Nuevo estado
 * 
 * @apiSuccess {Boolean} error Indica si hubo un error
 * @apiSuccess {String} mensaje Mensaje de respuesta
 * @apiSuccess {Object} datos Categoría actualizada
 */

/**
 * @api {get} /categorias/:id/productos Obtener productos
 * @apiName ObtenerProductos
 * @apiGroup Categorías
 * @apiVersion 1.0.0
 * @apiHeader {String} Authorization Token de autenticación
 * 
 * @apiParam {Number} id ID de la categoría
 * @apiParam {Number} [pagina=1] Número de página
 * @apiParam {Number} [limite=10] Registros por página
 * 
 * @apiSuccess {Boolean} error Indica si hubo un error
 * @apiSuccess {Object} datos Lista de productos y metadata
 */

/**
 * @api {get} /categorias/:id/productos-stock-bajo Obtener productos con stock bajo
 * @apiName ObtenerProductosStockBajo
 * @apiGroup Categorías
 * @apiVersion 1.0.0
 * @apiHeader {String} Authorization Token de autenticación
 * 
 * @apiParam {Number} id ID de la categoría
 * 
 * @apiSuccess {Boolean} error Indica si hubo un error
 * @apiSuccess {Object} datos Lista de productos con stock bajo
 */

module.exports = router;

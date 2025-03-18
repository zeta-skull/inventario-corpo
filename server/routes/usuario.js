'use strict';

const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');
const { validarDatos, validarId, validarPaginacion } = require('../middleware/error');
const { validaciones } = require('../utils/validations');
const { verificarRol, verificarPermiso } = require('../middleware/auth');
const { upload, procesarImagen } = require('../middleware/upload');

// Middleware de validación de permisos
router.use(verificarPermiso('ver_usuarios'));

// Listar usuarios
router.get('/',
    validarPaginacion,
    usuarioController.listar
);

// Obtener usuario específico
router.get('/:id',
    validarId,
    usuarioController.obtener
);

// Crear usuario (solo admin)
router.post('/',
    verificarRol('admin'),
    upload.perfil.single('imagen_perfil'),
    procesarImagen({ width: 200, height: 200, quality: 80 }),
    validarDatos(validaciones.usuario.crear),
    usuarioController.crear
);

// Actualizar usuario
router.put('/:id',
    validarId,
    verificarRol('admin'),
    upload.perfil.single('imagen_perfil'),
    procesarImagen({ width: 200, height: 200, quality: 80 }),
    validarDatos(validaciones.usuario.actualizar),
    usuarioController.actualizar
);

// Eliminar usuario (solo admin)
router.delete('/:id',
    validarId,
    verificarRol('admin'),
    usuarioController.eliminar
);

// Actualizar rol (solo admin)
router.patch('/:id/rol',
    validarId,
    verificarRol('admin'),
    validarDatos(validaciones.usuario.actualizarRol),
    usuarioController.actualizarRol
);

// Cambiar estado (activar/desactivar) (solo admin)
router.patch('/:id/estado',
    validarId,
    verificarRol('admin'),
    validarDatos(validaciones.usuario.cambiarEstado),
    usuarioController.cambiarEstado
);

// Obtener historial de movimientos
router.get('/:id/historial',
    validarId,
    validarPaginacion,
    usuarioController.obtenerHistorial
);

// Documentación de la API
/**
 * @api {get} /usuarios Listar usuarios
 * @apiName ListarUsuarios
 * @apiGroup Usuarios
 * @apiVersion 1.0.0
 * @apiHeader {String} Authorization Token de autenticación
 * 
 * @apiParam {String} [buscar] Término de búsqueda
 * @apiParam {String} [rol] Filtrar por rol
 * @apiParam {Boolean} [activo] Filtrar por estado
 * @apiParam {Number} [pagina=1] Número de página
 * @apiParam {Number} [limite=10] Registros por página
 * 
 * @apiSuccess {Boolean} error Indica si hubo un error
 * @apiSuccess {Object} datos Lista de usuarios y metadata
 */

/**
 * @api {get} /usuarios/:id Obtener usuario
 * @apiName ObtenerUsuario
 * @apiGroup Usuarios
 * @apiVersion 1.0.0
 * @apiHeader {String} Authorization Token de autenticación
 * 
 * @apiParam {Number} id ID del usuario
 * 
 * @apiSuccess {Boolean} error Indica si hubo un error
 * @apiSuccess {Object} datos Datos del usuario
 */

/**
 * @api {post} /usuarios Crear usuario
 * @apiName CrearUsuario
 * @apiGroup Usuarios
 * @apiVersion 1.0.0
 * @apiHeader {String} Authorization Token de autenticación
 * 
 * @apiParam {String} nombre Nombre del usuario
 * @apiParam {String} apellido Apellido del usuario
 * @apiParam {String} email Email del usuario
 * @apiParam {String} password Contraseña del usuario
 * @apiParam {String} rol Rol del usuario
 * @apiParam {File} [imagen_perfil] Imagen de perfil
 * 
 * @apiSuccess {Boolean} error Indica si hubo un error
 * @apiSuccess {String} mensaje Mensaje de respuesta
 * @apiSuccess {Object} datos Usuario creado
 */

/**
 * @api {put} /usuarios/:id Actualizar usuario
 * @apiName ActualizarUsuario
 * @apiGroup Usuarios
 * @apiVersion 1.0.0
 * @apiHeader {String} Authorization Token de autenticación
 * 
 * @apiParam {Number} id ID del usuario
 * @apiParam {String} [nombre] Nombre del usuario
 * @apiParam {String} [apellido] Apellido del usuario
 * @apiParam {String} [email] Email del usuario
 * @apiParam {File} [imagen_perfil] Imagen de perfil
 * 
 * @apiSuccess {Boolean} error Indica si hubo un error
 * @apiSuccess {String} mensaje Mensaje de respuesta
 * @apiSuccess {Object} datos Usuario actualizado
 */

/**
 * @api {delete} /usuarios/:id Eliminar usuario
 * @apiName EliminarUsuario
 * @apiGroup Usuarios
 * @apiVersion 1.0.0
 * @apiHeader {String} Authorization Token de autenticación
 * 
 * @apiParam {Number} id ID del usuario
 * 
 * @apiSuccess {Boolean} error Indica si hubo un error
 * @apiSuccess {String} mensaje Mensaje de respuesta
 */

/**
 * @api {patch} /usuarios/:id/rol Actualizar rol
 * @apiName ActualizarRol
 * @apiGroup Usuarios
 * @apiVersion 1.0.0
 * @apiHeader {String} Authorization Token de autenticación
 * 
 * @apiParam {Number} id ID del usuario
 * @apiParam {String} rol Nuevo rol
 * 
 * @apiSuccess {Boolean} error Indica si hubo un error
 * @apiSuccess {String} mensaje Mensaje de respuesta
 * @apiSuccess {Object} datos Usuario actualizado
 */

/**
 * @api {patch} /usuarios/:id/estado Cambiar estado
 * @apiName CambiarEstado
 * @apiGroup Usuarios
 * @apiVersion 1.0.0
 * @apiHeader {String} Authorization Token de autenticación
 * 
 * @apiParam {Number} id ID del usuario
 * @apiParam {Boolean} activo Nuevo estado
 * @apiParam {String} [motivo] Motivo de inactivación
 * 
 * @apiSuccess {Boolean} error Indica si hubo un error
 * @apiSuccess {String} mensaje Mensaje de respuesta
 * @apiSuccess {Object} datos Usuario actualizado
 */

/**
 * @api {get} /usuarios/:id/historial Obtener historial
 * @apiName ObtenerHistorial
 * @apiGroup Usuarios
 * @apiVersion 1.0.0
 * @apiHeader {String} Authorization Token de autenticación
 * 
 * @apiParam {Number} id ID del usuario
 * @apiParam {Number} [pagina=1] Número de página
 * @apiParam {Number} [limite=10] Registros por página
 * 
 * @apiSuccess {Boolean} error Indica si hubo un error
 * @apiSuccess {Object} datos Historial de movimientos
 */

module.exports = router;

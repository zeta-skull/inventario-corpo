'use strict';

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validarDatos } = require('../middleware/error');
const { validaciones } = require('../utils/validations');
const { verificarToken } = require('../middleware/auth');

// Rutas públicas
router.post('/login', 
    validarDatos(validaciones.auth.login),
    authController.login
);

router.post('/recuperar-password',
    validarDatos(validaciones.auth.recuperarPassword),
    authController.recuperarPassword
);

router.post('/restablecer-password',
    validarDatos(validaciones.auth.restablecerPassword),
    authController.restablecerPassword
);

// Rutas protegidas
router.use(verificarToken);

router.get('/perfil',
    authController.perfil
);

router.post('/cambiar-password',
    validarDatos(validaciones.auth.cambiarPassword),
    authController.cambiarPassword
);

router.patch('/tema',
    validarDatos(validaciones.auth.actualizarTema),
    authController.actualizarTema
);

router.get('/verificar-token',
    authController.verificarToken
);

// Documentación de la API
/**
 * @api {post} /auth/login Iniciar sesión
 * @apiName Login
 * @apiGroup Autenticación
 * @apiVersion 1.0.0
 * 
 * @apiParam {String} email Email del usuario
 * @apiParam {String} password Contraseña del usuario
 * 
 * @apiSuccess {Boolean} error Indica si hubo un error
 * @apiSuccess {String} mensaje Mensaje de respuesta
 * @apiSuccess {Object} datos Datos del usuario y token
 * 
 * @apiError {Boolean} error Indica si hubo un error
 * @apiError {String} mensaje Mensaje de error
 */

/**
 * @api {post} /auth/recuperar-password Solicitar recuperación de contraseña
 * @apiName RecuperarPassword
 * @apiGroup Autenticación
 * @apiVersion 1.0.0
 * 
 * @apiParam {String} email Email del usuario
 * 
 * @apiSuccess {Boolean} error Indica si hubo un error
 * @apiSuccess {String} mensaje Mensaje de respuesta
 */

/**
 * @api {post} /auth/restablecer-password Restablecer contraseña
 * @apiName RestablecerPassword
 * @apiGroup Autenticación
 * @apiVersion 1.0.0
 * 
 * @apiParam {String} token Token de recuperación
 * @apiParam {String} password Nueva contraseña
 * 
 * @apiSuccess {Boolean} error Indica si hubo un error
 * @apiSuccess {String} mensaje Mensaje de respuesta
 */

/**
 * @api {get} /auth/perfil Obtener perfil del usuario
 * @apiName ObtenerPerfil
 * @apiGroup Autenticación
 * @apiVersion 1.0.0
 * @apiHeader {String} Authorization Token de autenticación
 * 
 * @apiSuccess {Boolean} error Indica si hubo un error
 * @apiSuccess {Object} datos Datos del usuario
 */

/**
 * @api {post} /auth/cambiar-password Cambiar contraseña
 * @apiName CambiarPassword
 * @apiGroup Autenticación
 * @apiVersion 1.0.0
 * @apiHeader {String} Authorization Token de autenticación
 * 
 * @apiParam {String} password_actual Contraseña actual
 * @apiParam {String} password_nueva Nueva contraseña
 * 
 * @apiSuccess {Boolean} error Indica si hubo un error
 * @apiSuccess {String} mensaje Mensaje de respuesta
 */

/**
 * @api {patch} /auth/tema Actualizar tema
 * @apiName ActualizarTema
 * @apiGroup Autenticación
 * @apiVersion 1.0.0
 * @apiHeader {String} Authorization Token de autenticación
 * 
 * @apiParam {String} tema Tema preferido (light/dark)
 * 
 * @apiSuccess {Boolean} error Indica si hubo un error
 * @apiSuccess {String} mensaje Mensaje de respuesta
 * @apiSuccess {Object} datos Datos actualizados
 */

/**
 * @api {get} /auth/verificar-token Verificar token
 * @apiName VerificarToken
 * @apiGroup Autenticación
 * @apiVersion 1.0.0
 * @apiHeader {String} Authorization Token de autenticación
 * 
 * @apiSuccess {Boolean} error Indica si hubo un error
 * @apiSuccess {Object} datos Estado del token y datos del usuario
 */

module.exports = router;

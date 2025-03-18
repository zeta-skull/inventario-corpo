'use strict';

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Usuario } = require('../models');
const { ErrorOperacional } = require('../middleware/error');
const { plantillasCorreo } = require('../utils/mailer');

// Generar token JWT
const generarToken = (usuario) => {
    return jwt.sign(
        { 
            id: usuario.id,
            email: usuario.email,
            rol: usuario.rol
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
    );
};

const authController = {
    // Iniciar sesión
    login: async (req, res, next) => {
        try {
            const { email, password } = req.body;

            // Buscar usuario
            const usuario = await Usuario.findOne({ where: { email } });
            if (!usuario) {
                throw new ErrorOperacional('Credenciales inválidas', 401);
            }

            // Verificar estado
            if (!usuario.activo) {
                throw new ErrorOperacional('Usuario inactivo. Contacte al administrador', 401);
            }

            // Verificar contraseña
            const passwordValida = await usuario.validarPassword(password);
            if (!passwordValida) {
                throw new ErrorOperacional('Credenciales inválidas', 401);
            }

            // Actualizar último login
            await usuario.registrarLogin();

            // Generar token
            const token = generarToken(usuario);

            res.json({
                error: false,
                mensaje: 'Inicio de sesión exitoso',
                datos: {
                    token,
                    usuario: {
                        id: usuario.id,
                        nombre: usuario.nombre,
                        apellido: usuario.apellido,
                        email: usuario.email,
                        rol: usuario.rol,
                        tema_preferido: usuario.tema_preferido,
                        permisos: usuario.obtenerPermisos()
                    }
                }
            });
        } catch (error) {
            next(error);
        }
    },

    // Solicitar recuperación de contraseña
    recuperarPassword: async (req, res, next) => {
        try {
            const { email } = req.body;

            // Buscar usuario
            const usuario = await Usuario.findOne({ where: { email } });
            if (!usuario || !usuario.activo) {
                throw new ErrorOperacional('Si el correo existe, recibirá las instrucciones', 200);
            }

            // Generar token de recuperación
            const token = usuario.generarTokenRecuperacion();
            await usuario.save();

            // Enviar correo
            await plantillasCorreo.recuperacionPassword(usuario, token);

            res.json({
                error: false,
                mensaje: 'Si el correo existe, recibirá las instrucciones'
            });
        } catch (error) {
            next(error);
        }
    },

    // Restablecer contraseña
    restablecerPassword: async (req, res, next) => {
        try {
            const { token, password } = req.body;

            // Buscar usuario con token válido
            const usuario = await Usuario.findOne({
                where: {
                    token_recuperacion: token,
                    token_expiracion: { [Op.gt]: new Date() }
                }
            });

            if (!usuario) {
                throw new ErrorOperacional('Token inválido o expirado', 400);
            }

            // Actualizar contraseña
            usuario.password = password;
            usuario.token_recuperacion = null;
            usuario.token_expiracion = null;
            await usuario.save();

            // Enviar correo de confirmación
            await plantillasCorreo.cambioPassword(usuario);

            res.json({
                error: false,
                mensaje: 'Contraseña actualizada correctamente'
            });
        } catch (error) {
            next(error);
        }
    },

    // Cambiar contraseña (usuario autenticado)
    cambiarPassword: async (req, res, next) => {
        try {
            const { password_actual, password_nueva } = req.body;
            const usuario = req.usuario;

            // Verificar contraseña actual
            const passwordValida = await usuario.validarPassword(password_actual);
            if (!passwordValida) {
                throw new ErrorOperacional('Contraseña actual incorrecta', 400);
            }

            // Actualizar contraseña
            usuario.password = password_nueva;
            await usuario.save();

            // Enviar correo de confirmación
            await plantillasCorreo.cambioPassword(usuario);

            res.json({
                error: false,
                mensaje: 'Contraseña actualizada correctamente'
            });
        } catch (error) {
            next(error);
        }
    },

    // Obtener perfil del usuario actual
    perfil: async (req, res, next) => {
        try {
            const usuario = await Usuario.findByPk(req.usuario.id, {
                attributes: { exclude: ['password', 'token_recuperacion', 'token_expiracion'] }
            });

            res.json({
                error: false,
                datos: {
                    ...usuario.toJSON(),
                    permisos: usuario.obtenerPermisos()
                }
            });
        } catch (error) {
            next(error);
        }
    },

    // Actualizar tema preferido
    actualizarTema: async (req, res, next) => {
        try {
            const { tema } = req.body;
            const usuario = req.usuario;

            usuario.tema_preferido = tema;
            await usuario.save();

            res.json({
                error: false,
                mensaje: 'Tema actualizado correctamente',
                datos: {
                    tema_preferido: tema
                }
            });
        } catch (error) {
            next(error);
        }
    },

    // Verificar token
    verificarToken: async (req, res, next) => {
        try {
            const usuario = await Usuario.findByPk(req.usuario.id);
            
            res.json({
                error: false,
                datos: {
                    token_valido: true,
                    usuario: {
                        id: usuario.id,
                        nombre: usuario.nombre,
                        apellido: usuario.apellido,
                        email: usuario.email,
                        rol: usuario.rol,
                        tema_preferido: usuario.tema_preferido,
                        permisos: usuario.obtenerPermisos()
                    }
                }
            });
        } catch (error) {
            next(error);
        }
    }
};

module.exports = authController;

'use strict';

const { Op } = require('sequelize');
const { Usuario, Movimiento } = require('../models');
const { ErrorOperacional } = require('../middleware/error');
const { eliminarArchivo } = require('../middleware/upload');
const { plantillasCorreo } = require('../utils/mailer');
const path = require('path');

const usuarioController = {
    // Obtener lista de usuarios
    listar: async (req, res, next) => {
        try {
            const {
                buscar,
                rol,
                activo,
                ordenar_por = 'apellido',
                orden = 'ASC'
            } = req.query;

            const where = {};

            // Filtros
            if (buscar) {
                where[Op.or] = [
                    { nombre: { [Op.like]: `%${buscar}%` } },
                    { apellido: { [Op.like]: `%${buscar}%` } },
                    { email: { [Op.like]: `%${buscar}%` } }
                ];
            }
            if (rol) where.rol = rol;
            if (activo !== undefined) where.activo = activo === 'true';

            const usuarios = await Usuario.findAndCountAll({
                where,
                attributes: { exclude: ['password', 'token_recuperacion', 'token_expiracion'] },
                include: [{
                    model: Movimiento,
                    as: 'movimientos_registrados',
                    attributes: ['id'],
                    required: false
                }],
                order: [[ordenar_por, orden]],
                ...req.paginacion
            });

            // Transformar resultados para incluir conteo de movimientos
            const usuariosFormateados = usuarios.rows.map(usuario => ({
                ...usuario.toJSON(),
                total_movimientos: usuario.movimientos_registrados.length,
                permisos: usuario.obtenerPermisos()
            }));

            res.json({
                error: false,
                datos: {
                    usuarios: usuariosFormateados,
                    total: usuarios.count,
                    pagina: req.paginacion.pagina,
                    limite: req.paginacion.limite,
                    total_paginas: Math.ceil(usuarios.count / req.paginacion.limite)
                }
            });
        } catch (error) {
            next(error);
        }
    },

    // Obtener un usuario específico
    obtener: async (req, res, next) => {
        try {
            const usuario = await Usuario.findByPk(req.params.id, {
                attributes: { exclude: ['password', 'token_recuperacion', 'token_expiracion'] }
            });

            if (!usuario) {
                throw new ErrorOperacional('Usuario no encontrado', 404);
            }

            // Obtener estadísticas
            const stats = await usuario.obtenerEstadisticas();

            res.json({
                error: false,
                datos: {
                    ...usuario.toJSON(),
                    permisos: usuario.obtenerPermisos(),
                    estadisticas: stats
                }
            });
        } catch (error) {
            next(error);
        }
    },

    // Crear nuevo usuario
    crear: async (req, res, next) => {
        try {
            // Verificar si ya existe un usuario con el mismo email
            const existente = await Usuario.findOne({
                where: { email: req.body.email }
            });

            if (existente) {
                throw new ErrorOperacional('Ya existe un usuario con este email', 400);
            }

            const usuario = await Usuario.create(req.body);

            // Si se subió una imagen de perfil
            if (req.file) {
                usuario.imagen_perfil = req.file.filename;
                await usuario.save();
            }

            // Enviar correo de bienvenida
            await plantillasCorreo.bienvenidaUsuario(usuario, req.body.password);

            res.status(201).json({
                error: false,
                mensaje: 'Usuario creado correctamente',
                datos: {
                    ...usuario.toJSON(),
                    permisos: usuario.obtenerPermisos()
                }
            });
        } catch (error) {
            // Si hubo error y se subió imagen, eliminarla
            if (req.file) {
                eliminarArchivo(req.file.path);
            }
            next(error);
        }
    },

    // Actualizar usuario
    actualizar: async (req, res, next) => {
        try {
            const usuario = await Usuario.findByPk(req.params.id);
            if (!usuario) {
                throw new ErrorOperacional('Usuario no encontrado', 404);
            }

            // Si se está actualizando el email, verificar que no exista
            if (req.body.email && req.body.email !== usuario.email) {
                const existente = await Usuario.findOne({
                    where: {
                        email: req.body.email,
                        id: { [Op.ne]: usuario.id }
                    }
                });

                if (existente) {
                    throw new ErrorOperacional('Ya existe un usuario con este email', 400);
                }
            }

            // Si se subió una nueva imagen, eliminar la anterior
            if (req.file) {
                if (usuario.imagen_perfil) {
                    eliminarArchivo(path.join(__dirname, '..', '..', 'uploads', 'usuarios', usuario.imagen_perfil));
                }
                req.body.imagen_perfil = req.file.filename;
            }

            await usuario.update(req.body);

            res.json({
                error: false,
                mensaje: 'Usuario actualizado correctamente',
                datos: {
                    ...usuario.toJSON(),
                    permisos: usuario.obtenerPermisos()
                }
            });
        } catch (error) {
            // Si hubo error y se subió imagen, eliminarla
            if (req.file) {
                eliminarArchivo(req.file.path);
            }
            next(error);
        }
    },

    // Eliminar usuario
    eliminar: async (req, res, next) => {
        try {
            const usuario = await Usuario.findByPk(req.params.id);
            if (!usuario) {
                throw new ErrorOperacional('Usuario no encontrado', 404);
            }

            // Verificar si tiene movimientos
            const tieneMovimientos = await Movimiento.count({
                where: { usuario_id: usuario.id }
            });

            if (tieneMovimientos > 0) {
                // Si tiene movimientos, solo inactivar
                await usuario.update({
                    activo: false,
                    motivo_inactivacion: 'Eliminado por administrador'
                });

                res.json({
                    error: false,
                    mensaje: 'Usuario inactivado correctamente'
                });
            } else {
                // Si no tiene movimientos, eliminar físicamente
                if (usuario.imagen_perfil) {
                    eliminarArchivo(path.join(__dirname, '..', '..', 'uploads', 'usuarios', usuario.imagen_perfil));
                }
                await usuario.destroy();

                res.json({
                    error: false,
                    mensaje: 'Usuario eliminado correctamente'
                });
            }
        } catch (error) {
            next(error);
        }
    },

    // Actualizar rol
    actualizarRol: async (req, res, next) => {
        try {
            const usuario = await Usuario.findByPk(req.params.id);
            if (!usuario) {
                throw new ErrorOperacional('Usuario no encontrado', 404);
            }

            await usuario.update({ rol: req.body.rol });

            res.json({
                error: false,
                mensaje: 'Rol actualizado correctamente',
                datos: {
                    ...usuario.toJSON(),
                    permisos: usuario.obtenerPermisos()
                }
            });
        } catch (error) {
            next(error);
        }
    },

    // Cambiar estado (activar/desactivar)
    cambiarEstado: async (req, res, next) => {
        try {
            const usuario = await Usuario.findByPk(req.params.id);
            if (!usuario) {
                throw new ErrorOperacional('Usuario no encontrado', 404);
            }

            await usuario.update({
                activo: req.body.activo,
                motivo_inactivacion: !req.body.activo ? req.body.motivo : null
            });

            res.json({
                error: false,
                mensaje: `Usuario ${req.body.activo ? 'activado' : 'desactivado'} correctamente`,
                datos: usuario
            });
        } catch (error) {
            next(error);
        }
    },

    // Obtener historial de movimientos
    obtenerHistorial: async (req, res, next) => {
        try {
            const usuario = await Usuario.findByPk(req.params.id);
            if (!usuario) {
                throw new ErrorOperacional('Usuario no encontrado', 404);
            }

            const movimientos = await Movimiento.findAndCountAll({
                where: { usuario_id: usuario.id },
                include: [
                    {
                        model: Producto,
                        as: 'producto',
                        include: ['categoria']
                    },
                    {
                        model: Cliente,
                        as: 'cliente',
                        attributes: ['id', 'nombre', 'apellido', 'departamento']
                    },
                    {
                        model: Proveedor,
                        as: 'proveedor',
                        attributes: ['id', 'razon_social']
                    }
                ],
                order: [['fecha_creacion', 'DESC']],
                ...req.paginacion
            });

            res.json({
                error: false,
                datos: {
                    movimientos: movimientos.rows,
                    total: movimientos.count,
                    pagina: req.paginacion.pagina,
                    limite: req.paginacion.limite,
                    total_paginas: Math.ceil(movimientos.count / req.paginacion.limite)
                }
            });
        } catch (error) {
            next(error);
        }
    }
};

module.exports = usuarioController;

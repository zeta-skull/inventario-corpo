'use strict';

const { Op } = require('sequelize');
const { Cliente, Movimiento } = require('../models');
const { ErrorOperacional } = require('../middleware/error');
const { validarRUT } = require('../utils/helpers');
const { plantillasCorreo } = require('../utils/mailer');

const clienteController = {
    // Obtener lista de clientes
    listar: async (req, res, next) => {
        try {
            const {
                buscar,
                departamento,
                estado,
                ordenar_por = 'apellido',
                orden = 'ASC'
            } = req.query;

            const where = {};

            // Filtros
            if (buscar) {
                where[Op.or] = [
                    { rut: { [Op.like]: `%${buscar}%` } },
                    { nombre: { [Op.like]: `%${buscar}%` } },
                    { apellido: { [Op.like]: `%${buscar}%` } },
                    { email: { [Op.like]: `%${buscar}%` } }
                ];
            }
            if (departamento) where.departamento = departamento;
            if (estado) where.estado = estado;

            const clientes = await Cliente.findAndCountAll({
                where,
                include: [{
                    model: Movimiento,
                    as: 'movimientos',
                    attributes: ['id'],
                    where: { estado: 'completado' },
                    required: false
                }],
                order: [[ordenar_por, orden]],
                ...req.paginacion
            });

            // Transformar resultados para incluir conteo de movimientos
            const clientesFormateados = clientes.rows.map(cliente => ({
                ...cliente.toJSON(),
                total_movimientos: cliente.movimientos.length
            }));

            res.json({
                error: false,
                datos: {
                    clientes: clientesFormateados,
                    total: clientes.count,
                    pagina: req.paginacion.pagina,
                    limite: req.paginacion.limite,
                    total_paginas: Math.ceil(clientes.count / req.paginacion.limite)
                }
            });
        } catch (error) {
            next(error);
        }
    },

    // Obtener un cliente específico
    obtener: async (req, res, next) => {
        try {
            const cliente = await Cliente.findByPk(req.params.id);
            if (!cliente) {
                throw new ErrorOperacional('Cliente no encontrado', 404);
            }

            // Obtener estadísticas
            const stats = await cliente.obtenerEstadisticas();

            res.json({
                error: false,
                datos: {
                    ...cliente.toJSON(),
                    estadisticas: stats
                }
            });
        } catch (error) {
            next(error);
        }
    },

    // Crear nuevo cliente
    crear: async (req, res, next) => {
        try {
            // Validar RUT
            if (!validarRUT(req.body.rut)) {
                throw new ErrorOperacional('RUT inválido', 400);
            }

            // Verificar si ya existe un cliente con el mismo RUT
            const existente = await Cliente.findOne({
                where: { rut: req.body.rut }
            });

            if (existente) {
                throw new ErrorOperacional('Ya existe un cliente con este RUT', 400);
            }

            const cliente = await Cliente.create(req.body);

            // Enviar correo de bienvenida
            await plantillasCorreo.bienvenidaCliente(cliente);

            res.status(201).json({
                error: false,
                mensaje: 'Cliente creado correctamente',
                datos: cliente
            });
        } catch (error) {
            next(error);
        }
    },

    // Actualizar cliente
    actualizar: async (req, res, next) => {
        try {
            const cliente = await Cliente.findByPk(req.params.id);
            if (!cliente) {
                throw new ErrorOperacional('Cliente no encontrado', 404);
            }

            // Si se está actualizando el RUT, validarlo
            if (req.body.rut && req.body.rut !== cliente.rut) {
                if (!validarRUT(req.body.rut)) {
                    throw new ErrorOperacional('RUT inválido', 400);
                }

                const existente = await Cliente.findOne({
                    where: {
                        rut: req.body.rut,
                        id: { [Op.ne]: cliente.id }
                    }
                });

                if (existente) {
                    throw new ErrorOperacional('Ya existe un cliente con este RUT', 400);
                }
            }

            await cliente.update(req.body);

            res.json({
                error: false,
                mensaje: 'Cliente actualizado correctamente',
                datos: cliente
            });
        } catch (error) {
            next(error);
        }
    },

    // Eliminar cliente
    eliminar: async (req, res, next) => {
        try {
            const cliente = await Cliente.findByPk(req.params.id);
            if (!cliente) {
                throw new ErrorOperacional('Cliente no encontrado', 404);
            }

            // Verificar si tiene movimientos
            const tieneMovimientos = await Movimiento.count({
                where: { cliente_id: cliente.id }
            });

            if (tieneMovimientos > 0) {
                // Si tiene movimientos, solo inactivar
                await cliente.update({
                    estado: 'inactivo',
                    motivo_inactivacion: 'Eliminado por administrador'
                });

                res.json({
                    error: false,
                    mensaje: 'Cliente inactivado correctamente'
                });
            } else {
                // Si no tiene movimientos, eliminar físicamente
                await cliente.destroy();

                res.json({
                    error: false,
                    mensaje: 'Cliente eliminado correctamente'
                });
            }
        } catch (error) {
            next(error);
        }
    },

    // Cambiar estado del cliente
    cambiarEstado: async (req, res, next) => {
        try {
            const cliente = await Cliente.findByPk(req.params.id);
            if (!cliente) {
                throw new ErrorOperacional('Cliente no encontrado', 404);
            }

            await cliente.update({
                estado: req.body.estado,
                motivo_inactivacion: req.body.motivo
            });

            res.json({
                error: false,
                mensaje: 'Estado del cliente actualizado correctamente',
                datos: cliente
            });
        } catch (error) {
            next(error);
        }
    },

    // Actualizar límite mensual
    actualizarLimite: async (req, res, next) => {
        try {
            const cliente = await Cliente.findByPk(req.params.id);
            if (!cliente) {
                throw new ErrorOperacional('Cliente no encontrado', 404);
            }

            const resultado = await cliente.actualizarLimiteMensual(req.body.limite_mensual);

            res.json({
                error: false,
                mensaje: 'Límite mensual actualizado correctamente',
                datos: resultado
            });
        } catch (error) {
            next(error);
        }
    },

    // Obtener historial de movimientos
    obtenerHistorial: async (req, res, next) => {
        try {
            const cliente = await Cliente.findByPk(req.params.id);
            if (!cliente) {
                throw new ErrorOperacional('Cliente no encontrado', 404);
            }

            const historial = await cliente.obtenerHistorialMovimientos(req.paginacion);

            res.json({
                error: false,
                datos: {
                    movimientos: historial.rows,
                    total: historial.count,
                    pagina: req.paginacion.pagina,
                    limite: req.paginacion.limite,
                    total_paginas: Math.ceil(historial.count / req.paginacion.limite)
                }
            });
        } catch (error) {
            next(error);
        }
    },

    // Obtener estadísticas por departamento
    obtenerEstadisticasDepartamento: async (req, res, next) => {
        try {
            const { departamento } = req.params;
            const { fecha_inicio, fecha_fin } = req.query;

            const where = {
                departamento,
                estado: 'activo'
            };

            const clientes = await Cliente.findAll({
                where,
                include: [{
                    model: Movimiento,
                    as: 'movimientos',
                    where: {
                        estado: 'completado',
                        fecha_creacion: {
                            [Op.between]: [
                                fecha_inicio || new Date(new Date().setMonth(new Date().getMonth() - 1)),
                                fecha_fin || new Date()
                            ]
                        }
                    }
                }]
            });

            const stats = {
                total_clientes: clientes.length,
                total_movimientos: 0,
                total_productos: 0,
                valor_total: 0
            };

            clientes.forEach(cliente => {
                cliente.movimientos.forEach(mov => {
                    stats.total_movimientos++;
                    stats.total_productos += mov.cantidad;
                    stats.valor_total += mov.total;
                });
            });

            res.json({
                error: false,
                datos: stats
            });
        } catch (error) {
            next(error);
        }
    },

    // Validar RUT
    validarRUT: async (req, res, next) => {
        try {
            const { rut } = req.body;

            if (!validarRUT(rut)) {
                throw new ErrorOperacional('RUT inválido', 400);
            }

            const existente = await Cliente.findOne({ where: { rut } });

            res.json({
                error: false,
                datos: {
                    valido: true,
                    disponible: !existente
                }
            });
        } catch (error) {
            next(error);
        }
    }
};

module.exports = clienteController;

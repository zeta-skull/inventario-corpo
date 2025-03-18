'use strict';

const { Op } = require('sequelize');
const { Proveedor, Producto, Movimiento } = require('../models');
const { ErrorOperacional } = require('../middleware/error');
const { eliminarArchivo } = require('../middleware/upload');
const { validarRUT } = require('../utils/helpers');
const path = require('path');

const proveedorController = {
    // Obtener lista de proveedores
    listar: async (req, res, next) => {
        try {
            const {
                buscar,
                estado,
                ordenar_por = 'razon_social',
                orden = 'ASC'
            } = req.query;

            const where = {};

            // Filtros
            if (buscar) {
                where[Op.or] = [
                    { rut: { [Op.like]: `%${buscar}%` } },
                    { razon_social: { [Op.like]: `%${buscar}%` } },
                    { nombre_contacto: { [Op.like]: `%${buscar}%` } },
                    { email: { [Op.like]: `%${buscar}%` } }
                ];
            }
            if (estado) where.estado = estado;

            const proveedores = await Proveedor.findAndCountAll({
                where,
                include: [{
                    model: Producto,
                    as: 'productos',
                    attributes: ['id'],
                    where: { estado: 'activo' },
                    required: false
                }],
                order: [[ordenar_por, orden]],
                ...req.paginacion
            });

            // Transformar resultados para incluir conteo de productos
            const proveedoresFormateados = proveedores.rows.map(proveedor => ({
                ...proveedor.toJSON(),
                total_productos: proveedor.productos.length
            }));

            res.json({
                error: false,
                datos: {
                    proveedores: proveedoresFormateados,
                    total: proveedores.count,
                    pagina: req.paginacion.pagina,
                    limite: req.paginacion.limite,
                    total_paginas: Math.ceil(proveedores.count / req.paginacion.limite)
                }
            });
        } catch (error) {
            next(error);
        }
    },

    // Obtener un proveedor específico
    obtener: async (req, res, next) => {
        try {
            const proveedor = await Proveedor.findByPk(req.params.id, {
                include: [{
                    model: Producto,
                    as: 'productos',
                    where: { estado: 'activo' },
                    required: false,
                    include: ['categoria']
                }]
            });

            if (!proveedor) {
                throw new ErrorOperacional('Proveedor no encontrado', 404);
            }

            // Obtener estadísticas
            const stats = await proveedor.obtenerEstadisticas();

            res.json({
                error: false,
                datos: {
                    ...proveedor.toJSON(),
                    estadisticas: stats
                }
            });
        } catch (error) {
            next(error);
        }
    },

    // Crear nuevo proveedor
    crear: async (req, res, next) => {
        try {
            // Validar RUT
            if (!validarRUT(req.body.rut)) {
                throw new ErrorOperacional('RUT inválido', 400);
            }

            // Verificar si ya existe un proveedor con el mismo RUT
            const existente = await Proveedor.findOne({
                where: { rut: req.body.rut }
            });

            if (existente) {
                throw new ErrorOperacional('Ya existe un proveedor con este RUT', 400);
            }

            const proveedor = await Proveedor.create(req.body);

            // Si se subió un logo
            if (req.file) {
                proveedor.logo = req.file.filename;
                await proveedor.save();
            }

            res.status(201).json({
                error: false,
                mensaje: 'Proveedor creado correctamente',
                datos: proveedor
            });
        } catch (error) {
            // Si hubo error y se subió logo, eliminarlo
            if (req.file) {
                eliminarArchivo(req.file.path);
            }
            next(error);
        }
    },

    // Actualizar proveedor
    actualizar: async (req, res, next) => {
        try {
            const proveedor = await Proveedor.findByPk(req.params.id);
            if (!proveedor) {
                throw new ErrorOperacional('Proveedor no encontrado', 404);
            }

            // Si se está actualizando el RUT, validarlo
            if (req.body.rut && req.body.rut !== proveedor.rut) {
                if (!validarRUT(req.body.rut)) {
                    throw new ErrorOperacional('RUT inválido', 400);
                }

                const existente = await Proveedor.findOne({
                    where: {
                        rut: req.body.rut,
                        id: { [Op.ne]: proveedor.id }
                    }
                });

                if (existente) {
                    throw new ErrorOperacional('Ya existe un proveedor con este RUT', 400);
                }
            }

            // Si se subió un nuevo logo, eliminar el anterior
            if (req.file) {
                if (proveedor.logo) {
                    eliminarArchivo(path.join(__dirname, '..', '..', 'uploads', 'proveedores', proveedor.logo));
                }
                req.body.logo = req.file.filename;
            }

            await proveedor.update(req.body);

            res.json({
                error: false,
                mensaje: 'Proveedor actualizado correctamente',
                datos: proveedor
            });
        } catch (error) {
            // Si hubo error y se subió logo, eliminarlo
            if (req.file) {
                eliminarArchivo(req.file.path);
            }
            next(error);
        }
    },

    // Eliminar proveedor
    eliminar: async (req, res, next) => {
        try {
            const proveedor = await Proveedor.findByPk(req.params.id);
            if (!proveedor) {
                throw new ErrorOperacional('Proveedor no encontrado', 404);
            }

            // Verificar si se puede eliminar
            const sePuedeEliminar = await proveedor.sePuedeEliminar();
            if (!sePuedeEliminar) {
                throw new ErrorOperacional('No se puede eliminar el proveedor porque tiene productos o movimientos asociados', 400);
            }

            // Eliminar logo si existe
            if (proveedor.logo) {
                eliminarArchivo(path.join(__dirname, '..', '..', 'uploads', 'proveedores', proveedor.logo));
            }

            await proveedor.destroy();

            res.json({
                error: false,
                mensaje: 'Proveedor eliminado correctamente'
            });
        } catch (error) {
            next(error);
        }
    },

    // Cambiar estado del proveedor
    cambiarEstado: async (req, res, next) => {
        try {
            const proveedor = await Proveedor.findByPk(req.params.id);
            if (!proveedor) {
                throw new ErrorOperacional('Proveedor no encontrado', 404);
            }

            await proveedor.update({
                estado: req.body.estado,
                motivo_inactivacion: req.body.motivo
            });

            res.json({
                error: false,
                mensaje: 'Estado del proveedor actualizado correctamente',
                datos: proveedor
            });
        } catch (error) {
            next(error);
        }
    },

    // Obtener productos de un proveedor
    obtenerProductos: async (req, res, next) => {
        try {
            const productos = await Producto.findAndCountAll({
                where: {
                    proveedor_id: req.params.id,
                    estado: 'activo'
                },
                include: ['categoria'],
                ...req.paginacion
            });

            res.json({
                error: false,
                datos: {
                    productos: productos.rows,
                    total: productos.count,
                    pagina: req.paginacion.pagina,
                    limite: req.paginacion.limite,
                    total_paginas: Math.ceil(productos.count / req.paginacion.limite)
                }
            });
        } catch (error) {
            next(error);
        }
    },

    // Obtener historial de movimientos
    obtenerHistorial: async (req, res, next) => {
        try {
            const proveedor = await Proveedor.findByPk(req.params.id);
            if (!proveedor) {
                throw new ErrorOperacional('Proveedor no encontrado', 404);
            }

            const historial = await proveedor.obtenerHistorialMovimientos(req.paginacion);

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

    // Validar RUT
    validarRUT: async (req, res, next) => {
        try {
            const { rut } = req.body;

            if (!validarRUT(rut)) {
                throw new ErrorOperacional('RUT inválido', 400);
            }

            const existente = await Proveedor.findOne({ where: { rut } });

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

module.exports = proveedorController;

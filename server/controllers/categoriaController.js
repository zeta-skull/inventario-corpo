'use strict';

const { Op } = require('sequelize');
const { Categoria, Producto } = require('../models');
const { ErrorOperacional } = require('../middleware/error');

const categoriaController = {
    // Obtener todas las categorías
    listar: async (req, res, next) => {
        try {
            const { 
                buscar,
                estado,
                ordenar_por = 'orden',
                orden = 'ASC'
            } = req.query;

            const where = {};
            
            // Filtros
            if (buscar) {
                where[Op.or] = [
                    { nombre: { [Op.like]: `%${buscar}%` } },
                    { descripcion: { [Op.like]: `%${buscar}%` } }
                ];
            }
            if (estado) where.estado = estado;

            const categorias = await Categoria.findAndCountAll({
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
            const categoriasFormateadas = categorias.rows.map(categoria => ({
                ...categoria.toJSON(),
                total_productos: categoria.productos.length
            }));

            res.json({
                error: false,
                datos: {
                    categorias: categoriasFormateadas,
                    total: categorias.count,
                    pagina: req.paginacion.pagina,
                    limite: req.paginacion.limite,
                    total_paginas: Math.ceil(categorias.count / req.paginacion.limite)
                }
            });
        } catch (error) {
            next(error);
        }
    },

    // Obtener una categoría específica
    obtener: async (req, res, next) => {
        try {
            const categoria = await Categoria.findByPk(req.params.id, {
                include: [{
                    model: Producto,
                    as: 'productos',
                    where: { estado: 'activo' },
                    required: false
                }]
            });

            if (!categoria) {
                throw new ErrorOperacional('Categoría no encontrada', 404);
            }

            // Obtener estadísticas
            const stats = await categoria.obtenerEstadisticas();

            res.json({
                error: false,
                datos: {
                    ...categoria.toJSON(),
                    estadisticas: stats
                }
            });
        } catch (error) {
            next(error);
        }
    },

    // Crear nueva categoría
    crear: async (req, res, next) => {
        try {
            // Verificar si ya existe una categoría con el mismo nombre
            const existente = await Categoria.findOne({
                where: {
                    nombre: req.body.nombre
                }
            });

            if (existente) {
                throw new ErrorOperacional('Ya existe una categoría con este nombre', 400);
            }

            // Obtener siguiente orden si no se especificó
            if (!req.body.orden) {
                req.body.orden = await Categoria.obtenerSiguienteOrden();
            }

            const categoria = await Categoria.create(req.body);

            res.status(201).json({
                error: false,
                mensaje: 'Categoría creada correctamente',
                datos: categoria
            });
        } catch (error) {
            next(error);
        }
    },

    // Actualizar categoría
    actualizar: async (req, res, next) => {
        try {
            const categoria = await Categoria.findByPk(req.params.id);
            if (!categoria) {
                throw new ErrorOperacional('Categoría no encontrada', 404);
            }

            // Verificar nombre duplicado si se está actualizando
            if (req.body.nombre && req.body.nombre !== categoria.nombre) {
                const existente = await Categoria.findOne({
                    where: {
                        nombre: req.body.nombre,
                        id: { [Op.ne]: categoria.id }
                    }
                });

                if (existente) {
                    throw new ErrorOperacional('Ya existe una categoría con este nombre', 400);
                }
            }

            await categoria.update(req.body);

            res.json({
                error: false,
                mensaje: 'Categoría actualizada correctamente',
                datos: categoria
            });
        } catch (error) {
            next(error);
        }
    },

    // Eliminar categoría
    eliminar: async (req, res, next) => {
        try {
            const categoria = await Categoria.findByPk(req.params.id);
            if (!categoria) {
                throw new ErrorOperacional('Categoría no encontrada', 404);
            }

            // Verificar si se puede eliminar
            const sePuedeEliminar = await categoria.sePuedeEliminar();
            if (!sePuedeEliminar) {
                throw new ErrorOperacional('No se puede eliminar la categoría porque tiene productos asociados', 400);
            }

            await categoria.destroy();

            res.json({
                error: false,
                mensaje: 'Categoría eliminada correctamente'
            });
        } catch (error) {
            next(error);
        }
    },

    // Actualizar orden de categorías
    actualizarOrdenes: async (req, res, next) => {
        try {
            const { ordenes } = req.body;

            await Categoria.actualizarOrdenes(ordenes);

            res.json({
                error: false,
                mensaje: 'Orden de categorías actualizado correctamente'
            });
        } catch (error) {
            next(error);
        }
    },

    // Cambiar estado de categoría
    cambiarEstado: async (req, res, next) => {
        try {
            const categoria = await Categoria.findByPk(req.params.id);
            if (!categoria) {
                throw new ErrorOperacional('Categoría no encontrada', 404);
            }

            await categoria.update({
                estado: req.body.estado
            });

            res.json({
                error: false,
                mensaje: 'Estado de la categoría actualizado correctamente',
                datos: categoria
            });
        } catch (error) {
            next(error);
        }
    },

    // Obtener productos de una categoría
    obtenerProductos: async (req, res, next) => {
        try {
            const categoria = await Categoria.findByPk(req.params.id);
            if (!categoria) {
                throw new ErrorOperacional('Categoría no encontrada', 404);
            }

            const productos = await Producto.findAndCountAll({
                where: {
                    categoria_id: categoria.id,
                    estado: 'activo'
                },
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

    // Obtener productos con stock bajo por categoría
    obtenerProductosStockBajo: async (req, res, next) => {
        try {
            const categoria = await Categoria.findByPk(req.params.id);
            if (!categoria) {
                throw new ErrorOperacional('Categoría no encontrada', 404);
            }

            const productosStockBajo = await categoria.obtenerProductosStockBajo();

            res.json({
                error: false,
                datos: productosStockBajo
            });
        } catch (error) {
            next(error);
        }
    }
};

module.exports = categoriaController;

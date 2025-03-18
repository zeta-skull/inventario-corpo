'use strict';

const { Op } = require('sequelize');
const { Movimiento, Producto, Usuario, Cliente, Proveedor, sequelize } = require('../models');
const { ErrorOperacional } = require('../middleware/error');
const { eliminarArchivo } = require('../middleware/upload');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit-table');
const { plantillasCorreo } = require('../utils/mailer');

const movimientoController = {
    // Obtener lista de movimientos
    obtenerMovimientos: async (req, res, next) => {
        try {
            const {
                tipo,
                producto_id,
                cliente_id,
                proveedor_id,
                fecha_inicio,
                fecha_fin,
                estado,
                ordenar_por = 'fecha_creacion',
                orden = 'DESC'
            } = req.query;

            const where = {};

            // Filtros
            if (tipo) where.tipo = tipo;
            if (producto_id) where.producto_id = producto_id;
            if (cliente_id) where.cliente_id = cliente_id;
            if (proveedor_id) where.proveedor_id = proveedor_id;
            if (estado) where.estado = estado;
            if (fecha_inicio || fecha_fin) {
                where.fecha_creacion = {};
                if (fecha_inicio) where.fecha_creacion[Op.gte] = new Date(fecha_inicio);
                if (fecha_fin) where.fecha_creacion[Op.lte] = new Date(fecha_fin);
            }

            const movimientos = await Movimiento.findAndCountAll({
                where,
                include: [
                    {
                        model: Producto,
                        as: 'producto',
                        include: ['categoria']
                    },
                    {
                        model: Usuario,
                        as: 'usuario_registra',
                        attributes: ['id', 'nombre', 'apellido']
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
                order: [[ordenar_por, orden]],
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
    },

    // Obtener un movimiento específico
    obtenerMovimiento: async (req, res, next) => {
        try {
            const movimiento = await Movimiento.findByPk(req.params.id, {
                include: [
                    {
                        model: Producto,
                        as: 'producto',
                        include: ['categoria']
                    },
                    {
                        model: Usuario,
                        as: 'usuario_registra',
                        attributes: ['id', 'nombre', 'apellido']
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
                ]
            });

            if (!movimiento) {
                throw new ErrorOperacional('Movimiento no encontrado', 404);
            }

            res.json({
                error: false,
                datos: movimiento
            });
        } catch (error) {
            next(error);
        }
    },

    // Registrar nuevo movimiento
    registrarMovimiento: async (req, res, next) => {
        const transaction = await sequelize.transaction();
        try {
            const movimiento = await Movimiento.registrar(req.body, req.usuario, transaction);

            // Si se subió un documento
            if (req.file) {
                movimiento.archivo_adjunto = req.file.filename;
                await movimiento.save({ transaction });
            }

            await transaction.commit();

            // Notificar si el movimiento es importante (configurable según criterios)
            if (movimiento.total >= 1000000) { // ejemplo: movimientos mayores a 1M
                await plantillasCorreo.movimientoImportante(movimiento);
            }

            res.status(201).json({
                error: false,
                mensaje: 'Movimiento registrado correctamente',
                datos: movimiento
            });
        } catch (error) {
            await transaction.rollback();
            if (req.file) {
                eliminarArchivo(req.file.path);
            }
            next(error);
        }
    },

    // Anular movimiento
    anularMovimiento: async (req, res, next) => {
        const transaction = await sequelize.transaction();
        try {
            const movimiento = await Movimiento.findByPk(req.params.id);
            if (!movimiento) {
                throw new ErrorOperacional('Movimiento no encontrado', 404);
            }

            const compensacion = await movimiento.anular(req.body.motivo, req.usuario, transaction);
            await transaction.commit();

            res.json({
                error: false,
                mensaje: 'Movimiento anulado correctamente',
                datos: {
                    movimiento_anulado: movimiento,
                    movimiento_compensacion: compensacion
                }
            });
        } catch (error) {
            await transaction.rollback();
            next(error);
        }
    },

    // Exportar a Excel
    exportarExcel: async (req, res, next) => {
        try {
            const movimientos = await Movimiento.generarReporte(req.query, 'excel');

            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Movimientos');

            worksheet.columns = [
                { header: 'Fecha', key: 'fecha', width: 20 },
                { header: 'Tipo', key: 'tipo', width: 15 },
                { header: 'N° Documento', key: 'documento', width: 20 },
                { header: 'Producto', key: 'producto', width: 30 },
                { header: 'Cantidad', key: 'cantidad', width: 10 },
                { header: 'Precio Unit.', key: 'precio', width: 15 },
                { header: 'Total', key: 'total', width: 15 },
                { header: 'Usuario', key: 'usuario', width: 30 },
                { header: 'Cliente/Proveedor', key: 'tercero', width: 30 },
                { header: 'Estado', key: 'estado', width: 15 }
            ];

            movimientos.forEach(m => {
                worksheet.addRow({
                    fecha: m.Fecha,
                    tipo: m.Tipo,
                    documento: m['Nº Documento'],
                    producto: m.Producto,
                    cantidad: m.Cantidad,
                    precio: m['Precio Unitario'],
                    total: m.Total,
                    usuario: m.Usuario,
                    tercero: m.Cliente || m.Proveedor,
                    estado: m.Estado
                });
            });

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename=movimientos.xlsx');

            await workbook.xlsx.write(res);
            res.end();
        } catch (error) {
            next(error);
        }
    },

    // Exportar a PDF
    exportarPDF: async (req, res, next) => {
        try {
            const movimientos = await Movimiento.generarReporte(req.query, 'pdf');

            const doc = new PDFDocument();
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename=movimientos.pdf');
            doc.pipe(res);

            // Título
            doc.fontSize(16).text('Reporte de Movimientos', { align: 'center' });
            doc.moveDown();

            // Tabla
            const table = {
                headers: ['Fecha', 'Tipo', 'Producto', 'Cantidad', 'Total', 'Estado'],
                rows: movimientos.map(m => [
                    m.Fecha,
                    m.Tipo,
                    m.Producto,
                    m.Cantidad,
                    m.Total,
                    m.Estado
                ])
            };

            await doc.table(table, {
                prepareHeader: () => doc.font('Helvetica-Bold').fontSize(10),
                prepareRow: () => doc.font('Helvetica').fontSize(10)
            });

            doc.end();
        } catch (error) {
            next(error);
        }
    },

    // Obtener estadísticas
    obtenerEstadisticas: async (req, res, next) => {
        try {
            const { fecha_inicio, fecha_fin } = req.query;
            const stats = await Movimiento.obtenerEstadisticas({
                fecha_creacion: {
                    [Op.between]: [
                        fecha_inicio || new Date(new Date().setMonth(new Date().getMonth() - 1)),
                        fecha_fin || new Date()
                    ]
                }
            });

            res.json({
                error: false,
                datos: stats
            });
        } catch (error) {
            next(error);
        }
    },

    // Obtener reporte diario
    obtenerReporteDiario: async (req, res, next) => {
        try {
            const fecha = new Date();
            fecha.setHours(0, 0, 0, 0);

            const stats = await Movimiento.obtenerEstadisticas({
                fecha_creacion: {
                    [Op.gte]: fecha
                }
            });

            // Enviar reporte por correo
            await plantillasCorreo.reporteDiario(stats);

            res.json({
                error: false,
                datos: stats
            });
        } catch (error) {
            next(error);
        }
    }
};

module.exports = movimientoController;

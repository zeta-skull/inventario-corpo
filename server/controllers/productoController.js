'use strict';

const { Op } = require('sequelize');
const { Producto, Categoria, Proveedor, Movimiento } = require('../models');
const { ErrorOperacional } = require('../middleware/error');
const { eliminarArchivo } = require('../middleware/upload');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit-table');
const path = require('path');

const productoController = {
    // Obtener lista de productos
    listar: async (req, res, next) => {
        try {
            const { 
                buscar,
                categoria_id,
                proveedor_id,
                estado,
                stock_bajo,
                ordenar_por = 'fecha_creacion',
                orden = 'DESC'
            } = req.query;

            const where = {};
            
            // Filtros
            if (buscar) {
                where[Op.or] = [
                    { codigo: { [Op.like]: `%${buscar}%` } },
                    { nombre: { [Op.like]: `%${buscar}%` } },
                    { descripcion: { [Op.like]: `%${buscar}%` } }
                ];
            }
            if (categoria_id) where.categoria_id = categoria_id;
            if (proveedor_id) where.proveedor_id = proveedor_id;
            if (estado) where.estado = estado;
            if (stock_bajo === 'true') {
                where[Op.and] = sequelize.literal('stock <= stock_minimo');
            }

            const productos = await Producto.findAndCountAll({
                where,
                include: [
                    { 
                        model: Categoria,
                        as: 'categoria',
                        attributes: ['id', 'nombre']
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

    // Obtener un producto específico
    obtener: async (req, res, next) => {
        try {
            const producto = await Producto.findByPk(req.params.id, {
                include: [
                    { 
                        model: Categoria,
                        as: 'categoria'
                    },
                    {
                        model: Proveedor,
                        as: 'proveedor'
                    }
                ]
            });

            if (!producto) {
                throw new ErrorOperacional('Producto no encontrado', 404);
            }

            res.json({
                error: false,
                datos: producto
            });
        } catch (error) {
            next(error);
        }
    },

    // Crear nuevo producto
    crear: async (req, res, next) => {
        try {
            const producto = await Producto.create(req.body);

            // Si se subió una imagen
            if (req.file) {
                producto.imagen = req.file.filename;
                await producto.save();
            }

            res.status(201).json({
                error: false,
                mensaje: 'Producto creado correctamente',
                datos: producto
            });
        } catch (error) {
            // Si hubo error y se subió imagen, eliminarla
            if (req.file) {
                eliminarArchivo(req.file.path);
            }
            next(error);
        }
    },

    // Actualizar producto
    actualizar: async (req, res, next) => {
        try {
            const producto = await Producto.findByPk(req.params.id);
            if (!producto) {
                throw new ErrorOperacional('Producto no encontrado', 404);
            }

            // Si se subió una nueva imagen, eliminar la anterior
            if (req.file) {
                if (producto.imagen) {
                    eliminarArchivo(path.join(__dirname, '..', '..', 'uploads', 'productos', producto.imagen));
                }
                req.body.imagen = req.file.filename;
            }

            await producto.update(req.body);

            res.json({
                error: false,
                mensaje: 'Producto actualizado correctamente',
                datos: producto
            });
        } catch (error) {
            // Si hubo error y se subió imagen, eliminarla
            if (req.file) {
                eliminarArchivo(req.file.path);
            }
            next(error);
        }
    },

    // Eliminar producto
    eliminar: async (req, res, next) => {
        try {
            const producto = await Producto.findByPk(req.params.id);
            if (!producto) {
                throw new ErrorOperacional('Producto no encontrado', 404);
            }

            // Verificar si tiene movimientos
            const tieneMovimientos = await Movimiento.count({
                where: { producto_id: producto.id }
            });

            if (tieneMovimientos > 0) {
                // Si tiene movimientos, solo inactivar
                await producto.update({ 
                    estado: 'inactivo',
                    motivo_inactivacion: 'Eliminado por administrador'
                });
            } else {
                // Si no tiene movimientos, eliminar físicamente
                if (producto.imagen) {
                    eliminarArchivo(path.join(__dirname, '..', '..', 'uploads', 'productos', producto.imagen));
                }
                await producto.destroy();
            }

            res.json({
                error: false,
                mensaje: tieneMovimientos > 0 
                    ? 'Producto inactivado correctamente'
                    : 'Producto eliminado correctamente'
            });
        } catch (error) {
            next(error);
        }
    },

    // Cambiar estado del producto
    cambiarEstado: async (req, res, next) => {
        try {
            const { estado, motivo } = req.body;
            const producto = await Producto.findByPk(req.params.id);

            if (!producto) {
                throw new ErrorOperacional('Producto no encontrado', 404);
            }

            await producto.update({
                estado,
                motivo_inactivacion: estado !== 'activo' ? motivo : null
            });

            res.json({
                error: false,
                mensaje: 'Estado del producto actualizado correctamente',
                datos: producto
            });
        } catch (error) {
            next(error);
        }
    },

    // Exportar productos a Excel
    exportarExcel: async (req, res, next) => {
        try {
            const productos = await Producto.findAll({
                include: ['categoria', 'proveedor']
            });

            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Productos');

            worksheet.columns = [
                { header: 'Código', key: 'codigo', width: 15 },
                { header: 'Nombre', key: 'nombre', width: 30 },
                { header: 'Categoría', key: 'categoria', width: 20 },
                { header: 'Proveedor', key: 'proveedor', width: 30 },
                { header: 'Stock', key: 'stock', width: 10 },
                { header: 'Stock Mínimo', key: 'stock_minimo', width: 15 },
                { header: 'Precio Compra', key: 'precio_compra', width: 15 },
                { header: 'Precio Venta', key: 'precio_venta', width: 15 },
                { header: 'Estado', key: 'estado', width: 15 }
            ];

            productos.forEach(producto => {
                worksheet.addRow({
                    codigo: producto.codigo,
                    nombre: producto.nombre,
                    categoria: producto.categoria?.nombre,
                    proveedor: producto.proveedor?.razon_social,
                    stock: producto.stock,
                    stock_minimo: producto.stock_minimo,
                    precio_compra: producto.precio_compra,
                    precio_venta: producto.precio_venta,
                    estado: producto.estado
                });
            });

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename=productos.xlsx');

            await workbook.xlsx.write(res);
            res.end();
        } catch (error) {
            next(error);
        }
    },

    // Exportar productos a PDF
    exportarPDF: async (req, res, next) => {
        try {
            const productos = await Producto.findAll({
                include: ['categoria', 'proveedor']
            });

            const doc = new PDFDocument();
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename=productos.pdf');
            doc.pipe(res);

            // Título
            doc.fontSize(16).text('Reporte de Productos', { align: 'center' });
            doc.moveDown();

            // Tabla
            const table = {
                headers: ['Código', 'Nombre', 'Categoría', 'Stock', 'Precio Venta', 'Estado'],
                rows: productos.map(p => [
                    p.codigo,
                    p.nombre,
                    p.categoria?.nombre,
                    p.stock.toString(),
                    p.precio_venta.toString(),
                    p.estado
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

    // Carga masiva de productos
    cargaMasiva: async (req, res, next) => {
        try {
            if (!req.file) {
                throw new ErrorOperacional('No se proporcionó archivo CSV', 400);
            }

            const workbook = new ExcelJS.Workbook();
            await workbook.csv.readFile(req.file.path);
            const worksheet = workbook.getWorksheet(1);

            const productos = [];
            const errores = [];

            worksheet.eachRow((row, rowNumber) => {
                if (rowNumber === 1) return; // Saltar encabezados

                try {
                    productos.push({
                        codigo: row.getCell(1).value,
                        nombre: row.getCell(2).value,
                        descripcion: row.getCell(3).value,
                        categoria_id: row.getCell(4).value,
                        proveedor_id: row.getCell(5).value,
                        precio_compra: row.getCell(6).value,
                        precio_venta: row.getCell(7).value,
                        stock: row.getCell(8).value,
                        stock_minimo: row.getCell(9).value
                    });
                } catch (error) {
                    errores.push(`Error en línea ${rowNumber}: ${error.message}`);
                }
            });

            if (errores.length > 0) {
                throw new ErrorOperacional('Errores en el archivo CSV', 400, errores);
            }

            await Producto.bulkCreate(productos);

            // Eliminar archivo temporal
            eliminarArchivo(req.file.path);

            res.json({
                error: false,
                mensaje: `${productos.length} productos importados correctamente`
            });
        } catch (error) {
            if (req.file) {
                eliminarArchivo(req.file.path);
            }
            next(error);
        }
    }
};

module.exports = productoController;

'use strict';

const { Model } = require('sequelize');
const { plantillasCorreo } = require('../utils/mailer');

module.exports = (sequelize, DataTypes) => {
    class Producto extends Model {
        static associate(models) {
            // Definir asociaciones
            Producto.belongsTo(models.Categoria, {
                foreignKey: 'categoria_id',
                as: 'categoria'
            });
            Producto.belongsTo(models.Proveedor, {
                foreignKey: 'proveedor_id',
                as: 'proveedor'
            });
            Producto.hasMany(models.Movimiento, {
                foreignKey: 'producto_id',
                as: 'movimientos'
            });
        }

        // Método para verificar stock bajo
        async verificarStockBajo() {
            if (this.stock <= this.stock_minimo) {
                // Enviar notificación por correo
                await plantillasCorreo.stockBajo(
                    `${this.codigo} - ${this.nombre}`,
                    this.stock,
                    this.stock_minimo
                );
                return true;
            }
            return false;
        }

        // Método para actualizar stock
        async actualizarStock(cantidad, tipo, { transaction } = {}) {
            const stockAnterior = this.stock;
            
            if (tipo === 'entrada' || tipo === 'devolucion') {
                this.stock += cantidad;
            } else if (tipo === 'salida') {
                if (this.stock < cantidad) {
                    throw new Error('Stock insuficiente');
                }
                this.stock -= cantidad;
            } else if (tipo === 'ajuste') {
                this.stock = cantidad;
            }

            await this.save({ transaction });
            await this.verificarStockBajo();

            return {
                stock_anterior: stockAnterior,
                stock_nuevo: this.stock
            };
        }

        // Método para obtener estadísticas del producto
        async obtenerEstadisticas(fechaInicio, fechaFin) {
            const { Movimiento } = sequelize.models;
            
            const where = {
                producto_id: this.id,
                estado: 'completado'
            };

            if (fechaInicio || fechaFin) {
                where.fecha_creacion = {};
                if (fechaInicio) where.fecha_creacion[Op.gte] = fechaInicio;
                if (fechaFin) where.fecha_creacion[Op.lte] = fechaFin;
            }

            const movimientos = await Movimiento.findAll({
                where,
                attributes: [
                    'tipo',
                    [sequelize.fn('COUNT', sequelize.col('id')), 'total'],
                    [sequelize.fn('SUM', sequelize.col('cantidad')), 'cantidad_total'],
                    [sequelize.fn('SUM', sequelize.col('total')), 'valor_total']
                ],
                group: ['tipo']
            });

            const stats = {
                entradas: { cantidad: 0, valor: 0 },
                salidas: { cantidad: 0, valor: 0 },
                devoluciones: { cantidad: 0, valor: 0 },
                ajustes: { cantidad: 0, valor: 0 }
            };

            movimientos.forEach(mov => {
                stats[`${mov.tipo}s`] = {
                    cantidad: parseInt(mov.getDataValue('cantidad_total')) || 0,
                    valor: parseFloat(mov.getDataValue('valor_total')) || 0
                };
            });

            return {
                ...stats,
                stock_actual: this.stock,
                valor_actual: this.stock * this.precio_compra,
                rotacion: stats.salidas.cantidad / ((this.stock + stats.entradas.cantidad) / 2),
                dias_inventario: this.stock / (stats.salidas.cantidad / 30) // Estimado mensual
            };
        }

        // Método para obtener historial de movimientos
        async obtenerHistorial(opciones = {}) {
            const { Movimiento, Usuario, Cliente, Proveedor } = sequelize.models;
            
            return await Movimiento.findAll({
                where: {
                    producto_id: this.id,
                    ...opciones.where
                },
                include: [
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
                order: [['fecha_creacion', 'DESC']],
                ...opciones
            });
        }

        // Método para validar si hay stock suficiente
        tieneStockSuficiente(cantidad) {
            return this.stock >= cantidad;
        }

        // Método para calcular valor total del inventario
        calcularValorInventario() {
            return this.stock * this.precio_compra;
        }

        // Método para transformar el objeto antes de enviarlo como JSON
        toJSON() {
            const values = { ...this.get() };
            values.valor_inventario = this.calcularValorInventario();
            values.stock_bajo = this.stock <= this.stock_minimo;
            return values;
        }
    }

    Producto.init({
        codigo: {
            type: DataTypes.STRING(50),
            allowNull: false,
            unique: true,
            validate: {
                notEmpty: true
            }
        },
        nombre: {
            type: DataTypes.STRING(200),
            allowNull: false,
            validate: {
                notEmpty: true,
                len: [3, 200]
            }
        },
        descripcion: {
            type: DataTypes.STRING(1000)
        },
        categoria_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'categorias',
                key: 'id'
            }
        },
        proveedor_id: {
            type: DataTypes.INTEGER,
            references: {
                model: 'proveedores',
                key: 'id'
            }
        },
        precio_compra: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0,
            validate: {
                min: 0
            }
        },
        precio_venta: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0,
            validate: {
                min: 0
            }
        },
        stock: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            validate: {
                min: 0
            }
        },
        stock_minimo: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            validate: {
                min: 0
            }
        },
        ubicacion: {
            type: DataTypes.STRING(100)
        },
        imagen: {
            type: DataTypes.STRING(255)
        },
        estado: {
            type: DataTypes.ENUM('activo', 'inactivo', 'descontinuado'),
            defaultValue: 'activo'
        },
        motivo_inactivacion: {
            type: DataTypes.STRING(255)
        }
    }, {
        sequelize,
        modelName: 'Producto',
        tableName: 'productos',
        hooks: {
            // Verificar stock bajo después de actualizar
            afterSave: async (producto) => {
                if (producto.changed('stock')) {
                    await producto.verificarStockBajo();
                }
            }
        }
    });

    return Producto;
};

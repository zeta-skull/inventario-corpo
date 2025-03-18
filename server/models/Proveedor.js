'use strict';

const { Model } = require('sequelize');
const { formatearRUT } = require('../utils/helpers');

module.exports = (sequelize, DataTypes) => {
    class Proveedor extends Model {
        static associate(models) {
            // Definir asociaciones
            Proveedor.hasMany(models.Producto, {
                foreignKey: 'proveedor_id',
                as: 'productos'
            });
            Proveedor.hasMany(models.Movimiento, {
                foreignKey: 'proveedor_id',
                as: 'movimientos'
            });
        }

        // Método para obtener estadísticas del proveedor
        async obtenerEstadisticas(fechaInicio, fechaFin) {
            const { Producto, Movimiento } = sequelize.models;
            
            const where = {
                proveedor_id: this.id,
                tipo: 'entrada',
                estado: 'completado'
            };

            if (fechaInicio || fechaFin) {
                where.fecha_creacion = {};
                if (fechaInicio) where.fecha_creacion[Op.gte] = fechaInicio;
                if (fechaFin) where.fecha_creacion[Op.lte] = fechaFin;
            }

            // Obtener productos activos
            const productos = await Producto.count({
                where: {
                    proveedor_id: this.id,
                    estado: 'activo'
                }
            });

            // Obtener movimientos
            const movimientos = await Movimiento.findAll({
                where,
                attributes: [
                    [sequelize.fn('COUNT', sequelize.col('id')), 'total_movimientos'],
                    [sequelize.fn('SUM', sequelize.col('cantidad')), 'total_productos'],
                    [sequelize.fn('SUM', sequelize.col('total')), 'total_valor'],
                    [sequelize.fn('AVG', sequelize.col('total')), 'promedio_valor']
                ]
            });

            // Obtener últimos movimientos
            const ultimosMovimientos = await Movimiento.findAll({
                where,
                include: ['producto', 'usuario_registra'],
                order: [['fecha_creacion', 'DESC']],
                limit: 5
            });

            // Obtener productos con stock bajo
            const productosStockBajo = await Producto.count({
                where: {
                    proveedor_id: this.id,
                    estado: 'activo'
                },
                having: sequelize.literal('stock <= stock_minimo')
            });

            const stats = movimientos[0].get();
            return {
                total_productos: productos,
                productos_stock_bajo: productosStockBajo,
                movimientos: {
                    cantidad: parseInt(stats.total_movimientos) || 0,
                    productos: parseInt(stats.total_productos) || 0,
                    valor_total: parseFloat(stats.total_valor) || 0,
                    valor_promedio: parseFloat(stats.promedio_valor) || 0
                },
                ultimos_movimientos: ultimosMovimientos
            };
        }

        // Método para validar si se puede eliminar
        async sePuedeEliminar() {
            const { Producto, Movimiento } = sequelize.models;
            
            const [productosActivos, movimientosActivos] = await Promise.all([
                Producto.count({
                    where: {
                        proveedor_id: this.id,
                        estado: 'activo'
                    }
                }),
                Movimiento.count({
                    where: {
                        proveedor_id: this.id,
                        estado: 'completado'
                    }
                })
            ]);

            return productosActivos === 0 && movimientosActivos === 0;
        }

        // Método para obtener productos activos
        async obtenerProductosActivos() {
            const { Producto } = sequelize.models;
            
            return await Producto.findAll({
                where: {
                    proveedor_id: this.id,
                    estado: 'activo'
                },
                include: ['categoria']
            });
        }

        // Método para obtener historial de movimientos
        async obtenerHistorialMovimientos(opciones = {}) {
            const { Movimiento, Producto, Usuario } = sequelize.models;
            
            return await Movimiento.findAll({
                where: {
                    proveedor_id: this.id,
                    tipo: 'entrada',
                    estado: 'completado',
                    ...opciones.where
                },
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
                    }
                ],
                order: [['fecha_creacion', 'DESC']],
                ...opciones
            });
        }

        // Método para transformar el objeto antes de enviarlo como JSON
        toJSON() {
            const values = { ...this.get() };
            
            // Formatear RUT
            if (values.rut) {
                values.rut = formatearRUT(values.rut);
            }
            
            return values;
        }
    }

    Proveedor.init({
        rut: {
            type: DataTypes.STRING(12),
            allowNull: false,
            unique: true,
            validate: {
                notEmpty: true,
                isRUTValid(value) {
                    // La validación específica del RUT se hace en el controlador
                    if (!value.match(/^[0-9]{7,8}-[0-9Kk]$/)) {
                        throw new Error('Formato de RUT inválido');
                    }
                }
            }
        },
        razon_social: {
            type: DataTypes.STRING(200),
            allowNull: false,
            validate: {
                notEmpty: true,
                len: [3, 200]
            }
        },
        nombre_contacto: {
            type: DataTypes.STRING(100),
            validate: {
                len: [0, 100]
            }
        },
        email: {
            type: DataTypes.STRING(255),
            allowNull: false,
            validate: {
                isEmail: true,
                notEmpty: true
            }
        },
        telefono: {
            type: DataTypes.STRING(20),
            validate: {
                len: [0, 20]
            }
        },
        direccion: {
            type: DataTypes.STRING(255)
        },
        comuna: {
            type: DataTypes.STRING(100)
        },
        ciudad: {
            type: DataTypes.STRING(100)
        },
        region: {
            type: DataTypes.STRING(100)
        },
        logo: {
            type: DataTypes.STRING(255)
        },
        sitio_web: {
            type: DataTypes.STRING(255),
            validate: {
                isUrl: true
            }
        },
        condiciones_pago: {
            type: DataTypes.STRING(100)
        },
        estado: {
            type: DataTypes.ENUM('activo', 'inactivo', 'bloqueado'),
            defaultValue: 'activo'
        },
        motivo_inactivacion: {
            type: DataTypes.STRING(255)
        }
    }, {
        sequelize,
        modelName: 'Proveedor',
        tableName: 'proveedores',
        hooks: {
            // Formatear RUT antes de guardar
            beforeSave: (proveedor) => {
                if (proveedor.rut) {
                    proveedor.rut = proveedor.rut.replace(/[^0-9Kk-]/g, '').toUpperCase();
                }
            }
        }
    });

    return Proveedor;
};

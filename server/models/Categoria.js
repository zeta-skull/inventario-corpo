'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Categoria extends Model {
        static associate(models) {
            // Definir asociaciones
            Categoria.hasMany(models.Producto, {
                foreignKey: 'categoria_id',
                as: 'productos'
            });
        }

        // Método para obtener estadísticas de la categoría
        async obtenerEstadisticas() {
            const { Producto, Movimiento } = sequelize.models;
            
            // Obtener productos activos de la categoría
            const productos = await Producto.findAll({
                where: {
                    categoria_id: this.id,
                    estado: 'activo'
                },
                include: [{
                    model: Movimiento,
                    as: 'movimientos',
                    attributes: [
                        'tipo',
                        [sequelize.fn('SUM', sequelize.col('cantidad')), 'cantidad_total'],
                        [sequelize.fn('SUM', sequelize.col('total')), 'valor_total']
                    ],
                    where: {
                        estado: 'completado'
                    },
                    group: ['tipo'],
                    required: false
                }]
            });

            // Calcular estadísticas
            const stats = {
                total_productos: productos.length,
                stock_total: 0,
                valor_inventario: 0,
                productos_stock_bajo: 0,
                movimientos: {
                    entradas: { cantidad: 0, valor: 0 },
                    salidas: { cantidad: 0, valor: 0 },
                    devoluciones: { cantidad: 0, valor: 0 },
                    ajustes: { cantidad: 0, valor: 0 }
                }
            };

            productos.forEach(producto => {
                // Sumar stock y valor
                stats.stock_total += producto.stock;
                stats.valor_inventario += producto.stock * producto.precio_compra;

                // Contar productos con stock bajo
                if (producto.stock <= producto.stock_minimo) {
                    stats.productos_stock_bajo++;
                }

                // Sumar movimientos
                producto.movimientos.forEach(mov => {
                    const tipo = `${mov.tipo}s`;
                    if (stats.movimientos[tipo]) {
                        stats.movimientos[tipo].cantidad += parseInt(mov.getDataValue('cantidad_total')) || 0;
                        stats.movimientos[tipo].valor += parseFloat(mov.getDataValue('valor_total')) || 0;
                    }
                });
            });

            return stats;
        }

        // Método para obtener productos con stock bajo
        async obtenerProductosStockBajo() {
            const { Producto } = sequelize.models;
            
            return await Producto.findAll({
                where: {
                    categoria_id: this.id,
                    estado: 'activo'
                },
                having: sequelize.literal('stock <= stock_minimo')
            });
        }

        // Método para actualizar orden de categorías
        static async actualizarOrdenes(ordenes) {
            const t = await sequelize.transaction();
            
            try {
                for (const { id, orden } of ordenes) {
                    await Categoria.update(
                        { orden },
                        { 
                            where: { id },
                            transaction: t
                        }
                    );
                }
                
                await t.commit();
                return true;
            } catch (error) {
                await t.rollback();
                throw error;
            }
        }

        // Método para validar si se puede eliminar
        async sePuedeEliminar() {
            const { Producto } = sequelize.models;
            
            const productosActivos = await Producto.count({
                where: {
                    categoria_id: this.id,
                    estado: 'activo'
                }
            });

            return productosActivos === 0;
        }

        // Método para obtener el siguiente orden disponible
        static async obtenerSiguienteOrden() {
            const maxOrden = await Categoria.max('orden');
            return (maxOrden || 0) + 1;
        }

        // Método para transformar el objeto antes de enviarlo como JSON
        toJSON() {
            const values = { ...this.get() };
            
            // Agregar campos calculados si están disponibles
            if (this.productos) {
                values.total_productos = this.productos.length;
                values.productos_activos = this.productos.filter(p => p.estado === 'activo').length;
            }
            
            return values;
        }
    }

    Categoria.init({
        nombre: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true,
            validate: {
                notEmpty: true,
                len: [2, 100]
            }
        },
        descripcion: {
            type: DataTypes.STRING(500),
            validate: {
                len: [0, 500]
            }
        },
        color: {
            type: DataTypes.STRING(7),
            defaultValue: '#000000',
            validate: {
                is: /^#[0-9A-F]{6}$/i
            }
        },
        orden: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            validate: {
                min: 0
            }
        },
        estado: {
            type: DataTypes.ENUM('activa', 'inactiva'),
            defaultValue: 'activa'
        }
    }, {
        sequelize,
        modelName: 'Categoria',
        tableName: 'categorias',
        hooks: {
            // Asignar orden automáticamente al crear
            beforeCreate: async (categoria) => {
                if (!categoria.orden) {
                    categoria.orden = await Categoria.obtenerSiguienteOrden();
                }
            }
        }
    });

    return Categoria;
};

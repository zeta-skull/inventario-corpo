'use strict';

const { Model } = require('sequelize');
const { generarNumeroDocumento } = require('../utils/helpers');

module.exports = (sequelize, DataTypes) => {
    class Movimiento extends Model {
        static associate(models) {
            // Definir asociaciones
            Movimiento.belongsTo(models.Producto, {
                foreignKey: 'producto_id',
                as: 'producto'
            });
            Movimiento.belongsTo(models.Usuario, {
                foreignKey: 'usuario_id',
                as: 'usuario_registra'
            });
            Movimiento.belongsTo(models.Cliente, {
                foreignKey: 'cliente_id',
                as: 'cliente'
            });
            Movimiento.belongsTo(models.Proveedor, {
                foreignKey: 'proveedor_id',
                as: 'proveedor'
            });
        }

        // Método para registrar un nuevo movimiento
        static async registrar(datos, usuario, transaction) {
            const { Producto, Cliente } = sequelize.models;
            
            // Validar producto
            const producto = await Producto.findByPk(datos.producto_id);
            if (!producto) throw new Error('Producto no encontrado');
            if (producto.estado !== 'activo') throw new Error('Producto inactivo');

            // Validar stock para salidas
            if (datos.tipo === 'salida' && datos.cantidad > producto.stock) {
                throw new Error('Stock insuficiente');
            }

            // Validar cliente para salidas
            if (datos.tipo === 'salida' && datos.cliente_id) {
                const cliente = await Cliente.findByPk(datos.cliente_id);
                if (!cliente) throw new Error('Cliente no encontrado');
                if (cliente.estado !== 'activo') throw new Error('Cliente inactivo');

                // Verificar límite mensual
                if (!(await cliente.verificarLimiteMensual(datos.cantidad * datos.precio_unitario))) {
                    throw new Error('Excede el límite mensual del cliente');
                }
            }

            // Calcular totales
            const stockAnterior = producto.stock;
            const total = datos.cantidad * datos.precio_unitario;

            // Generar número de documento si no se proporcionó
            if (!datos.numero_documento) {
                datos.numero_documento = generarNumeroDocumento(datos.tipo, new Date());
            }

            // Crear movimiento
            const movimiento = await Movimiento.create({
                ...datos,
                usuario_id: usuario.id,
                total,
                stock_anterior: stockAnterior,
                stock_nuevo: stockAnterior + (
                    datos.tipo === 'entrada' || datos.tipo === 'devolucion' 
                        ? datos.cantidad 
                        : -datos.cantidad
                )
            }, { transaction });

            // Actualizar stock del producto
            await producto.actualizarStock(
                datos.cantidad,
                datos.tipo,
                { transaction }
            );

            return movimiento;
        }

        // Método para anular un movimiento
        async anular(motivo, usuario, transaction) {
            if (this.estado === 'anulado') {
                throw new Error('El movimiento ya está anulado');
            }

            const { Producto } = sequelize.models;
            const producto = await Producto.findByPk(this.producto_id, { transaction });

            // Crear movimiento de compensación
            const compensacion = await Movimiento.create({
                tipo: this.tipo === 'entrada' ? 'salida' : 'entrada',
                producto_id: this.producto_id,
                usuario_id: usuario.id,
                cliente_id: this.cliente_id,
                proveedor_id: this.proveedor_id,
                cantidad: this.cantidad,
                precio_unitario: this.precio_unitario,
                total: this.total,
                numero_documento: `ANUL-${this.numero_documento}`,
                motivo: `Anulación: ${motivo}`,
                stock_anterior: producto.stock,
                stock_nuevo: producto.stock + (this.tipo === 'entrada' ? -this.cantidad : this.cantidad)
            }, { transaction });

            // Actualizar stock del producto
            await producto.actualizarStock(
                this.cantidad,
                this.tipo === 'entrada' ? 'salida' : 'entrada',
                { transaction }
            );

            // Marcar movimiento original como anulado
            this.estado = 'anulado';
            this.motivo = motivo;
            await this.save({ transaction });

            return compensacion;
        }

        // Método para obtener estadísticas de movimientos
        static async obtenerEstadisticas(filtros = {}) {
            const where = { estado: 'completado', ...filtros };

            const stats = await Movimiento.findAll({
                where,
                attributes: [
                    'tipo',
                    [sequelize.fn('COUNT', sequelize.col('id')), 'total_movimientos'],
                    [sequelize.fn('SUM', sequelize.col('cantidad')), 'total_productos'],
                    [sequelize.fn('SUM', sequelize.col('total')), 'total_valor']
                ],
                group: ['tipo']
            });

            return stats.reduce((acc, stat) => {
                acc[stat.tipo] = {
                    movimientos: parseInt(stat.get('total_movimientos')) || 0,
                    productos: parseInt(stat.get('total_productos')) || 0,
                    valor: parseFloat(stat.get('total_valor')) || 0
                };
                return acc;
            }, {});
        }

        // Método para generar reporte de movimientos
        static async generarReporte(filtros = {}, formato = 'json') {
            const { Producto, Usuario, Cliente, Proveedor, Categoria } = sequelize.models;

            const movimientos = await Movimiento.findAll({
                where: filtros,
                include: [
                    {
                        model: Producto,
                        as: 'producto',
                        include: [{
                            model: Categoria,
                            as: 'categoria'
                        }]
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
                order: [['fecha_creacion', 'DESC']]
            });

            if (formato === 'json') return movimientos;

            // Transformar para exportación
            return movimientos.map(m => ({
                Fecha: m.fecha_creacion,
                Tipo: m.tipo,
                'Nº Documento': m.numero_documento,
                Producto: m.producto.nombre,
                Categoría: m.producto.categoria.nombre,
                Cantidad: m.cantidad,
                'Precio Unitario': m.precio_unitario,
                Total: m.total,
                Usuario: `${m.usuario_registra.nombre} ${m.usuario_registra.apellido}`,
                Cliente: m.cliente ? `${m.cliente.nombre} ${m.cliente.apellido}` : '',
                Departamento: m.cliente ? m.cliente.departamento : '',
                Proveedor: m.proveedor ? m.proveedor.razon_social : '',
                Estado: m.estado,
                Motivo: m.motivo || ''
            }));
        }

        // Método para transformar el objeto antes de enviarlo como JSON
        toJSON() {
            const values = { ...this.get() };
            
            // Calcular campos adicionales
            values.es_anulable = this.estado === 'completado' && 
                new Date() - new Date(this.fecha_creacion) < 24 * 60 * 60 * 1000; // 24 horas
            
            return values;
        }
    }

    Movimiento.init({
        tipo: {
            type: DataTypes.ENUM('entrada', 'salida', 'ajuste', 'devolucion'),
            allowNull: false
        },
        producto_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'productos',
                key: 'id'
            }
        },
        usuario_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'usuarios',
                key: 'id'
            }
        },
        cliente_id: {
            type: DataTypes.INTEGER,
            references: {
                model: 'clientes',
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
        cantidad: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: 1
            }
        },
        precio_unitario: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            validate: {
                min: 0
            }
        },
        total: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        },
        numero_documento: {
            type: DataTypes.STRING(50)
        },
        archivo_adjunto: {
            type: DataTypes.STRING(255)
        },
        motivo: {
            type: DataTypes.STRING(200)
        },
        stock_anterior: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        stock_nuevo: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        estado: {
            type: DataTypes.ENUM('completado', 'anulado'),
            defaultValue: 'completado'
        }
    }, {
        sequelize,
        modelName: 'Movimiento',
        tableName: 'movimientos'
    });

    return Movimiento;
};

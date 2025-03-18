'use strict';

const { Model } = require('sequelize');
const { formatearRUT } = require('../utils/helpers');
const { plantillasCorreo } = require('../utils/mailer');

module.exports = (sequelize, DataTypes) => {
    class Cliente extends Model {
        static associate(models) {
            // Definir asociaciones
            Cliente.hasMany(models.Movimiento, {
                foreignKey: 'cliente_id',
                as: 'movimientos'
            });
        }

        // Método para obtener estadísticas del cliente
        async obtenerEstadisticas(mes = null) {
            const { Movimiento, Producto } = sequelize.models;
            
            const where = {
                cliente_id: this.id,
                tipo: 'salida',
                estado: 'completado'
            };

            if (mes) {
                const inicio = new Date(mes);
                const fin = new Date(mes);
                fin.setMonth(fin.getMonth() + 1);
                fin.setDate(0);
                
                where.fecha_creacion = {
                    [Op.between]: [inicio, fin]
                };
            }

            // Obtener movimientos
            const movimientos = await Movimiento.findAll({
                where,
                include: [{
                    model: Producto,
                    as: 'producto',
                    include: ['categoria']
                }],
                attributes: [
                    [sequelize.fn('COUNT', sequelize.col('id')), 'total_movimientos'],
                    [sequelize.fn('SUM', sequelize.col('cantidad')), 'total_productos'],
                    [sequelize.fn('SUM', sequelize.col('total')), 'total_valor']
                ],
                group: ['producto.categoria.id'],
                raw: true
            });

            // Calcular totales
            const stats = {
                movimientos: movimientos.length,
                productos: movimientos.reduce((sum, m) => sum + parseInt(m.total_productos) || 0, 0),
                valor: movimientos.reduce((sum, m) => sum + parseFloat(m.total_valor) || 0, 0),
                por_categoria: movimientos.reduce((acc, m) => {
                    const categoria = m['producto.categoria.nombre'];
                    acc[categoria] = {
                        productos: parseInt(m.total_productos) || 0,
                        valor: parseFloat(m.total_valor) || 0
                    };
                    return acc;
                }, {})
            };

            // Verificar límite mensual si se especificó un mes
            if (mes && this.limite_mensual > 0) {
                stats.limite_mensual = this.limite_mensual;
                stats.porcentaje_usado = (stats.valor / this.limite_mensual) * 100;
                
                // Notificar si se alcanzó el límite
                if (stats.valor >= this.limite_mensual) {
                    await plantillasCorreo.limiteMensualAlcanzado(this, stats.valor);
                }
            }

            return stats;
        }

        // Método para obtener historial de movimientos
        async obtenerHistorialMovimientos(opciones = {}) {
            const { Movimiento, Producto, Usuario } = sequelize.models;
            
            return await Movimiento.findAll({
                where: {
                    cliente_id: this.id,
                    tipo: 'salida',
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

        // Método para verificar límite mensual
        async verificarLimiteMensual(montoMovimiento) {
            if (!this.limite_mensual) return true;

            const inicioMes = new Date();
            inicioMes.setDate(1);
            inicioMes.setHours(0, 0, 0, 0);

            const { Movimiento } = sequelize.models;
            const consumoMensual = await Movimiento.sum('total', {
                where: {
                    cliente_id: this.id,
                    tipo: 'salida',
                    estado: 'completado',
                    fecha_creacion: {
                        [Op.gte]: inicioMes
                    }
                }
            }) || 0;

            return (consumoMensual + montoMovimiento) <= this.limite_mensual;
        }

        // Método para actualizar límite mensual
        async actualizarLimiteMensual(nuevoLimite) {
            const limiteAnterior = this.limite_mensual;
            this.limite_mensual = nuevoLimite;
            await this.save();

            // Verificar consumo actual contra nuevo límite
            const stats = await this.obtenerEstadisticas(new Date());
            if (stats.valor >= nuevoLimite) {
                await plantillasCorreo.limiteMensualAlcanzado(this, stats.valor);
            }

            return {
                limite_anterior: limiteAnterior,
                limite_nuevo: nuevoLimite,
                consumo_actual: stats.valor
            };
        }

        // Método para transformar el objeto antes de enviarlo como JSON
        toJSON() {
            const values = { ...this.get() };
            
            // Formatear RUT
            if (values.rut) {
                values.rut = formatearRUT(values.rut);
            }

            // Formatear nombre completo
            values.nombre_completo = `${values.nombre} ${values.apellido}`;
            
            return values;
        }
    }

    Cliente.init({
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
        nombre: {
            type: DataTypes.STRING(100),
            allowNull: false,
            validate: {
                notEmpty: true,
                len: [2, 100]
            }
        },
        apellido: {
            type: DataTypes.STRING(100),
            allowNull: false,
            validate: {
                notEmpty: true,
                len: [2, 100]
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
        departamento: {
            type: DataTypes.STRING(100),
            allowNull: false,
            validate: {
                notEmpty: true
            }
        },
        cargo: {
            type: DataTypes.STRING(100)
        },
        limite_mensual: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            validate: {
                min: 0
            }
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
        modelName: 'Cliente',
        tableName: 'clientes',
        hooks: {
            // Formatear RUT antes de guardar
            beforeSave: (cliente) => {
                if (cliente.rut) {
                    cliente.rut = cliente.rut.replace(/[^0-9Kk-]/g, '').toUpperCase();
                }
            }
        }
    });

    return Cliente;
};

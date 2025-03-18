'use strict';

const bcrypt = require('bcryptjs');
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Usuario extends Model {
        static associate(models) {
            // Definir asociaciones
            Usuario.hasMany(models.Movimiento, {
                foreignKey: 'usuario_id',
                as: 'movimientos_registrados'
            });
        }

        // Método para validar contraseña
        async validarPassword(password) {
            return await bcrypt.compare(password, this.password);
        }

        // Método para generar token de recuperación
        generarTokenRecuperacion() {
            const crypto = require('crypto');
            this.token_recuperacion = crypto.randomBytes(32).toString('hex');
            this.token_expiracion = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 horas
            return this.token_recuperacion;
        }

        // Método para verificar si el token de recuperación es válido
        tokenRecuperacionValido() {
            return this.token_recuperacion && this.token_expiracion > new Date();
        }

        // Método para obtener estadísticas del usuario
        async obtenerEstadisticas() {
            const { Movimiento } = sequelize.models;
            
            const movimientos = await Movimiento.findAll({
                where: { 
                    usuario_id: this.id,
                    estado: 'completado'
                },
                attributes: [
                    'tipo',
                    [sequelize.fn('COUNT', sequelize.col('id')), 'total'],
                    [sequelize.fn('SUM', sequelize.col('cantidad')), 'cantidad_total'],
                    [sequelize.fn('SUM', sequelize.col('total')), 'valor_total']
                ],
                group: ['tipo']
            });

            return {
                total_movimientos: movimientos.reduce((sum, m) => sum + parseInt(m.getDataValue('total')), 0),
                movimientos_por_tipo: movimientos.reduce((acc, m) => {
                    acc[m.tipo] = {
                        cantidad: parseInt(m.getDataValue('total')),
                        productos: parseInt(m.getDataValue('cantidad_total')),
                        valor: parseFloat(m.getDataValue('valor_total'))
                    };
                    return acc;
                }, {})
            };
        }

        // Método para obtener permisos basados en el rol
        obtenerPermisos() {
            const permisos = {
                admin: [
                    'ver_usuarios',
                    'crear_usuarios',
                    'editar_usuarios',
                    'eliminar_usuarios',
                    'ver_productos',
                    'crear_productos',
                    'editar_productos',
                    'eliminar_productos',
                    'ver_categorias',
                    'crear_categorias',
                    'editar_categorias',
                    'eliminar_categorias',
                    'ver_proveedores',
                    'crear_proveedores',
                    'editar_proveedores',
                    'eliminar_proveedores',
                    'ver_clientes',
                    'crear_clientes',
                    'editar_clientes',
                    'eliminar_clientes',
                    'ver_movimientos',
                    'crear_movimientos',
                    'anular_movimientos',
                    'exportar_reportes'
                ],
                supervisor: [
                    'ver_productos',
                    'crear_productos',
                    'editar_productos',
                    'ver_categorias',
                    'crear_categorias',
                    'editar_categorias',
                    'ver_proveedores',
                    'crear_proveedores',
                    'editar_proveedores',
                    'ver_clientes',
                    'crear_clientes',
                    'editar_clientes',
                    'ver_movimientos',
                    'crear_movimientos',
                    'exportar_reportes'
                ],
                usuario: [
                    'ver_productos',
                    'ver_categorias',
                    'ver_proveedores',
                    'ver_clientes',
                    'ver_movimientos',
                    'crear_movimientos'
                ]
            };

            return permisos[this.rol] || [];
        }

        // Método para verificar si tiene un permiso específico
        tienePermiso(permiso) {
            return this.obtenerPermisos().includes(permiso);
        }

        // Método para actualizar último login
        async registrarLogin() {
            this.ultimo_login = new Date();
            await this.save();
        }

        // Método para transformar el objeto antes de enviarlo como JSON
        toJSON() {
            const values = { ...this.get() };
            
            // Eliminar datos sensibles
            delete values.password;
            delete values.token_recuperacion;
            delete values.token_expiracion;
            
            return values;
        }
    }

    Usuario.init({
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
            unique: true,
            validate: {
                isEmail: true,
                notEmpty: true
            }
        },
        password: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        rol: {
            type: DataTypes.ENUM('admin', 'supervisor', 'usuario'),
            defaultValue: 'usuario'
        },
        activo: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        imagen_perfil: {
            type: DataTypes.STRING(255)
        },
        tema_preferido: {
            type: DataTypes.ENUM('light', 'dark'),
            defaultValue: 'light'
        },
        ultimo_login: {
            type: DataTypes.DATE
        },
        token_recuperacion: {
            type: DataTypes.STRING(255)
        },
        token_expiracion: {
            type: DataTypes.DATE
        },
        motivo_inactivacion: {
            type: DataTypes.STRING(255)
        }
    }, {
        sequelize,
        modelName: 'Usuario',
        tableName: 'usuarios',
        hooks: {
            // Hash de contraseña antes de crear/actualizar
            beforeSave: async (usuario) => {
                if (usuario.changed('password')) {
                    usuario.password = await bcrypt.hash(usuario.password, 10);
                }
            }
        }
    });

    return Usuario;
};

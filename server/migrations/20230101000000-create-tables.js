'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // Crear tabla de usuarios
        await queryInterface.createTable('usuarios', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            nombre: {
                type: Sequelize.STRING(100),
                allowNull: false
            },
            apellido: {
                type: Sequelize.STRING(100),
                allowNull: false
            },
            email: {
                type: Sequelize.STRING(255),
                allowNull: false,
                unique: true
            },
            password: {
                type: Sequelize.STRING(255),
                allowNull: false
            },
            rol: {
                type: Sequelize.ENUM('admin', 'supervisor', 'usuario'),
                defaultValue: 'usuario'
            },
            activo: {
                type: Sequelize.BOOLEAN,
                defaultValue: true
            },
            imagen_perfil: {
                type: Sequelize.STRING(255)
            },
            tema_preferido: {
                type: Sequelize.ENUM('light', 'dark'),
                defaultValue: 'light'
            },
            ultimo_login: {
                type: Sequelize.DATE
            },
            token_recuperacion: {
                type: Sequelize.STRING(255)
            },
            token_expiracion: {
                type: Sequelize.DATE
            },
            motivo_inactivacion: {
                type: Sequelize.STRING(255)
            },
            fecha_creacion: {
                type: Sequelize.DATE,
                allowNull: false
            },
            fecha_actualizacion: {
                type: Sequelize.DATE,
                allowNull: false
            },
            fecha_eliminacion: {
                type: Sequelize.DATE
            }
        });

        // Crear tabla de categorías
        await queryInterface.createTable('categorias', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            nombre: {
                type: Sequelize.STRING(100),
                allowNull: false,
                unique: true
            },
            descripcion: {
                type: Sequelize.STRING(500)
            },
            color: {
                type: Sequelize.STRING(7),
                defaultValue: '#000000'
            },
            orden: {
                type: Sequelize.INTEGER,
                defaultValue: 0
            },
            estado: {
                type: Sequelize.ENUM('activa', 'inactiva'),
                defaultValue: 'activa'
            },
            fecha_creacion: {
                type: Sequelize.DATE,
                allowNull: false
            },
            fecha_actualizacion: {
                type: Sequelize.DATE,
                allowNull: false
            },
            fecha_eliminacion: {
                type: Sequelize.DATE
            }
        });

        // Crear tabla de proveedores
        await queryInterface.createTable('proveedores', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            rut: {
                type: Sequelize.STRING(12),
                allowNull: false,
                unique: true
            },
            razon_social: {
                type: Sequelize.STRING(200),
                allowNull: false
            },
            nombre_contacto: {
                type: Sequelize.STRING(100)
            },
            email: {
                type: Sequelize.STRING(255),
                allowNull: false
            },
            telefono: {
                type: Sequelize.STRING(20)
            },
            direccion: {
                type: Sequelize.STRING(255)
            },
            comuna: {
                type: Sequelize.STRING(100)
            },
            ciudad: {
                type: Sequelize.STRING(100)
            },
            region: {
                type: Sequelize.STRING(100)
            },
            logo: {
                type: Sequelize.STRING(255)
            },
            sitio_web: {
                type: Sequelize.STRING(255)
            },
            condiciones_pago: {
                type: Sequelize.STRING(100)
            },
            estado: {
                type: Sequelize.ENUM('activo', 'inactivo', 'bloqueado'),
                defaultValue: 'activo'
            },
            motivo_inactivacion: {
                type: Sequelize.STRING(255)
            },
            fecha_creacion: {
                type: Sequelize.DATE,
                allowNull: false
            },
            fecha_actualizacion: {
                type: Sequelize.DATE,
                allowNull: false
            },
            fecha_eliminacion: {
                type: Sequelize.DATE
            }
        });

        // Crear tabla de clientes
        await queryInterface.createTable('clientes', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            rut: {
                type: Sequelize.STRING(12),
                allowNull: false,
                unique: true
            },
            nombre: {
                type: Sequelize.STRING(100),
                allowNull: false
            },
            apellido: {
                type: Sequelize.STRING(100),
                allowNull: false
            },
            email: {
                type: Sequelize.STRING(255),
                allowNull: false
            },
            telefono: {
                type: Sequelize.STRING(20)
            },
            direccion: {
                type: Sequelize.STRING(255)
            },
            comuna: {
                type: Sequelize.STRING(100)
            },
            ciudad: {
                type: Sequelize.STRING(100)
            },
            region: {
                type: Sequelize.STRING(100)
            },
            departamento: {
                type: Sequelize.STRING(100),
                allowNull: false
            },
            cargo: {
                type: Sequelize.STRING(100)
            },
            limite_mensual: {
                type: Sequelize.INTEGER,
                defaultValue: 0
            },
            estado: {
                type: Sequelize.ENUM('activo', 'inactivo', 'bloqueado'),
                defaultValue: 'activo'
            },
            motivo_inactivacion: {
                type: Sequelize.STRING(255)
            },
            fecha_creacion: {
                type: Sequelize.DATE,
                allowNull: false
            },
            fecha_actualizacion: {
                type: Sequelize.DATE,
                allowNull: false
            },
            fecha_eliminacion: {
                type: Sequelize.DATE
            }
        });

        // Crear tabla de productos
        await queryInterface.createTable('productos', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            codigo: {
                type: Sequelize.STRING(50),
                allowNull: false,
                unique: true
            },
            nombre: {
                type: Sequelize.STRING(200),
                allowNull: false
            },
            descripcion: {
                type: Sequelize.STRING(1000)
            },
            categoria_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'categorias',
                    key: 'id'
                }
            },
            proveedor_id: {
                type: Sequelize.INTEGER,
                references: {
                    model: 'proveedores',
                    key: 'id'
                }
            },
            precio_compra: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false,
                defaultValue: 0
            },
            precio_venta: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false,
                defaultValue: 0
            },
            stock: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0
            },
            stock_minimo: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0
            },
            ubicacion: {
                type: Sequelize.STRING(100)
            },
            imagen: {
                type: Sequelize.STRING(255)
            },
            estado: {
                type: Sequelize.ENUM('activo', 'inactivo', 'descontinuado'),
                defaultValue: 'activo'
            },
            motivo_inactivacion: {
                type: Sequelize.STRING(255)
            },
            fecha_creacion: {
                type: Sequelize.DATE,
                allowNull: false
            },
            fecha_actualizacion: {
                type: Sequelize.DATE,
                allowNull: false
            },
            fecha_eliminacion: {
                type: Sequelize.DATE
            }
        });

        // Crear tabla de movimientos
        await queryInterface.createTable('movimientos', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            tipo: {
                type: Sequelize.ENUM('entrada', 'salida', 'ajuste', 'devolucion'),
                allowNull: false
            },
            producto_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'productos',
                    key: 'id'
                }
            },
            usuario_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'usuarios',
                    key: 'id'
                }
            },
            cliente_id: {
                type: Sequelize.INTEGER,
                references: {
                    model: 'clientes',
                    key: 'id'
                }
            },
            proveedor_id: {
                type: Sequelize.INTEGER,
                references: {
                    model: 'proveedores',
                    key: 'id'
                }
            },
            cantidad: {
                type: Sequelize.INTEGER,
                allowNull: false
            },
            precio_unitario: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false
            },
            total: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false
            },
            numero_documento: {
                type: Sequelize.STRING(50)
            },
            archivo_adjunto: {
                type: Sequelize.STRING(255)
            },
            motivo: {
                type: Sequelize.STRING(200)
            },
            stock_anterior: {
                type: Sequelize.INTEGER,
                allowNull: false
            },
            stock_nuevo: {
                type: Sequelize.INTEGER,
                allowNull: false
            },
            estado: {
                type: Sequelize.ENUM('completado', 'anulado'),
                defaultValue: 'completado'
            },
            fecha_creacion: {
                type: Sequelize.DATE,
                allowNull: false
            },
            fecha_actualizacion: {
                type: Sequelize.DATE,
                allowNull: false
            },
            fecha_eliminacion: {
                type: Sequelize.DATE
            }
        });

        // Crear índices
        await queryInterface.addIndex('usuarios', ['email']);
        await queryInterface.addIndex('productos', ['codigo']);
        await queryInterface.addIndex('productos', ['categoria_id']);
        await queryInterface.addIndex('productos', ['proveedor_id']);
        await queryInterface.addIndex('movimientos', ['producto_id']);
        await queryInterface.addIndex('movimientos', ['usuario_id']);
        await queryInterface.addIndex('movimientos', ['cliente_id']);
        await queryInterface.addIndex('movimientos', ['proveedor_id']);
        await queryInterface.addIndex('movimientos', ['fecha_creacion']);
    },

    down: async (queryInterface, Sequelize) => {
        // Eliminar tablas en orden inverso
        await queryInterface.dropTable('movimientos');
        await queryInterface.dropTable('productos');
        await queryInterface.dropTable('clientes');
        await queryInterface.dropTable('proveedores');
        await queryInterface.dropTable('categorias');
        await queryInterface.dropTable('usuarios');
    }
};

'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(__filename);
const { sequelize } = require('../config/db');
const db = {};

// Cargar todos los modelos del directorio actual
fs.readdirSync(__dirname)
    .filter(file => {
        return (
            file.indexOf('.') !== 0 &&
            file !== basename &&
            file.slice(-3) === '.js'
        );
    })
    .forEach(file => {
        const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
        db[model.name] = model;
    });

// Establecer las asociaciones entre modelos
Object.keys(db).forEach(modelName => {
    if (db[modelName].associate) {
        db[modelName].associate(db);
    }
});

// Definir las asociaciones entre modelos
const setupAssociations = () => {
    // Usuario - Movimiento
    db.Usuario.hasMany(db.Movimiento, {
        foreignKey: 'usuario_id',
        as: 'movimientos_registrados'
    });
    db.Movimiento.belongsTo(db.Usuario, {
        foreignKey: 'usuario_id',
        as: 'usuario_registra'
    });

    // Categoría - Producto
    db.Categoria.hasMany(db.Producto, {
        foreignKey: 'categoria_id',
        as: 'productos'
    });
    db.Producto.belongsTo(db.Categoria, {
        foreignKey: 'categoria_id',
        as: 'categoria'
    });

    // Proveedor - Producto
    db.Proveedor.hasMany(db.Producto, {
        foreignKey: 'proveedor_id',
        as: 'productos'
    });
    db.Producto.belongsTo(db.Proveedor, {
        foreignKey: 'proveedor_id',
        as: 'proveedor'
    });

    // Producto - Movimiento
    db.Producto.hasMany(db.Movimiento, {
        foreignKey: 'producto_id',
        as: 'movimientos'
    });
    db.Movimiento.belongsTo(db.Producto, {
        foreignKey: 'producto_id',
        as: 'producto'
    });

    // Cliente - Movimiento
    db.Cliente.hasMany(db.Movimiento, {
        foreignKey: 'cliente_id',
        as: 'movimientos'
    });
    db.Movimiento.belongsTo(db.Cliente, {
        foreignKey: 'cliente_id',
        as: 'cliente'
    });

    // Proveedor - Movimiento
    db.Proveedor.hasMany(db.Movimiento, {
        foreignKey: 'proveedor_id',
        as: 'movimientos'
    });
    db.Movimiento.belongsTo(db.Proveedor, {
        foreignKey: 'proveedor_id',
        as: 'proveedor'
    });
};

// Agregar instancia de Sequelize y función de transacción
db.sequelize = sequelize;
db.Sequelize = Sequelize;

// Función de utilidad para transacciones
db.withTransaction = async (callback) => {
    const t = await sequelize.transaction();
    try {
        const result = await callback(t);
        await t.commit();
        return result;
    } catch (error) {
        await t.rollback();
        throw error;
    }
};

// Función para sincronizar modelos con la base de datos
db.sync = async (options = {}) => {
    try {
        await sequelize.sync(options);
        console.log('Base de datos sincronizada correctamente');
    } catch (error) {
        console.error('Error al sincronizar la base de datos:', error);
        throw error;
    }
};

// Función para probar la conexión
db.authenticate = async () => {
    try {
        await sequelize.authenticate();
        console.log('Conexión a la base de datos establecida correctamente');
    } catch (error) {
        console.error('Error al conectar con la base de datos:', error);
        throw error;
    }
};

// Exportar el objeto db
module.exports = db;

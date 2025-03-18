'use strict';

const { Sequelize } = require('sequelize');

// Crear instancia de Sequelize
const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASS,
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: 'mysql',
        timezone: '-03:00', // Zona horaria de Chile
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
        define: {
            // Opciones globales para todos los modelos
            charset: 'utf8',
            collate: 'utf8_general_ci',
            underscored: true, // Usar snake_case en lugar de camelCase para nombres de columnas
            timestamps: true, // Agregar created_at y updated_at automáticamente
            paranoid: true, // Soft deletes (deleted_at)
            createdAt: 'fecha_creacion',
            updatedAt: 'fecha_actualizacion',
            deletedAt: 'fecha_eliminacion'
        },
        pool: {
            max: 5, // Máximo número de conexiones en el pool
            min: 0, // Mínimo número de conexiones en el pool
            acquire: 30000, // Tiempo máximo en ms que el pool intentará obtener una conexión antes de lanzar error
            idle: 10000 // Tiempo máximo en ms que una conexión puede estar inactiva antes de ser liberada
        }
    }
);

// Función para probar la conexión
const probarConexion = async () => {
    try {
        await sequelize.authenticate();
        console.log('Conexión a la base de datos establecida correctamente.');

        // Sincronizar modelos con la base de datos en desarrollo
        if (process.env.NODE_ENV === 'development' && process.env.DB_SYNC === 'true') {
            console.log('Sincronizando modelos con la base de datos...');
            await sequelize.sync({ alter: true });
            console.log('Modelos sincronizados correctamente.');
        }
    } catch (error) {
        console.error('Error al conectar con la base de datos:', error);
        process.exit(1); // Terminar la aplicación si no se puede conectar a la base de datos
    }
};

// Manejadores de eventos de conexión
sequelize.addHook('beforeConnect', async (config) => {
    console.log('Intentando conectar a la base de datos...');
});

sequelize.addHook('afterConnect', async (connection) => {
    console.log('Conexión establecida.');
});

// Manejadores de eventos de desconexión
process.on('SIGINT', async () => {
    try {
        await sequelize.close();
        console.log('Conexión a la base de datos cerrada correctamente.');
        process.exit(0);
    } catch (error) {
        console.error('Error al cerrar la conexión:', error);
        process.exit(1);
    }
});

// Configuración de consultas por defecto
const queryInterface = sequelize.getQueryInterface();
queryInterface.bulkInsert = async function() {
    const args = Array.from(arguments);
    const options = args[2] || {};
    options.logging = false; // Desactivar logging para inserciones masivas
    args[2] = options;
    return await Sequelize.prototype.QueryInterface.prototype.bulkInsert.apply(this, args);
};

// Funciones auxiliares para transacciones
const withTransaction = async (callback) => {
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

// Exportar la instancia de Sequelize y funciones auxiliares
module.exports = {
    sequelize,
    probarConexion,
    withTransaction,
    QueryTypes: Sequelize.QueryTypes
};

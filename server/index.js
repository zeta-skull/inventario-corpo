'use strict';

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
const { probarConexion } = require('./config/db');
const { errorHandler } = require('./middleware/error');

// Crear aplicación Express
const app = express();

// Configuración de middlewares
app.use(helmet()); // Seguridad
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(compression()); // Compresión de respuestas
app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined')); // Logging
app.use(express.json()); // Parseo de JSON
app.use(express.urlencoded({ extended: true })); // Parseo de formularios

// Servir archivos estáticos
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '..', 'client', 'build')));
}

// Rutas de la API
app.use('/api', require('./routes'));

// Ruta para el cliente en producción
if (process.env.NODE_ENV === 'production') {
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '..', 'client', 'build', 'index.html'));
    });
}

// Manejador de errores global
app.use(errorHandler);

// Iniciar servidor
const PORT = process.env.PORT || 5000;
const iniciarServidor = async () => {
    try {
        // Probar conexión a la base de datos
        await probarConexion();

        // Iniciar servidor HTTP
        app.listen(PORT, () => {
            console.log(`
====================================================
  Servidor iniciado en el puerto ${PORT}
  Modo: ${process.env.NODE_ENV}
  URL: http://localhost:${PORT}
====================================================
            `);
        });

        // Manejar señales de terminación
        const signals = ['SIGTERM', 'SIGINT'];
        signals.forEach(signal => {
            process.on(signal, async () => {
                console.log(`\nRecibida señal ${signal}. Cerrando servidor...`);
                await new Promise(resolve => {
                    app.close(() => {
                        console.log('Servidor HTTP cerrado.');
                        resolve();
                    });
                });
                process.exit(0);
            });
        });

    } catch (error) {
        console.error('Error al iniciar el servidor:', error);
        process.exit(1);
    }
};

// Manejar errores no capturados
process.on('uncaughtException', (error) => {
    console.error('Error no capturado:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Promesa rechazada no manejada:', reason);
    process.exit(1);
});

// Iniciar la aplicación
iniciarServidor();

// Exportar app para pruebas
module.exports = app;

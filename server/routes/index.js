'use strict';

const express = require('express');
const router = express.Router();
const { verificarToken } = require('../middleware/auth');

// Importar rutas
const authRoutes = require('./auth');
const usuarioRoutes = require('./usuario');
const productoRoutes = require('./producto');
const categoriaRoutes = require('./categoria');
const proveedorRoutes = require('./proveedor');
const clienteRoutes = require('./cliente');
const movimientoRoutes = require('./movimiento');

// Ruta de prueba/estado de la API
router.get('/estado', (req, res) => {
    res.json({
        error: false,
        mensaje: 'API funcionando correctamente',
        datos: {
            nombre: process.env.APP_NAME,
            version: process.env.APP_VERSION,
            ambiente: process.env.NODE_ENV,
            fecha: new Date()
        }
    });
});

// Rutas públicas
router.use('/auth', authRoutes);

// Middleware de autenticación para rutas protegidas
router.use(verificarToken);

// Rutas protegidas
router.use('/usuarios', usuarioRoutes);
router.use('/productos', productoRoutes);
router.use('/categorias', categoriaRoutes);
router.use('/proveedores', proveedorRoutes);
router.use('/clientes', clienteRoutes);
router.use('/movimientos', movimientoRoutes);

// Manejador de rutas no encontradas
router.use((req, res) => {
    res.status(404).json({
        error: true,
        mensaje: 'Ruta no encontrada',
        datos: {
            metodo: req.method,
            ruta: req.originalUrl
        }
    });
});

module.exports = router;

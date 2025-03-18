'use strict';

const bcrypt = require('bcryptjs');
const { formatearRUT } = require('../utils/helpers');

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // Crear usuario administrador por defecto
        await queryInterface.bulkInsert('usuarios', [{
            nombre: 'Admin',
            apellido: 'Sistema',
            email: 'admin@corporacionpudahuel.cl',
            password: await bcrypt.hash('Admin123!', 10),
            rol: 'admin',
            activo: true,
            tema_preferido: 'light',
            fecha_creacion: new Date(),
            fecha_actualizacion: new Date()
        }]);

        // Crear categorías iniciales
        const categorias = await queryInterface.bulkInsert('categorias', [
            {
                nombre: 'Artículos de Oficina',
                descripcion: 'Materiales y suministros de oficina',
                color: '#4CAF50',
                orden: 1,
                fecha_creacion: new Date(),
                fecha_actualizacion: new Date()
            },
            {
                nombre: 'Materiales de Aseo',
                descripcion: 'Productos de limpieza y aseo',
                color: '#2196F3',
                orden: 2,
                fecha_creacion: new Date(),
                fecha_actualizacion: new Date()
            },
            {
                nombre: 'Equipos Electrónicos',
                descripcion: 'Equipos y accesorios electrónicos',
                color: '#F44336',
                orden: 3,
                fecha_creacion: new Date(),
                fecha_actualizacion: new Date()
            },
            {
                nombre: 'Mobiliario',
                descripcion: 'Muebles y equipamiento',
                color: '#FFC107',
                orden: 4,
                fecha_creacion: new Date(),
                fecha_actualizacion: new Date()
            }
        ], { returning: true });

        // Crear proveedores de ejemplo
        const proveedores = await queryInterface.bulkInsert('proveedores', [
            {
                rut: formatearRUT('76123456-7'),
                razon_social: 'Distribuidora Oficina SpA',
                nombre_contacto: 'Juan Pérez',
                email: 'ventas@distribuidora.cl',
                telefono: '+56912345678',
                direccion: 'Av. Principal 123',
                comuna: 'Santiago',
                ciudad: 'Santiago',
                region: 'Metropolitana',
                condiciones_pago: '30 días',
                estado: 'activo',
                fecha_creacion: new Date(),
                fecha_actualizacion: new Date()
            },
            {
                rut: formatearRUT('76234567-8'),
                razon_social: 'Limpieza Industrial Ltda.',
                nombre_contacto: 'María González',
                email: 'contacto@limpiezaindustrial.cl',
                telefono: '+56923456789',
                direccion: 'Calle Comercial 456',
                comuna: 'Pudahuel',
                ciudad: 'Santiago',
                region: 'Metropolitana',
                condiciones_pago: '15 días',
                estado: 'activo',
                fecha_creacion: new Date(),
                fecha_actualizacion: new Date()
            }
        ], { returning: true });

        // Crear clientes de ejemplo
        await queryInterface.bulkInsert('clientes', [
            {
                rut: formatearRUT('12345678-9'),
                nombre: 'Carlos',
                apellido: 'Rodríguez',
                email: 'carlos.rodriguez@pudahuel.cl',
                telefono: '+56934567890',
                departamento: 'Administración',
                cargo: 'Jefe de Departamento',
                limite_mensual: 500000,
                estado: 'activo',
                fecha_creacion: new Date(),
                fecha_actualizacion: new Date()
            },
            {
                rut: formatearRUT('23456789-0'),
                nombre: 'Ana',
                apellido: 'Martínez',
                email: 'ana.martinez@pudahuel.cl',
                telefono: '+56945678901',
                departamento: 'Recursos Humanos',
                cargo: 'Coordinadora',
                limite_mensual: 300000,
                estado: 'activo',
                fecha_creacion: new Date(),
                fecha_actualizacion: new Date()
            }
        ]);

        // Crear productos de ejemplo
        await queryInterface.bulkInsert('productos', [
            {
                codigo: 'RES-001',
                nombre: 'Resma Papel Carta',
                descripcion: 'Resma de papel tamaño carta, 500 hojas',
                categoria_id: 1,
                proveedor_id: 1,
                precio_compra: 2500,
                precio_venta: 3000,
                stock: 100,
                stock_minimo: 20,
                ubicacion: 'Bodega A-1',
                estado: 'activo',
                fecha_creacion: new Date(),
                fecha_actualizacion: new Date()
            },
            {
                codigo: 'CLO-001',
                nombre: 'Cloro 5L',
                descripcion: 'Cloro concentrado 5 litros',
                categoria_id: 2,
                proveedor_id: 2,
                precio_compra: 3000,
                precio_venta: 3500,
                stock: 50,
                stock_minimo: 10,
                ubicacion: 'Bodega B-2',
                estado: 'activo',
                fecha_creacion: new Date(),
                fecha_actualizacion: new Date()
            },
            {
                codigo: 'TEC-001',
                nombre: 'Teclado USB',
                descripcion: 'Teclado USB español latinoamericano',
                categoria_id: 3,
                proveedor_id: 1,
                precio_compra: 8000,
                precio_venta: 10000,
                stock: 30,
                stock_minimo: 5,
                ubicacion: 'Bodega C-1',
                estado: 'activo',
                fecha_creacion: new Date(),
                fecha_actualizacion: new Date()
            }
        ]);
    },

    down: async (queryInterface, Sequelize) => {
        // Eliminar todos los registros en orden inverso
        await queryInterface.bulkDelete('productos', null, {});
        await queryInterface.bulkDelete('clientes', null, {});
        await queryInterface.bulkDelete('proveedores', null, {});
        await queryInterface.bulkDelete('categorias', null, {});
        await queryInterface.bulkDelete('usuarios', null, {});
    }
};

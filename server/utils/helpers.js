'use strict';

const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

// Funciones de utilidad general
const helpers = {
    // Generar un string aleatorio
    generarStringAleatorio: (longitud = 32) => {
        return crypto.randomBytes(longitud).toString('hex');
    },

    // Generar un número de documento basado en el tipo y fecha
    generarNumeroDocumento: (tipo, fecha) => {
        const prefijos = {
            entrada: 'ENT',
            salida: 'SAL',
            ajuste: 'AJU',
            devolucion: 'DEV'
        };

        const timestamp = fecha.getTime().toString().slice(-6);
        const aleatorio = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        
        return `${prefijos[tipo]}-${timestamp}-${aleatorio}`;
    },

    // Validar RUT chileno
    validarRUT: (rut) => {
        if (typeof rut !== 'string') return false;

        // Limpiar el RUT de puntos y guión
        rut = rut.replace(/[.-]/g, '').toUpperCase();

        // Validar formato
        if (!/^[0-9]{7,8}[0-9K]$/.test(rut)) return false;

        const rutDigits = rut.slice(0, -1);
        const dv = rut.slice(-1);

        let suma = 0;
        let multiplicador = 2;

        // Calcular Dígito Verificador
        for (let i = rutDigits.length - 1; i >= 0; i--) {
            suma += parseInt(rutDigits[i]) * multiplicador;
            multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
        }

        const dvEsperado = 11 - (suma % 11);
        const dvCalculado = dvEsperado === 11 ? '0' : dvEsperado === 10 ? 'K' : dvEsperado.toString();

        return dv === dvCalculado;
    },

    // Formatear RUT con puntos y guión
    formatearRUT: (rut) => {
        if (!rut) return '';
        
        // Limpiar el RUT
        rut = rut.replace(/[.-]/g, '');
        
        // Separar cuerpo y dígito verificador
        const cuerpo = rut.slice(0, -1);
        const dv = rut.slice(-1);

        // Formatear cuerpo con puntos
        let rutFormateado = '';
        for (let i = cuerpo.length - 1, j = 0; i >= 0; i--, j++) {
            rutFormateado = cuerpo[i] + rutFormateado;
            if ((j + 1) % 3 === 0 && i !== 0) {
                rutFormateado = '.' + rutFormateado;
            }
        }

        return `${rutFormateado}-${dv}`;
    },

    // Formatear número como moneda chilena
    formatearMoneda: (monto) => {
        return new Intl.NumberFormat('es-CL', {
            style: 'currency',
            currency: 'CLP'
        }).format(monto);
    },

    // Formatear fecha en formato chileno
    formatearFecha: (fecha, incluirHora = false) => {
        const opciones = {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            ...(incluirHora && {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            })
        };

        return new Date(fecha).toLocaleDateString('es-CL', opciones);
    },

    // Calcular el total de una lista de productos
    calcularTotal: (productos) => {
        return productos.reduce((total, producto) => {
            return total + (producto.cantidad * producto.precio_unitario);
        }, 0);
    },

    // Generar un slug a partir de un string
    generarSlug: (texto) => {
        return texto
            .toLowerCase()
            .replace(/[áäâà]/g, 'a')
            .replace(/[éëêè]/g, 'e')
            .replace(/[íïîì]/g, 'i')
            .replace(/[óöôò]/g, 'o')
            .replace(/[úüûù]/g, 'u')
            .replace(/ñ/g, 'n')
            .replace(/[^a-z0-9-]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
    },

    // Validar si una fecha está dentro de un rango
    fechaEnRango: (fecha, inicio, fin) => {
        const fechaComparar = new Date(fecha);
        return fechaComparar >= new Date(inicio) && fechaComparar <= new Date(fin);
    },

    // Obtener la extensión de un archivo
    obtenerExtension: (nombreArchivo) => {
        return path.extname(nombreArchivo).toLowerCase();
    },

    // Validar si un archivo existe
    archivoExiste: (ruta) => {
        try {
            return fs.existsSync(ruta);
        } catch (error) {
            return false;
        }
    },

    // Crear directorio si no existe
    crearDirectorioSiNoExiste: (ruta) => {
        if (!fs.existsSync(ruta)) {
            fs.mkdirSync(ruta, { recursive: true });
        }
    },

    // Eliminar archivo si existe
    eliminarArchivoSiExiste: (ruta) => {
        try {
            if (fs.existsSync(ruta)) {
                fs.unlinkSync(ruta);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error al eliminar archivo:', error);
            return false;
        }
    },

    // Validar permisos de un rol
    tienePermiso: (permisos, permiso) => {
        if (!permisos || !Array.isArray(permisos)) return false;
        return permisos.includes(permiso);
    },

    // Obtener permisos por rol
    obtenerPermisosPorRol: (rol) => {
        const permisos = {
            admin: [
                'ver_usuarios', 'crear_usuarios', 'editar_usuarios', 'eliminar_usuarios',
                'ver_productos', 'crear_productos', 'editar_productos', 'eliminar_productos',
                'ver_categorias', 'crear_categorias', 'editar_categorias', 'eliminar_categorias',
                'ver_proveedores', 'crear_proveedores', 'editar_proveedores', 'eliminar_proveedores',
                'ver_clientes', 'crear_clientes', 'editar_clientes', 'eliminar_clientes',
                'ver_movimientos', 'crear_movimientos', 'anular_movimientos',
                'exportar_reportes', 'configurar_sistema'
            ],
            supervisor: [
                'ver_productos', 'crear_productos', 'editar_productos',
                'ver_categorias', 'crear_categorias', 'editar_categorias',
                'ver_proveedores', 'crear_proveedores', 'editar_proveedores',
                'ver_clientes', 'crear_clientes', 'editar_clientes',
                'ver_movimientos', 'crear_movimientos', 'anular_movimientos',
                'exportar_reportes'
            ],
            operador: [
                'ver_productos',
                'ver_categorias',
                'ver_proveedores',
                'ver_clientes',
                'ver_movimientos', 'crear_movimientos'
            ]
        };

        return permisos[rol] || [];
    },

    // Validar contraseña
    validarPassword: (password) => {
        // Mínimo 8 caracteres, al menos una mayúscula, una minúscula, un número y un carácter especial
        const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        return regex.test(password);
    },

    // Validar email
    validarEmail: (email) => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }
};

module.exports = helpers;

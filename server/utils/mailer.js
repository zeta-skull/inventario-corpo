'use strict';

const nodemailer = require('nodemailer');
const hbs = require('nodemailer-express-handlebars');
const path = require('path');

// Configurar transporte de correo
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

// Configurar handlebars para las plantillas
transporter.use('compile', hbs({
    viewEngine: {
        extname: '.hbs',
        layoutsDir: path.join(__dirname, '..', 'templates', 'email'),
        defaultLayout: false,
        partialsDir: path.join(__dirname, '..', 'templates', 'email', 'partials')
    },
    viewPath: path.join(__dirname, '..', 'templates', 'email'),
    extName: '.hbs'
}));

// Función base para enviar correos
const enviarCorreo = async (opciones) => {
    try {
        const opcionesCorreo = {
            from: `"${process.env.APP_NAME}" <${process.env.SMTP_FROM}>`,
            ...opciones
        };

        const info = await transporter.sendMail(opcionesCorreo);
        console.log('Correo enviado:', info.messageId);
        return info;
    } catch (error) {
        console.error('Error al enviar correo:', error);
        throw error;
    }
};

// Plantillas de correo
const plantillasCorreo = {
    // Correo de bienvenida para nuevos usuarios
    bienvenidaUsuario: async (usuario, password) => {
        return await enviarCorreo({
            to: usuario.email,
            subject: `Bienvenido a ${process.env.APP_NAME}`,
            template: 'bienvenida',
            context: {
                nombre: usuario.nombre,
                apellido: usuario.apellido,
                email: usuario.email,
                password: password,
                rol: usuario.rol,
                app_name: process.env.APP_NAME,
                app_url: process.env.APP_URL
            }
        });
    },

    // Correo de bienvenida para nuevos clientes
    bienvenidaCliente: async (cliente) => {
        return await enviarCorreo({
            to: cliente.email,
            subject: `Bienvenido a ${process.env.APP_NAME}`,
            template: 'bienvenida',
            context: {
                nombre: cliente.nombre,
                apellido: cliente.apellido,
                departamento: cliente.departamento,
                app_name: process.env.APP_NAME,
                app_url: process.env.APP_URL
            }
        });
    },

    // Correo de recuperación de contraseña
    recuperacionPassword: async (usuario, token) => {
        const resetUrl = `${process.env.APP_URL}/restablecer-password?token=${token}`;
        
        return await enviarCorreo({
            to: usuario.email,
            subject: 'Recuperación de Contraseña',
            template: 'recuperar-password',
            context: {
                nombre: usuario.nombre,
                resetUrl,
                app_name: process.env.APP_NAME,
                expiracion: '2 horas'
            }
        });
    },

    // Correo de confirmación de cambio de contraseña
    cambioPassword: async (usuario) => {
        return await enviarCorreo({
            to: usuario.email,
            subject: 'Contraseña Actualizada',
            template: 'cambio-password',
            context: {
                nombre: usuario.nombre,
                fecha: new Date().toLocaleString(),
                app_name: process.env.APP_NAME,
                app_url: process.env.APP_URL
            }
        });
    },

    // Alerta de stock bajo
    stockBajo: async (producto, stockActual, stockMinimo) => {
        const destinatarios = process.env.ALERTAS_EMAIL.split(',');
        
        return await enviarCorreo({
            to: destinatarios,
            subject: 'Alerta de Stock Bajo',
            template: 'stock-bajo',
            context: {
                producto,
                stockActual,
                stockMinimo,
                app_name: process.env.APP_NAME,
                app_url: process.env.APP_URL
            }
        });
    },

    // Notificación de límite mensual alcanzado
    limiteMensualAlcanzado: async (cliente, consumoActual) => {
        const destinatarios = [cliente.email, ...process.env.ALERTAS_EMAIL.split(',')];
        
        return await enviarCorreo({
            to: destinatarios,
            subject: 'Límite Mensual Alcanzado',
            template: 'limite-mensual',
            context: {
                nombre: cliente.nombre,
                apellido: cliente.apellido,
                departamento: cliente.departamento,
                limite: cliente.limite_mensual,
                consumo: consumoActual,
                app_name: process.env.APP_NAME
            }
        });
    },

    // Notificación de movimiento importante
    movimientoImportante: async (movimiento) => {
        const destinatarios = process.env.ALERTAS_EMAIL.split(',');
        
        return await enviarCorreo({
            to: destinatarios,
            subject: 'Movimiento Importante Registrado',
            template: 'movimiento-importante',
            context: {
                tipo: movimiento.tipo,
                producto: movimiento.producto.nombre,
                cantidad: movimiento.cantidad,
                total: movimiento.total,
                usuario: `${movimiento.usuario_registra.nombre} ${movimiento.usuario_registra.apellido}`,
                fecha: movimiento.fecha_creacion.toLocaleString(),
                app_name: process.env.APP_NAME,
                app_url: process.env.APP_URL
            }
        });
    },

    // Reporte diario
    reporteDiario: async (stats) => {
        const destinatarios = process.env.REPORTES_EMAIL.split(',');
        
        return await enviarCorreo({
            to: destinatarios,
            subject: `Reporte Diario - ${new Date().toLocaleDateString()}`,
            template: 'reporte-diario',
            context: {
                fecha: new Date().toLocaleDateString(),
                stats,
                app_name: process.env.APP_NAME,
                app_url: process.env.APP_URL
            }
        });
    }
};

module.exports = {
    enviarCorreo,
    plantillasCorreo
};

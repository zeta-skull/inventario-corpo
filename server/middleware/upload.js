'use strict';

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { ErrorOperacional } = require('./error');

// Configuración base de multer
const configuracionBase = {
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880 // 5MB por defecto
    },
    fileFilter: (req, file, cb) => {
        // Validar tipo de archivo según el destino
        const tiposPermitidos = {
            imagen: /^image\/(jpeg|png|gif)$/,
            documento: /^application\/(pdf|msword|vnd.openxmlformats-officedocument.wordprocessingml.document|vnd.ms-excel|vnd.openxmlformats-officedocument.spreadsheetml.sheet)$/,
            csv: /^text\/csv$/
        };

        const tipo = file.fieldname.includes('imagen') || file.fieldname.includes('logo') 
            ? 'imagen' 
            : file.fieldname.includes('csv') 
                ? 'csv' 
                : 'documento';

        if (!tiposPermitidos[tipo].test(file.mimetype)) {
            return cb(new ErrorOperacional(`Tipo de archivo no permitido. Solo se permiten: ${tipo === 'imagen' ? 'JPG, PNG, GIF' : tipo === 'csv' ? 'CSV' : 'PDF, DOC, DOCX, XLS, XLSX'}`));
        }

        cb(null, true);
    }
};

// Crear directorios si no existen
const crearDirectorios = () => {
    const directorios = [
        'uploads',
        'uploads/productos',
        'uploads/usuarios',
        'uploads/proveedores',
        'uploads/documentos',
        'uploads/temp'
    ];

    directorios.forEach(dir => {
        const fullPath = path.join(__dirname, '..', '..', dir);
        if (!fs.existsSync(fullPath)) {
            fs.mkdirSync(fullPath, { recursive: true });
        }
    });
};

crearDirectorios();

// Configuración de almacenamiento para diferentes tipos de archivos
const storage = {
    producto: multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, path.join(__dirname, '..', '..', 'uploads', 'productos'));
        },
        filename: (req, file, cb) => {
            const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
            cb(null, `producto-${uniqueSuffix}${path.extname(file.originalname)}`);
        }
    }),

    perfil: multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, path.join(__dirname, '..', '..', 'uploads', 'usuarios'));
        },
        filename: (req, file, cb) => {
            const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
            cb(null, `perfil-${uniqueSuffix}${path.extname(file.originalname)}`);
        }
    }),

    proveedor: multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, path.join(__dirname, '..', '..', 'uploads', 'proveedores'));
        },
        filename: (req, file, cb) => {
            const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
            cb(null, `proveedor-${uniqueSuffix}${path.extname(file.originalname)}`);
        }
    }),

    documento: multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, path.join(__dirname, '..', '..', 'uploads', 'documentos'));
        },
        filename: (req, file, cb) => {
            const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
            cb(null, `doc-${uniqueSuffix}${path.extname(file.originalname)}`);
        }
    }),

    temp: multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, path.join(__dirname, '..', '..', 'uploads', 'temp'));
        },
        filename: (req, file, cb) => {
            const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
            cb(null, `temp-${uniqueSuffix}${path.extname(file.originalname)}`);
        }
    })
};

// Configuraciones de carga para diferentes tipos de archivos
const upload = {
    producto: multer({ ...configuracionBase, storage: storage.producto }).single('imagen_producto'),
    perfil: multer({ ...configuracionBase, storage: storage.perfil }).single('imagen_perfil'),
    proveedor: multer({ ...configuracionBase, storage: storage.proveedor }).single('logo_proveedor'),
    documento: multer({ ...configuracionBase, storage: storage.documento }).single('documento'),
    cargaMasiva: multer({ ...configuracionBase, storage: storage.temp }).single('archivo_csv')
};

// Middleware para procesar imágenes
const procesarImagen = (opciones = {}) => {
    return async (req, res, next) => {
        try {
            if (!req.file || !req.file.path || !req.file.mimetype.startsWith('image/')) {
                return next();
            }

            const config = {
                width: opciones.width || 800,
                height: opciones.height || 800,
                quality: opciones.quality || 80,
                ...opciones
            };

            // Procesar imagen con Sharp
            await sharp(req.file.path)
                .resize(config.width, config.height, {
                    fit: 'inside',
                    withoutEnlargement: true
                })
                .jpeg({ quality: config.quality })
                .toFile(`${req.file.path}.processed.jpg`);

            // Reemplazar archivo original con el procesado
            fs.unlinkSync(req.file.path);
            fs.renameSync(`${req.file.path}.processed.jpg`, req.file.path);

            next();
        } catch (error) {
            next(error);
        }
    };
};

// Middleware para eliminar archivos
const eliminarArchivo = (ruta) => {
    if (fs.existsSync(ruta)) {
        fs.unlinkSync(ruta);
    }
};

// Middleware para limpiar archivos temporales
const limpiarTemp = () => {
    const tempDir = path.join(__dirname, '..', '..', 'uploads', 'temp');
    if (fs.existsSync(tempDir)) {
        fs.readdirSync(tempDir).forEach(file => {
            const filePath = path.join(tempDir, file);
            // Eliminar archivos más antiguos de 1 hora
            if (Date.now() - fs.statSync(filePath).mtime.getTime() > 3600000) {
                fs.unlinkSync(filePath);
            }
        });
    }
};

// Programar limpieza periódica de archivos temporales
setInterval(limpiarTemp, 3600000); // Cada hora

module.exports = {
    upload,
    procesarImagen,
    eliminarArchivo,
    limpiarTemp
};

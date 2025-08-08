const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware para parsear JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos desde la carpeta dist de Vite
app.use(express.static(path.join(__dirname, 'dist'), {
  // Configuraciones adicionales para mejor rendimiento
  maxAge: '1y',
  etag: true,
  lastModified: true,
  setHeaders: (res, filePath) => {
    // Cache más agresivo para archivos estáticos
    if (filePath.endsWith('.js') || filePath.endsWith('.css') || filePath.endsWith('.png') || filePath.endsWith('.jpg') || filePath.endsWith('.jpeg') || filePath.endsWith('.gif') || filePath.endsWith('.svg') || filePath.endsWith('.ico')) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
  }
}));


// Middleware para manejar todas las rutas de React Router (SPA)
// Usar un patrón más específico para evitar el error de path-to-regexp en Express 5.x
app.use((req, res, next) => {
  // Si la ruta ya fue manejada por las rutas anteriores, continuar
  if (res.headersSent) {
    return next();
  }

  // Verificar si la ruta solicitada es un archivo estático
  const filePath = path.join(__dirname, 'dist', req.path);
  
  // Si el archivo existe, servirlo directamente
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    return res.sendFile(filePath);
  }
  
  // Si no es un archivo, servir index.html para React Router
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  
  // Si no existe index.html, continuar al siguiente middleware
  next();
});

// Middleware de manejo de errores
app.use((err, req, res, next) => {
  console.error('Error en el servidor:', err.stack);
  res.status(500).json({
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Algo salió mal'
  });
});

// Middleware para rutas no encontradas (404)
app.use((req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    path: req.path,
    method: req.method
  });
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log('🚀 Servidor Express iniciado correctamente');
  console.log(`📁 Sirviendo archivos desde: ${path.join(__dirname, 'dist')}`);
  console.log(`⏰ Iniciado en: ${new Date().toLocaleString()}`);
  
  // Verificar si la carpeta dist existe
  const distPath = path.join(__dirname, 'dist');
  if (!fs.existsSync(distPath)) {
    console.warn('⚠️  ADVERTENCIA: La carpeta "dist" no existe.');
    console.warn('   Asegúrate de compilar tu aplicación React con: npm run build');
  } else {
    console.log('✅ Carpeta "dist" encontrada');
  }
});

// Manejo graceful de cierre del servidor
process.on('SIGTERM', () => {
  console.log('🛑 Recibida señal SIGTERM, cerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Recibida señal SIGINT, cerrando servidor...');
  process.exit(0);
});
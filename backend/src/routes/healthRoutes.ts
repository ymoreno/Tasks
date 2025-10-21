import express from 'express';

const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Readiness check
router.get('/ready', (req, res) => {
  // Aquí puedes agregar verificaciones adicionales
  // como conexión a base de datos, etc.
  res.status(200).json({
    status: 'READY',
    timestamp: new Date().toISOString()
  });
});

export { router as healthRoutes };
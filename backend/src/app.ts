// app.ts
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { testConnection, initializeDatabase } from './config/database';
import authRoutes from './routes/authRoutes';
import brotherRoutes from "./routes/brotherRoutes";
import homeRoutes from './routes/homeRoutes';
import typegroupRoutes from './routes/typegroupRoutes';
import groupRoutes from './routes/GroupRoutes';
import userRoutes from './routes/userRoutes';
import { authMiddleware } from './middleware/authMiddleware';

// Cargar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.get('/api/health', (req, res) => {
  res.json({ 
    message: 'AdminCapuchinos Backend funcionando', 
    timestamp: new Date(),
    environment: process.env.NODE_ENV
  });
});

// Aplicar authMiddleware globalmente (ESTÁ BIEN ASÍ)
app.use('/api/brother', authMiddleware, brotherRoutes);
app.use('/api/home', authMiddleware, homeRoutes);
app.use('/api/typegroup', authMiddleware, typegroupRoutes);
app.use('/api/group', authMiddleware, groupRoutes);
app.use('/api/user', authMiddleware, userRoutes);
//app.use('/api/group', authMiddleware, groupRoutes);

// Ruta de prueba de base de datos
app.get('/api/db-status', async (req, res) => {
  const dbStatus = await testConnection();
  res.json({ 
    database: dbStatus ? 'connected' : 'disconnected',
    databaseName: process.env.DB_NAME
  });
});

// Manejo de errores 404
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Ruta no encontrada',
    path: req.originalUrl 
  });
});

// Manejo de errores global
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error del servidor:', error);
  res.status(500).json({ 
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Algo salió mal'
  });
});

// Inicializar servidor
async function startServer() {
  try {
    await initializeDatabase();
    await testConnection();
    
    app.listen(PORT, () => {
      console.log('🚀 Servidor AdminCapuchinos iniciado');
      console.log(`📍 Puerto: ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
      console.log(`🗄️ Base de datos: ${process.env.DB_NAME}`);
      console.log(`🔗 URL: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Error iniciando el servidor:', error);
    process.exit(1);
  }
}

startServer();
export default app;
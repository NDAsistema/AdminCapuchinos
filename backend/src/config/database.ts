import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

// Configuración de la conexión a MySQL
export const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'admin_capuchinos',
  port: parseInt(process.env.DB_PORT || '3306'),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Crear pool de conexiones
export const pool = mysql.createPool(dbConfig);

// Probar conexión a la base de datos
export const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Conexión a MySQL establecida correctamente');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Error conectando a MySQL:', error);
    return false;
  }
};

// Inicializar base de datos (crear tablas si no existen)
export const initializeDatabase = async () => {
  try {
    // Crear base de datos si no existe
    const tempConnection = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password,
      port: dbConfig.port
    });

    await tempConnection.execute(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\``);
    console.log(`✅ Base de datos '${dbConfig.database}' verificada`);
    
    await tempConnection.end();

    await runCalendarMigrations();
    console.log('🎉 Base de datos inicializada correctamente');
  } catch (error) {
    console.error('❌ Error inicializando la base de datos:', error);
    throw error;
  }
};

async function runCalendarMigrations() {
  const migrationsDir = path.join(__dirname, '../../migrations');
  if (!fs.existsSync(migrationsDir)) return;

  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    const statements = sql
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      try {
        await pool.execute(statement);
      } catch (err: any) {
        const msg = err.message ?? '';
        if (!msg.includes('already exists') && !msg.includes("check that column/key exists")) {
          console.warn(`Migración ${file}:`, msg);
        }
      }
    }
  }
  console.log('✅ Tablas de calendarios/eventos verificadas');
}
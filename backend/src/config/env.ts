import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

interface Config {
  port: number;
  nodeEnv: string;
  database: {
    url: string;
  };
  jwt: {
    secret: string;
    expiresIn: string;
  };
  cors: {
    origins: string[];
  };
}

const config: Config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  database: {
    url: process.env.DATABASE_URL || '',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  cors: {
    origins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5173'],
  },
};

// Validación básica de configuración crítica
if (!config.database.url) {
  throw new Error('DATABASE_URL is required in environment variables');
}

if (config.jwt.secret === 'default-secret-change-in-production' && config.nodeEnv === 'production') {
  throw new Error('JWT_SECRET must be set in production environment');
}

export default config;

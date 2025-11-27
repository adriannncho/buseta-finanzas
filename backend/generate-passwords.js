/**
 * Script para generar contraseñas hasheadas para los usuarios iniciales
 * Ejecutar: node generate-passwords.js
 */

const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

async function generatePasswords() {
  console.log('\n=== GENERANDO CONTRASEÑAS HASHEADAS ===\n');

  // Contraseña para admin: admin123
  const adminHash = await bcrypt.hash('admin123', SALT_ROUNDS);
  console.log('Admin (123456789) - Contraseña: admin123');
  console.log('Hash:', adminHash);
  console.log('');

  // Contraseña para worker: worker123
  const workerHash = await bcrypt.hash('worker123', SALT_ROUNDS);
  console.log('Worker (987654321) - Contraseña: worker123');
  console.log('Hash:', workerHash);
  console.log('');

  console.log('=== SCRIPT SQL PARA ACTUALIZAR ===\n');
  console.log(`UPDATE "transport"."users" SET "password_hash" = '${adminHash}' WHERE "national_id" = '123456789';`);
  console.log(`UPDATE "transport"."users" SET "password_hash" = '${workerHash}' WHERE "national_id" = '987654321';`);
  console.log('');
}

generatePasswords().catch(console.error);

const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateUserPasswords() {
  try {
    console.log('🔐 Generando hashes de contraseñas...\n');

    // Generar hashes
    const adminHash = await bcrypt.hash('admin123', 10);
    const workerHash = await bcrypt.hash('worker123', 10);

    console.log('Hash generados:');
    console.log('ADMIN:', adminHash);
    console.log('WORKER:', workerHash);
    console.log('');

    // Eliminar usuarios existentes
    await prisma.$executeRawUnsafe(`
      DELETE FROM transport.users WHERE national_id IN ('1234567890', '9876543210')
    `);

    // Insertar ADMIN
    await prisma.$executeRawUnsafe(`
      INSERT INTO transport.users (full_name, email, national_id, password_hash, role, assigned_bus_id, is_active, created_at, updated_at) 
      VALUES (
        'Juan Administrador',
        'admin@buses.com',
        '1234567890',
        $1,
        'ADMIN',
        NULL,
        TRUE,
        NOW(),
        NOW()
      )
    `, adminHash);

    // Insertar WORKER
    await prisma.$executeRawUnsafe(`
      INSERT INTO transport.users (full_name, email, national_id, password_hash, role, assigned_bus_id, is_active, created_at, updated_at) 
      VALUES (
        'Carlos Conductor',
        'carlos@buses.com',
        '9876543210',
        $1,
        'WORKER',
        1,
        TRUE,
        NOW(),
        NOW()
      )
    `, workerHash);

    // Verificar usuarios creados
    const users = await prisma.$queryRawUnsafe(`
      SELECT id, full_name, national_id, email, role, assigned_bus_id, is_active
      FROM transport.users
      ORDER BY id
    `);

    console.log('✅ Usuarios creados correctamente:\n');
    console.table(users);

    console.log('\n📋 Credenciales de acceso:');
    console.log('   ADMIN - Cédula: 1234567890 | Password: admin123');
    console.log('   WORKER - Cédula: 9876543210 | Password: worker123\n');

    await prisma.$disconnect();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

updateUserPasswords();

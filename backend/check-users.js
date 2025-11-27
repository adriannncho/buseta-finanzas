const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        isActive: true
      }
    });

    console.log('\n=== USUARIOS EN LA BASE DE DATOS ===\n');
    users.forEach(user => {
      console.log(`Nombre: ${user.fullName}`);
      console.log(`Email: ${user.email}`);
      console.log(`Role: "${user.role}" (length: ${user.role.length})`);
      console.log(`Role bytes: ${Buffer.from(user.role).toString('hex')}`);
      console.log(`Activo: ${user.isActive}`);
      console.log('---');
    });

    // Verificar sesiones activas
    const sessions = await prisma.session.findMany({
      where: { isActive: true },
      include: {
        user: {
          select: {
            fullName: true,
            role: true
          }
        }
      }
    });

    console.log('\n=== SESIONES ACTIVAS ===\n');
    sessions.forEach(session => {
      console.log(`Usuario: ${session.user.fullName}`);
      console.log(`Role en sesión: "${session.user.role}"`);
      console.log('---');
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
})();

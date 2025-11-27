// Script para simular el proceso de autorización

const testRole = 'ADMIN';
const allowedRoles = ['ADMIN'];

console.log('\n=== TEST DE AUTORIZACIÓN ===\n');
console.log(`Role del usuario: "${testRole}"`);
console.log(`Roles permitidos: [${allowedRoles.map(r => `"${r}"`).join(', ')}]`);
console.log(`\nType of testRole: ${typeof testRole}`);
console.log(`Type of allowedRoles[0]: ${typeof allowedRoles[0]}`);

// Test 1: includes directo
const test1 = allowedRoles.includes(testRole);
console.log(`\nTest 1 - allowedRoles.includes(testRole): ${test1}`);

// Test 2: cast como hace el middleware
const userRoleAsString = testRole;
const test2 = allowedRoles.includes(userRoleAsString);
console.log(`Test 2 - con cast: ${test2}`);

// Test 3: comparación estricta
const test3 = testRole === 'ADMIN';
console.log(`Test 3 - testRole === 'ADMIN': ${test3}`);

// Test 4: simulando el problema real
const authReqUser = {
  role: 'ADMIN'
};

const userRole = authReqUser.role;
const test4 = allowedRoles.includes(userRole);
console.log(`\nTest 4 - simulando middleware real: ${test4}`);
console.log(`userRole: "${userRole}"`);
console.log(`userRole === 'ADMIN': ${userRole === 'ADMIN'}`);

// Verificar si hay espacios u otros caracteres ocultos
console.log(`\nLongitud de userRole: ${userRole.length}`);
console.log(`Bytes de userRole: ${Buffer.from(userRole).toString('hex')}`);
console.log(`Bytes esperados (ADMIN): ${Buffer.from('ADMIN').toString('hex')}`);

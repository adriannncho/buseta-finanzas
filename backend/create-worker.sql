-- =====================================================
-- Script para crear usuario trabajador de prueba
-- =====================================================

-- Asegurarse de que estamos en el schema correcto
SET search_path TO transport;

-- Verificar que la extensión pgcrypto esté instalada
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Crear usuario trabajador
-- Contraseña por defecto: "worker123" (cámbiala después del primer login)
INSERT INTO users (full_name, email, national_id, password_hash, role, is_active)
VALUES (
  'Juan Pérez',
  'juan.perez@buses.com',
  '987654321',
  crypt('worker123', gen_salt('bf', 10)),
  'WORKER',
  true
)
ON CONFLICT (national_id) DO NOTHING;

-- Verificar que el usuario se creó
SELECT 
  id,
  full_name,
  email,
  national_id,
  role,
  is_active,
  created_at
FROM users
WHERE national_id = '987654321';

-- Mensaje informativo
DO $$
BEGIN
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Usuario trabajador creado exitosamente';
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Nombre: Juan Pérez';
  RAISE NOTICE 'Cédula: 987654321';
  RAISE NOTICE 'Contraseña: worker123';
  RAISE NOTICE 'Rol: WORKER';
  RAISE NOTICE '';
  RAISE NOTICE 'PERMISOS:';
  RAISE NOTICE '  - Ver reportes diarios, buses, gastos, presupuestos';
  RAISE NOTICE '  - Crear reportes diarios y gastos';
  RAISE NOTICE '  - NO puede editar/eliminar ni gestionar usuarios';
  RAISE NOTICE '';
  RAISE NOTICE 'IMPORTANTE: Cambia la contraseña después del primer login';
  RAISE NOTICE '==============================================';
END $$;

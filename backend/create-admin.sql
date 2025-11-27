-- =====================================================
-- Script para crear usuario administrador inicial
-- =====================================================

-- Asegurarse de que estamos en el schema correcto
SET search_path TO transport;

-- Verificar que la extensión pgcrypto esté instalada
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Crear usuario administrador
-- Contraseña por defecto: "admin123" (cámbiala después del primer login)
INSERT INTO users (full_name, email, national_id, password_hash, role, is_active)
VALUES (
  'Administrador Principal',
  'admin@buses.com',
  '123456789',
  crypt('admin123', gen_salt('bf', 10)),
  'ADMIN',
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
WHERE national_id = '123456789';

-- Mensaje informativo
DO $$
BEGIN
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Usuario administrador creado exitosamente';
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Cédula: 123456789';
  RAISE NOTICE 'Contraseña: admin123';
  RAISE NOTICE 'Rol: ADMIN';
  RAISE NOTICE '';
  RAISE NOTICE 'IMPORTANTE: Cambia la contraseña después del primer login';
  RAISE NOTICE '==============================================';
END $$;

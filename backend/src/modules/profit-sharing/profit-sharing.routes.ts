import { Router } from 'express';
import { profitSharingController } from './profit-sharing.controller';
import { authenticate } from '../../shared/middleware/auth.middleware';
import { authorize } from '../../shared/middleware/auth.middleware';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// ==================== GRUPOS ====================

// GET /api/profit-sharing/groups - Listar grupos (todos los usuarios autenticados)
router.get(
  '/groups',
  profitSharingController.getProfitSharingGroups.bind(profitSharingController)
);

// GET /api/profit-sharing/groups/:id - Obtener grupo por ID (todos los usuarios)
router.get(
  '/groups/:id',
  profitSharingController.getProfitSharingGroupById.bind(profitSharingController)
);

// GET /api/profit-sharing/groups/:id/distribution - Obtener distribución de utilidades (todos los usuarios)
router.get(
  '/groups/:id/distribution',
  profitSharingController.getProfitDistribution.bind(profitSharingController)
);

// POST /api/profit-sharing/groups - Crear grupo (solo ADMIN)
router.post(
  '/groups',
  authorize('ADMIN'),
  profitSharingController.createProfitSharingGroup.bind(profitSharingController)
);

// PATCH /api/profit-sharing/groups/:id - Actualizar grupo (solo ADMIN)
router.patch(
  '/groups/:id',
  authorize('ADMIN'),
  profitSharingController.updateProfitSharingGroup.bind(profitSharingController)
);

// DELETE /api/profit-sharing/groups/:id - Eliminar grupo (solo ADMIN)
router.delete(
  '/groups/:id',
  authorize('ADMIN'),
  profitSharingController.deleteProfitSharingGroup.bind(profitSharingController)
);

// ==================== MIEMBROS ====================

// GET /api/profit-sharing/members/list - Listar miembros con filtros (todos los usuarios)
router.get(
  '/members/list',
  profitSharingController.getProfitSharingMembers.bind(profitSharingController)
);

// GET /api/profit-sharing/members/:id - Obtener miembro por ID (todos los usuarios)
router.get(
  '/members/:id',
  profitSharingController.getProfitSharingMemberById.bind(profitSharingController)
);

// POST /api/profit-sharing/members - Crear miembro (solo ADMIN)
router.post(
  '/members',
  authorize('ADMIN'),
  profitSharingController.createProfitSharingMember.bind(profitSharingController)
);

// PATCH /api/profit-sharing/members/:id - Actualizar miembro (solo ADMIN)
router.patch(
  '/members/:id',
  authorize('ADMIN'),
  profitSharingController.updateProfitSharingMember.bind(profitSharingController)
);

// DELETE /api/profit-sharing/members/:id - Eliminar miembro (solo ADMIN)
router.delete(
  '/members/:id',
  authorize('ADMIN'),
  profitSharingController.deleteProfitSharingMember.bind(profitSharingController)
);

export default router;

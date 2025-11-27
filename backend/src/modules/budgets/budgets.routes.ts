import { Router } from 'express';
import { budgetsController } from './budgets.controller';
import { authenticate, authorize } from '../../shared/middleware/auth.middleware';
import { validate, validateQuery } from '../../shared/middleware/validation.middleware';
import {
  createBudgetSchema,
  updateBudgetSchema,
  createBudgetItemSchema,
  updateBudgetItemSchema,
  getBudgetsQuerySchema,
  getBudgetItemsQuerySchema,
} from './budgets.dto';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// ==================== PRESUPUESTOS ====================

/**
 * GET /api/budgets
 * Obtener listado de presupuestos (todos los usuarios)
 */
router.get(
  '/',
  validateQuery(getBudgetsQuerySchema),
  budgetsController.getBudgets.bind(budgetsController)
);

/**
 * GET /api/budgets/:id
 * Obtener un presupuesto por ID (todos los usuarios)
 */
router.get('/:id', budgetsController.getBudgetById.bind(budgetsController));

/**
 * GET /api/budgets/:id/analysis
 * Obtener análisis de presupuesto vs gastos reales (todos los usuarios)
 */
router.get('/:id/analysis', budgetsController.getBudgetAnalysis.bind(budgetsController));

/**
 * POST /api/budgets
 * Crear un presupuesto (solo ADMIN)
 */
router.post(
  '/',
  authorize('ADMIN'),
  validate(createBudgetSchema),
  budgetsController.createBudget.bind(budgetsController)
);

/**
 * PATCH /api/budgets/:id
 * Actualizar un presupuesto (solo ADMIN)
 */
router.patch(
  '/:id',
  authorize('ADMIN'),
  validate(updateBudgetSchema),
  budgetsController.updateBudget.bind(budgetsController)
);

/**
 * DELETE /api/budgets/:id
 * Eliminar un presupuesto (solo ADMIN)
 */
router.delete('/:id', authorize('ADMIN'), budgetsController.deleteBudget.bind(budgetsController));

// ==================== ITEMS ====================

/**
 * GET /api/budgets/items
 * Obtener items de presupuesto (todos los usuarios)
 */
router.get(
  '/items/list',
  validateQuery(getBudgetItemsQuerySchema),
  budgetsController.getBudgetItems.bind(budgetsController)
);

/**
 * GET /api/budgets/items/:id
 * Obtener un item por ID (todos los usuarios)
 */
router.get('/items/:id', budgetsController.getBudgetItemById.bind(budgetsController));

/**
 * POST /api/budgets/items
 * Crear un item de presupuesto (solo ADMIN)
 */
router.post(
  '/items',
  authorize('ADMIN'),
  validate(createBudgetItemSchema),
  budgetsController.createBudgetItem.bind(budgetsController)
);

/**
 * PATCH /api/budgets/items/:id
 * Actualizar un item (solo ADMIN)
 */
router.patch(
  '/items/:id',
  authorize('ADMIN'),
  validate(updateBudgetItemSchema),
  budgetsController.updateBudgetItem.bind(budgetsController)
);

/**
 * DELETE /api/budgets/items/:id
 * Eliminar un item (solo ADMIN)
 */
router.delete(
  '/items/:id',
  authorize('ADMIN'),
  budgetsController.deleteBudgetItem.bind(budgetsController)
);

export default router;

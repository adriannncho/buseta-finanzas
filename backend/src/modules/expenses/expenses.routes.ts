import { Router } from 'express';
import { expensesController } from './expenses.controller';
import { authenticate, authorize } from '../../shared/middleware/auth.middleware';
import { validate, validateQuery } from '../../shared/middleware/validation.middleware';
import {
  createExpenseCategorySchema,
  updateExpenseCategorySchema,
  createExpenseSchema,
  updateExpenseSchema,
  getExpenseCategoriesQuerySchema,
  getExpensesQuerySchema,
} from './expenses.dto';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// ==================== CATEGORÍAS ====================

/**
 * GET /api/expenses/categories
 * Obtener listado de categorías (todos los usuarios)
 */
router.get(
  '/categories',
  validateQuery(getExpenseCategoriesQuerySchema),
  expensesController.getExpenseCategories.bind(expensesController)
);

/**
 * GET /api/expenses/categories/:id
 * Obtener una categoría por ID (todos los usuarios)
 */
router.get(
  '/categories/:id',
  expensesController.getExpenseCategoryById.bind(expensesController)
);

/**
 * POST /api/expenses/categories
 * Crear una categoría (solo ADMIN)
 */
router.post(
  '/categories',
  authorize('ADMIN'),
  validate(createExpenseCategorySchema),
  expensesController.createExpenseCategory.bind(expensesController)
);

/**
 * PATCH /api/expenses/categories/:id
 * Actualizar una categoría (solo ADMIN)
 */
router.patch(
  '/categories/:id',
  authorize('ADMIN'),
  validate(updateExpenseCategorySchema),
  expensesController.updateExpenseCategory.bind(expensesController)
);

/**
 * DELETE /api/expenses/categories/:id
 * Eliminar una categoría (solo ADMIN)
 */
router.delete(
  '/categories/:id',
  authorize('ADMIN'),
  expensesController.deleteExpenseCategory.bind(expensesController)
);

/**
 * POST /api/expenses/categories/:id/activate
 * Activar una categoría (solo ADMIN)
 */
router.post(
  '/categories/:id/activate',
  authorize('ADMIN'),
  expensesController.activateExpenseCategory.bind(expensesController)
);

// ==================== GASTOS ====================

/**
 * GET /api/expenses/statistics
 * Obtener estadísticas de gastos (todos los usuarios)
 */
router.get('/statistics', expensesController.getExpenseStatistics.bind(expensesController));

/**
 * GET /api/expenses
 * Obtener listado de gastos (todos los usuarios)
 */
router.get(
  '/',
  validateQuery(getExpensesQuerySchema),
  expensesController.getExpenses.bind(expensesController)
);

/**
 * GET /api/expenses/:id
 * Obtener un gasto por ID (todos los usuarios)
 */
router.get('/:id', expensesController.getExpenseById.bind(expensesController));

/**
 * POST /api/expenses
 * Crear un gasto (ADMIN y WORKER)
 */
router.post(
  '/',
  validate(createExpenseSchema),
  expensesController.createExpense.bind(expensesController)
);

/**
 * PATCH /api/expenses/:id
 * Actualizar un gasto (solo ADMIN)
 */
router.patch(
  '/:id',
  authorize('ADMIN'),
  validate(updateExpenseSchema),
  expensesController.updateExpense.bind(expensesController)
);

/**
 * DELETE /api/expenses/:id
 * Eliminar un gasto (solo ADMIN)
 */
router.delete('/:id', authorize('ADMIN'), expensesController.deleteExpense.bind(expensesController));

export default router;

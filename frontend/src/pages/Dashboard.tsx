import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardPage from './Dashboard/DashboardPage';
import UsersPage from './Users/UsersPage';
import BusesPage from './Buses/BusesPage';
import RoutesPage from './Routes/RoutesPage';
import RoutesHistoryPage from './Routes/RoutesHistoryPage';
import ExpensesPage from './Expenses/ExpensesPage';
import ExpenseCategoriesPage from './Expenses/ExpenseCategoriesPage';
import BudgetsPage from './Budgets/BudgetsPage';
import BudgetItemsPage from './Budgets/BudgetItemsPage';
import ProfitSharingPage from './ProfitSharing/ProfitSharingPage';
import ProfitSharingMembersPage from './ProfitSharing/ProfitSharingMembersPage';
import InvoicesPage from './Invoices/InvoicesPage';
import AuditPage from './Audit/AuditPage';

export default function Dashboard() {
  return (
    <DashboardLayout>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/buses" element={<BusesPage />} />
        <Route path="/routes" element={<RoutesPage />} />
        <Route path="/routes/history" element={<RoutesHistoryPage />} />
        <Route path="/expenses" element={<ExpensesPage />} />
        <Route path="/expenses/categories" element={<ExpenseCategoriesPage />} />
        <Route path="/budgets" element={<BudgetsPage />} />
        <Route path="/budgets/:budgetId/items" element={<BudgetItemsPage />} />
        <Route path="/profit-sharing" element={<ProfitSharingPage />} />
        <Route path="/profit-sharing/:groupId/members" element={<ProfitSharingMembersPage />} />
        <Route path="/invoices" element={<InvoicesPage />} />
        <Route path="/audit" element={<AuditPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </DashboardLayout>
  );
}

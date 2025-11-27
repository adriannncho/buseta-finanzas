import { usePermissions } from '../../hooks/usePermissions';
import Button from '../ui/Button';

interface ActionButtonsProps {
  module: string;
  onEdit?: () => void;
  onDelete?: () => void;
  onActivate?: () => void;
  isDeleting?: boolean;
  isActivating?: boolean;
  editLabel?: string;
  deleteLabel?: string;
  activateLabel?: string;
}

export default function ActionButtons({
  module,
  onEdit,
  onDelete,
  onActivate,
  isDeleting = false,
  isActivating = false,
  editLabel = 'Editar',
  deleteLabel = 'Eliminar',
  activateLabel = 'Activar',
}: ActionButtonsProps) {
  const { canUpdate, canDelete } = usePermissions();

  const hasAnyAction = (canUpdate(module) && onEdit) || (canDelete(module) && (onDelete || onActivate));

  if (!hasAnyAction) return null;

  return (
    <div className="flex justify-end gap-2">
      {canUpdate(module) && onEdit && (
        <Button variant="secondary" size="sm" onClick={onEdit}>
          {editLabel}
        </Button>
      )}
      {canDelete(module) && onDelete && (
        <Button
          variant="danger"
          size="sm"
          onClick={onDelete}
          isLoading={isDeleting}
        >
          {deleteLabel}
        </Button>
      )}
      {canDelete(module) && onActivate && (
        <Button
          variant="success"
          size="sm"
          onClick={onActivate}
          isLoading={isActivating}
        >
          {activateLabel}
        </Button>
      )}
    </div>
  );
}

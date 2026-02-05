import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from './Card';
import type { Card as CardType, List, Label, ChecklistItem } from '../types';

interface SortableCardProps {
  card: CardType;
  lists: List[];
  labels: Label[];
  cardLabels: Label[];
  onUpdate: (updates: Partial<Pick<CardType, 'title' | 'description' | 'story_points' | 'due_date' | 'is_complete' | 'checklist'>>) => void;
  onDelete: () => void;
  onMove: (targetListId: string) => void;
  onToggleLabel: (labelId: string) => void;
  onUpdateLabel: (labelId: string, updates: Partial<Pick<Label, 'name' | 'color'>>) => void;
  onModalChange: (isOpen: boolean) => void;
}

export function SortableCard({
  card,
  lists,
  labels,
  cardLabels,
  onUpdate,
  onDelete,
  onMove,
  onToggleLabel,
  onUpdateLabel,
  onModalChange,
}: SortableCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card
        card={card}
        lists={lists}
        labels={labels}
        cardLabels={cardLabels}
        onUpdate={onUpdate}
        onDelete={onDelete}
        onMove={onMove}
        onToggleLabel={onToggleLabel}
        onUpdateLabel={onUpdateLabel}
        onModalChange={onModalChange}
      />
    </div>
  );
}

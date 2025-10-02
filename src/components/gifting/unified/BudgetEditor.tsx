import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, X, Pencil } from "lucide-react";
import { toast } from "sonner";

interface BudgetEditorProps {
  ruleId: string;
  currentBudget: number;
  onSave: (ruleId: string, newBudget: number) => Promise<void>;
}

export const BudgetEditor = ({ ruleId, currentBudget, onSave }: BudgetEditorProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [budgetValue, setBudgetValue] = useState(currentBudget.toString());
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    const newBudget = parseInt(budgetValue);
    
    // Validate
    if (isNaN(newBudget) || newBudget < 10 || newBudget > 500) {
      toast.error("Budget must be between $10 and $500");
      return;
    }

    setIsSaving(true);
    try {
      await onSave(ruleId, newBudget);
      setIsEditing(false);
    } catch (error) {
      // Error toast already shown by parent
      setBudgetValue(currentBudget.toString());
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setBudgetValue(currentBudget.toString());
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (!isEditing) {
    return (
      <button
        onClick={() => setIsEditing(true)}
        className="flex items-center gap-1.5 text-sm font-medium hover:text-purple-600 transition-colors group"
      >
        <span>Up to ${currentBudget}</span>
        <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        <span className="text-sm font-medium">$</span>
        <Input
          type="number"
          value={budgetValue}
          onChange={(e) => setBudgetValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="h-7 w-20 text-sm"
          min={10}
          max={500}
          disabled={isSaving}
          autoFocus
        />
      </div>
      <Button
        size="sm"
        variant="ghost"
        onClick={handleSave}
        disabled={isSaving}
        className="h-7 w-7 p-0 hover:bg-green-100 hover:text-green-700"
      >
        <Check className="h-4 w-4" />
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={handleCancel}
        disabled={isSaving}
        className="h-7 w-7 p-0 hover:bg-red-100 hover:text-red-700"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
};

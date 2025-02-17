
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { PasswordPrompt } from "./PasswordPrompt";
import { AddCandidateForm } from "./AddCandidateForm";

interface CandidateManagementProps {
  candidates: Array<{ name: string; date: string; shift: string }>;
  onSelectCandidate: (candidate: string) => void;
  onAddCandidate: (data: { name: string; date: string; shift: string }) => void;
}

export const CandidateManagement = ({
  candidates,
  onSelectCandidate,
  onAddCandidate,
}: CandidateManagementProps) => {
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  const handlePasswordSuccess = () => {
    setShowPasswordPrompt(false);
    setShowAddForm(true);
  };

  const handleAddCandidate = (data: { name: string; date: string; shift: string }) => {
    onAddCandidate(data);
    setShowAddForm(false);
  };

  return (
    <div className="space-y-6 p-6 bg-white rounded-lg shadow-sm animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-clinical-800">Candidate Management</h2>
        <Button
          onClick={() => setShowPasswordPrompt(true)}
          className="flex items-center space-x-2"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add Candidate</span>
        </Button>
      </div>

      {!showPasswordPrompt && !showAddForm && (
        <Select onValueChange={onSelectCandidate}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a candidate" />
          </SelectTrigger>
          <SelectContent>
            {candidates.map((candidate) => (
              <SelectItem key={candidate.name} value={candidate.name}>
                {candidate.name} - {candidate.date}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {showPasswordPrompt && (
        <PasswordPrompt
          onSuccess={handlePasswordSuccess}
          onCancel={() => setShowPasswordPrompt(false)}
        />
      )}

      {showAddForm && (
        <AddCandidateForm
          onSubmit={handleAddCandidate}
          onCancel={() => setShowAddForm(false)}
        />
      )}
    </div>
  );
};


import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface CandidateManagementProps {
  onSelectCandidate: (candidate: string) => void;
  onAddCandidate: (data: { name: string; date: string; shift: string }) => void;
}

const PREDEFINED_CANDIDATES = [
  "Shamoon",
  "Arshad",
  "Gowtham",
  "Mohammed",
  "Asad",
  "Shreyas",
  "Kashif",
  "Tejendra",
  "Veera",
  "Kranthi",
  "Likith",
  "Laqsh",
  "Sagar"
];

const ADMIN_PASSWORD = "eeglab2024";

export const CandidateManagement = ({
  onSelectCandidate,
  onAddCandidate,
}: CandidateManagementProps) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [password, setPassword] = useState("");
  const [newName, setNewName] = useState("");
  const [candidates, setCandidates] = useState<string[]>(PREDEFINED_CANDIDATES);
  const { toast } = useToast();

  const fetchCandidates = async () => {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('candidate_name')
        .order('candidate_name');

      if (error) throw error;

      const uniqueCandidates = Array.from(
        new Set([
          ...PREDEFINED_CANDIDATES,
          ...(data?.map(session => session.candidate_name) || [])
        ])
      ).sort();

      setCandidates(uniqueCandidates);
    } catch (error) {
      console.error('Error fetching candidates:', error);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  const handleAddNewCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== ADMIN_PASSWORD) {
      toast({
        title: "Error",
        description: "Incorrect admin password",
        variant: "destructive",
      });
      return;
    }

    if (!newName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a name",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('sessions')
        .insert({
          candidate_name: newName.trim(),
          session_number: 1,
          started_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      onAddCandidate({
        name: newName.trim(),
        date: new Date().toISOString().split('T')[0],
        shift: "6:00 AM - 2:00 PM"
      });

      await fetchCandidates(); // Refresh the candidates list
      setShowAddForm(false);
      setNewName("");
      setPassword("");

      toast({
        title: "Success",
        description: "New candidate added successfully",
      });
    } catch (error) {
      console.error('Error adding candidate:', error);
      toast({
        title: "Error",
        description: "Failed to add candidate",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6 bg-white rounded-lg shadow-sm animate-fade-in">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <h2 className="text-xl md:text-2xl font-semibold text-clinical-800">Candidate Management</h2>
        <Button
          onClick={() => setShowAddForm(true)}
          className="w-full md:w-auto flex items-center gap-2"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add Candidate</span>
        </Button>
      </div>

      {!showAddForm ? (
        <Select onValueChange={onSelectCandidate}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a candidate" />
          </SelectTrigger>
          <SelectContent>
            {candidates.map((candidate) => (
              <SelectItem key={candidate} value={candidate}>
                {candidate}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Card className="p-4 md:p-6">
          <form onSubmit={handleAddNewCandidate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newName">Candidate Name</Label>
              <Input
                id="newName"
                placeholder="Enter new candidate name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Admin Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="flex flex-col md:flex-row gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAddForm(false);
                  setNewName("");
                  setPassword("");
                }}
                className="w-full md:w-auto"
              >
                Cancel
              </Button>
              <Button type="submit" className="w-full md:w-auto">
                Add Candidate
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
};

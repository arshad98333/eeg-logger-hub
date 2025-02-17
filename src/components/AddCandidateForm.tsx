
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";

interface AddCandidateFormProps {
  onSubmit: (data: {
    name: string;
    date: string;
    shift: string;
  }) => void;
  onCancel: () => void;
}

export const AddCandidateForm = ({ onSubmit, onCancel }: AddCandidateFormProps) => {
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [shift, setShift] = useState("6:00 AM - 2:00 PM");
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !date) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    onSubmit({
      name: name.trim(),
      date,
      shift,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-slide-up">
      <div className="space-y-2">
        <Label htmlFor="name">Candidate Name</Label>
        <Input
          id="name"
          placeholder="Enter candidate name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="date">Selection Date</Label>
        <Input
          id="date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <Label>Shift</Label>
        <RadioGroup value={shift} onValueChange={setShift} className="flex flex-col space-y-2">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="6:00 AM - 2:00 PM" id="shift1" />
            <Label htmlFor="shift1">6:00 AM - 2:00 PM</Label>
          </div>
        </RadioGroup>
      </div>

      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onCancel} type="button">
          Cancel
        </Button>
        <Button type="submit">Add Candidate</Button>
      </div>
    </form>
  );
};

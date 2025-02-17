
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface PasswordPromptProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const HARDCODED_PASSWORD = "eeglab2024"; // This would be handled differently in production

export const PasswordPrompt = ({ onSuccess, onCancel }: PasswordPromptProps) => {
  const [password, setPassword] = useState("");
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === HARDCODED_PASSWORD) {
      onSuccess();
    } else {
      toast({
        title: "Incorrect Password",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="animate-fade-in">
      <form onSubmit={handleSubmit} className="space-y-4 p-6 bg-white rounded-lg shadow-lg">
        <h3 className="text-lg font-semibold text-clinical-800">Enter Password</h3>
        <Input
          type="password"
          placeholder="Enter password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full"
        />
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onCancel} type="button">
            Cancel
          </Button>
          <Button type="submit">Submit</Button>
        </div>
      </form>
    </div>
  );
};

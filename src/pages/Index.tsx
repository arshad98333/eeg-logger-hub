
import { useState } from "react";
import { CandidateManagement } from "@/components/CandidateManagement";
import { SessionLogging } from "@/components/SessionLogging";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);
  const { toast } = useToast();

  const handleAddCandidate = (data: { name: string; date: string; shift: string }) => {
    setSelectedCandidate(data.name);
    toast({
      title: "Candidate Added",
      description: "New candidate has been successfully added",
    });
  };

  const handleSaveSession = (sessionData: any) => {
    console.log("Saving session:", sessionData);
    toast({
      title: "Session Saved",
      description: "Session data has been successfully saved",
    });
  };

  return (
    <div className="min-h-screen bg-clinical-100">
      <div className="container mx-auto py-8 space-y-8">
        <CandidateManagement
          onSelectCandidate={setSelectedCandidate}
          onAddCandidate={handleAddCandidate}
        />

        {selectedCandidate && (
          <SessionLogging
            candidateName={selectedCandidate}
            sessionNumber={1}
            onSave={handleSaveSession}
          />
        )}
      </div>
    </div>
  );
};

export default Index;

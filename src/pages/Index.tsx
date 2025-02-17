
import { useState, useEffect } from "react";
import { CandidateManagement } from "@/components/CandidateManagement";
import { SessionLogging } from "@/components/SessionLogging";
import { useToast } from "@/hooks/use-toast";

const STORAGE_KEY = "clinical-session-data";

const Index = () => {
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(() => {
    // Initialize from localStorage
    const stored = localStorage.getItem("selectedCandidate");
    return stored ? stored : null;
  });
  const { toast } = useToast();

  // Save selected candidate to localStorage
  useEffect(() => {
    if (selectedCandidate) {
      localStorage.setItem("selectedCandidate", selectedCandidate);
    }
  }, [selectedCandidate]);

  const handleAddCandidate = (data: { name: string; date: string; shift: string }) => {
    setSelectedCandidate(data.name);
    toast({
      title: "Candidate Added",
      description: "New candidate has been successfully added",
    });
  };

  const handleSaveSession = (sessionData: any) => {
    if (selectedCandidate) {
      // Save session data to localStorage
      const existingData = localStorage.getItem(STORAGE_KEY);
      const allSessions = existingData ? JSON.parse(existingData) : {};
      
      allSessions[selectedCandidate] = {
        ...allSessions[selectedCandidate],
        [sessionData.sessionNumber]: sessionData
      };
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allSessions));
    }
    
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


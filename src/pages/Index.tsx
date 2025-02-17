
import { useState, useEffect } from "react";
import { CandidateManagement } from "@/components/CandidateManagement";
import { SessionLogging } from "@/components/SessionLogging";
import { SessionActions } from "@/components/SessionActions";
import { useToast } from "@/hooks/use-toast";

const STORAGE_KEY = "clinical-session-data";
const COMPLETION_KEY = "completed-candidates";

const Index = () => {
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(() => {
    const stored = localStorage.getItem("selectedCandidate");
    return stored ? stored : null;
  });

  const [isAllSessionsCompleted, setIsAllSessionsCompleted] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (selectedCandidate) {
      localStorage.setItem("selectedCandidate", selectedCandidate);
      checkSessionCompletion();
    }
  }, [selectedCandidate]);

  const checkSessionCompletion = () => {
    if (!selectedCandidate) return;
    
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;

    const allSessions = JSON.parse(stored);
    const candidateData = allSessions[selectedCandidate];
    
    if (!candidateData) return;

    const hasAllSessions = Array.from({ length: 14 }, (_, i) => i + 1)
      .every(sessionNum => candidateData[sessionNum]);

    setIsAllSessionsCompleted(hasAllSessions);
  };

  const handleAddCandidate = (data: { name: string; date: string; shift: string }) => {
    setSelectedCandidate(data.name);
    toast({
      title: "Candidate Added",
      description: "New candidate has been successfully added",
    });
  };

  const handleSaveSession = (sessionData: any) => {
    if (selectedCandidate) {
      const existingData = localStorage.getItem(STORAGE_KEY);
      const allSessions = existingData ? JSON.parse(existingData) : {};
      
      allSessions[selectedCandidate] = {
        ...allSessions[selectedCandidate],
        [sessionData.sessionNumber]: sessionData
      };
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allSessions));
      checkSessionCompletion();
    }
    
    toast({
      title: "Session Saved",
      description: "Session data has been successfully saved",
    });
  };

  const handleMarkAsComplete = () => {
    if (!selectedCandidate || !isAllSessionsCompleted) return;

    const completedCandidates = localStorage.getItem(COMPLETION_KEY);
    const completed = completedCandidates ? JSON.parse(completedCandidates) : [];
    completed.push(selectedCandidate);
    localStorage.setItem(COMPLETION_KEY, JSON.stringify(completed));

    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const allSessions = JSON.parse(stored);
      delete allSessions[selectedCandidate];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allSessions));
    }

    localStorage.removeItem("selectedCandidate");
    setSelectedCandidate(null);
    setIsAllSessionsCompleted(false);

    toast({
      title: "Sessions Completed",
      description: "All sessions have been marked as complete",
    });
  };

  const getCurrentSessionData = () => {
    if (!selectedCandidate) return null;
    
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const allSessions = JSON.parse(stored);
    const candidateData = allSessions[selectedCandidate];
    
    if (!candidateData) return null;

    return Object.values(candidateData)[0];
  };

  return (
    <div className="min-h-screen bg-clinical-100">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <CandidateManagement
          onSelectCandidate={setSelectedCandidate}
          onAddCandidate={handleAddCandidate}
        />

        {selectedCandidate && (
          <>
            <SessionLogging
              candidateName={selectedCandidate}
              sessionNumber={1}
              onSave={handleSaveSession}
            />
            
            <SessionActions
              selectedCandidate={selectedCandidate}
              sessionData={getCurrentSessionData()}
              isAllSessionsCompleted={isAllSessionsCompleted}
              onMarkComplete={handleMarkAsComplete}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default Index;

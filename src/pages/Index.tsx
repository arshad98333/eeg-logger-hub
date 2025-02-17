
import { CandidateManagement } from "@/components/CandidateManagement";
import { SessionLogging } from "@/components/SessionLogging";
import { SessionActions } from "@/components/SessionActions";
import { Header } from "@/components/Header";
import { useSessionManagement } from "@/hooks/useSessionManagement";
import { useState, useEffect } from "react";

const Index = () => {
  const {
    selectedCandidate,
    isAllSessionsCompleted,
    handleAddCandidate,
    handleSaveSession,
    handleMarkAsComplete,
    getCurrentSessionData,
    getInitialSessionNumber,
    setSelectedCandidate
  } = useSessionManagement();

  const [currentSessionData, setCurrentSessionData] = useState(null);

  useEffect(() => {
    const fetchSessionData = async () => {
      if (selectedCandidate) {
        const data = await getCurrentSessionData();
        setCurrentSessionData(data);
      }
    };
    fetchSessionData();
  }, [selectedCandidate]);

  return (
    <div className="min-h-screen bg-clinical-100">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <Header />

        <CandidateManagement
          onSelectCandidate={setSelectedCandidate}
          onAddCandidate={handleAddCandidate}
        />

        {selectedCandidate && (
          <>
            <SessionLogging
              candidateName={selectedCandidate}
              sessionNumber={getInitialSessionNumber()}
              onSave={handleSaveSession}
            />
            
            <SessionActions
              selectedCandidate={selectedCandidate}
              sessionData={currentSessionData}
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

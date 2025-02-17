
import { CandidateManagement } from "@/components/CandidateManagement";
import { SessionLogging } from "@/components/SessionLogging";
import { SessionActions } from "@/components/SessionActions";
import { Header } from "@/components/Header";
import { useSessionManagement } from "@/hooks/useSessionManagement";
import { useEffect, useState } from "react";

interface SessionData {
  candidate_name: string;
  session_number: number;
  impedance_h: string;
  impedance_l: string;
  blocks: Array<{
    block_index: number;
    start_time: string;
    end_time: string;
    notes: string;
  }>;
}

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
  
  const [currentSessionData, setCurrentSessionData] = useState<SessionData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchCurrentSession = async () => {
      if (!selectedCandidate) {
        setCurrentSessionData(null);
        return;
      }

      setIsLoading(true);
      try {
        const data = await getCurrentSessionData();
        // Ensure the data has the required structure before setting it
        if (data && data.blocks) {
          setCurrentSessionData(data);
        } else {
          console.error('Invalid session data structure:', data);
          setCurrentSessionData(null);
        }
      } catch (error) {
        console.error('Error fetching session data:', error);
        setCurrentSessionData(null);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCurrentSession();
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
            
            {!isLoading && currentSessionData && (
              <SessionActions
                selectedCandidate={selectedCandidate}
                sessionData={currentSessionData}
                isAllSessionsCompleted={isAllSessionsCompleted}
                onMarkComplete={handleMarkAsComplete}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Index;

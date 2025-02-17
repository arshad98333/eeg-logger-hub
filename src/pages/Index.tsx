
import { CandidateManagement } from "@/components/CandidateManagement";
import { SessionLogging } from "@/components/SessionLogging";
import { SessionActions } from "@/components/SessionActions";
import { Header } from "@/components/Header";
import { useSessionManagement } from "@/hooks/useSessionManagement";
import { useState, useEffect } from "react";

interface SessionData {
  candidateName: string;
  sessionNumber: number;
  sessionId: string;
  impedanceH: string;
  impedanceL: string;
  blocks: Array<{
    startTime: string;
    endTime: string;
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

  useEffect(() => {
    const storedCandidate = localStorage.getItem("selectedCandidate");
    if (storedCandidate) {
      setSelectedCandidate(storedCandidate);
    }
  }, []);

  useEffect(() => {
    const fetchSessionData = async () => {
      if (selectedCandidate) {
        const data = await getCurrentSessionData();
        if (data) {
          setCurrentSessionData({
            candidateName: selectedCandidate,
            sessionNumber: data.session_number,
            sessionId: data.session_id,
            impedanceH: data.impedance_h || '',
            impedanceL: data.impedance_l || '',
            blocks: data.blocks.map((block: any) => ({
              startTime: block.start_time || '',
              endTime: block.end_time || '',
              notes: block.notes || ''
            }))
          });
        } else {
          setCurrentSessionData(null);
        }
      } else {
        setCurrentSessionData(null);
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

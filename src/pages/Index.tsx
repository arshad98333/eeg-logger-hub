
import { useState, useEffect } from "react";
import { CandidateManagement } from "@/components/CandidateManagement";
import { SessionLogging } from "@/components/SessionLogging";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

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

    // Check if all 14 sessions are present
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

  const formatSessionData = (sessionData: any) => {
    const blocks = sessionData.blocks;
    let formattedText = `Session : ${String(sessionData.sessionNumber).padStart(2, '0')}\n`;
    formattedText += `Session ID : ${selectedCandidate}\n`;
    formattedText += `Impedence : H-${sessionData.impedanceH}/L-${sessionData.impedanceL}\n`;
    formattedText += `TIMINGS:\n\n`;

    blocks.forEach((block: any) => {
      if (block.startTime && block.endTime) {
        formattedText += `${block.startTime}\t${block.endTime}\n`;
      }
    });

    formattedText += `\nNOTES:\n`;
    blocks.forEach((block: any) => {
      formattedText += `${block.notes || 'NO NOTES'}\n`;
    });

    return formattedText;
  };

  const handleShareToWhatsApp = () => {
    if (!selectedCandidate) return;

    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;

    const allSessions = JSON.parse(stored);
    const candidateData = allSessions[selectedCandidate];
    
    if (!candidateData) return;

    const currentSession = Object.values(candidateData)[0] as any;
    const formattedText = formatSessionData(currentSession);
    
    // Encode the text for WhatsApp URL
    const encodedText = encodeURIComponent(formattedText);
    window.open(`https://wa.me/?text=${encodedText}`, '_blank');
  };

  const handleMarkAsComplete = () => {
    if (!selectedCandidate || !isAllSessionsCompleted) return;

    // Save completion status
    const completedCandidates = localStorage.getItem(COMPLETION_KEY);
    const completed = completedCandidates ? JSON.parse(completedCandidates) : [];
    completed.push(selectedCandidate);
    localStorage.setItem(COMPLETION_KEY, JSON.stringify(completed));

    // Clear session data for this candidate
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const allSessions = JSON.parse(stored);
      delete allSessions[selectedCandidate];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allSessions));
    }

    // Clear selected candidate
    localStorage.removeItem("selectedCandidate");
    setSelectedCandidate(null);
    setIsAllSessionsCompleted(false);

    toast({
      title: "Sessions Completed",
      description: "All sessions have been marked as complete",
    });
  };

  const handleDownloadPDF = () => {
    if (!selectedCandidate) return;

    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;

    const allSessions = JSON.parse(stored);
    const candidateData = allSessions[selectedCandidate];
    
    if (!candidateData) return;

    const currentSession = Object.values(candidateData)[0] as any;
    const formattedText = formatSessionData(currentSession);

    // Create a Blob with the text content
    const blob = new Blob([formattedText], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    
    // Create a temporary link and trigger download
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedCandidate}-session-${currentSession.sessionNumber}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-clinical-100">
      <div className="container mx-auto py-8 space-y-8">
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
            
            <div className="flex gap-4 justify-end mt-6">
              <Button 
                variant="outline" 
                onClick={handleShareToWhatsApp}
              >
                Share to WhatsApp
              </Button>
              
              <Button 
                variant="outline" 
                onClick={handleDownloadPDF}
              >
                Download as PDF
              </Button>

              {isAllSessionsCompleted && (
                <Button 
                  onClick={handleMarkAsComplete}
                  className="bg-green-500 hover:bg-green-600"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Mark as Complete
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Index;

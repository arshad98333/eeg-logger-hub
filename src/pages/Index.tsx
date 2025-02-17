import { useState, useEffect } from "react";
import { CandidateManagement } from "@/components/CandidateManagement";
import { SessionLogging } from "@/components/SessionLogging";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import jsPDF from 'jspdf';

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
    
    const encodedText = encodeURIComponent(formattedText);
    window.open(`https://wa.me/?text=${encodedText}`, '_blank');
  };

  const handleSharePDFViaWhatsApp = async () => {
    if (!selectedCandidate) return;

    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;

    const allSessions = JSON.parse(stored);
    const candidateData = allSessions[selectedCandidate];
    
    if (!candidateData) return;

    const currentSession = Object.values(candidateData)[0] as any;
    
    const doc = new jsPDF();
    
    // Header Section
    doc.setFillColor(240, 240, 240);
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(44, 62, 80);
    doc.text("Clinical Session Report", 105, 20, { align: "center" });
    
    // Candidate Info Box
    doc.setFillColor(249, 250, 251);
    doc.rect(10, 45, 190, 25, 'F');
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text("Candidate Details", 15, 55);
    doc.setFont("helvetica", "normal");
    doc.text(`Name: ${selectedCandidate}`, 25, 63);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 120, 63);
    
    // Session Info Box
    doc.setFillColor(249, 250, 251);
    doc.rect(10, 75, 190, 30, 'F');
    doc.setFont("helvetica", "bold");
    doc.text("Session Information", 15, 85);
    doc.setFont("helvetica", "normal");
    doc.text(`Session: ${String(currentSession.sessionNumber).padStart(2, '0')}`, 25, 93);
    doc.text(`Session ID: ${selectedCandidate}`, 120, 93);
    doc.text(`Impedance: H-${currentSession.impedanceH}/L-${currentSession.impedanceL}`, 25, 100);
    
    // Timings Box
    doc.setFillColor(249, 250, 251);
    doc.rect(10, 110, 190, 80, 'F');
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("TIMINGS", 15, 120);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    
    let yPosition = 130;
    currentSession.blocks.forEach((block: any, index: number) => {
      if (block.startTime && block.endTime) {
        doc.text(`Block ${index + 1}:`, 25, yPosition);
        doc.text(`${block.startTime}  -  ${block.endTime}`, 60, yPosition);
        yPosition += 8;
      }
    });
    
    // Notes Box
    doc.setFillColor(249, 250, 251);
    doc.rect(10, 195, 190, 80, 'F');
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("NOTES", 15, 205);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    
    yPosition = 215;
    currentSession.blocks.forEach((block: any, index: number) => {
      const note = block.notes || 'NO NOTES';
      doc.text(`Block ${index + 1}:`, 25, yPosition);
      const splitNotes = doc.splitTextToSize(note, 150);
      doc.text(splitNotes, 60, yPosition);
      yPosition += 8 * splitNotes.length + 2;
    });
    
    // Footer
    doc.setFillColor(240, 240, 240);
    doc.rect(0, 275, 210, 22, 'F');
    doc.setFontSize(10);
    doc.setTextColor(128, 128, 128);
    doc.text("Generated by Clinical Session Logger", 105, 287, { align: "center" });
    
    const pdfData = doc.output('datauristring');
    
    window.open(`https://wa.me/?text=${encodeURIComponent('Clinical Session Report')}&document=${encodeURIComponent(pdfData)}`, '_blank');
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

  const handleDownloadPDF = () => {
    if (!selectedCandidate) return;

    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;

    const allSessions = JSON.parse(stored);
    const candidateData = allSessions[selectedCandidate];
    
    if (!candidateData) return;

    const currentSession = Object.values(candidateData)[0] as any;
    
    const doc = new jsPDF();
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    
    doc.text("Clinical Session Report", 105, 20, { align: "center" });
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Candidate: ${selectedCandidate}`, 20, 40);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 48);
    
    doc.setFont("helvetica", "bold");
    doc.text(`Session: ${String(currentSession.sessionNumber).padStart(2, '0')}`, 20, 60);
    doc.text(`Session ID: ${selectedCandidate}`, 20, 68);
    doc.text(`Impedance: H-${currentSession.impedanceH}/L-${currentSession.impedanceL}`, 20, 76);
    
    doc.setFont("helvetica", "bold");
    doc.text("TIMINGS:", 20, 90);
    doc.setFont("helvetica", "normal");
    
    let yPosition = 100;
    currentSession.blocks.forEach((block: any, index: number) => {
      if (block.startTime && block.endTime) {
        doc.text(`${block.startTime}  -  ${block.endTime}`, 20, yPosition);
        yPosition += 8;
      }
    });
    
    yPosition += 10;
    doc.setFont("helvetica", "bold");
    doc.text("NOTES:", 20, yPosition);
    doc.setFont("helvetica", "normal");
    
    yPosition += 10;
    currentSession.blocks.forEach((block: any, index: number) => {
      const note = block.notes || 'NO NOTES';
      const splitNotes = doc.splitTextToSize(note, 170);
      doc.text(splitNotes, 20, yPosition);
      yPosition += 10 * splitNotes.length;
    });
    
    doc.setFontSize(10);
    doc.setTextColor(128, 128, 128);
    doc.text("Generated by Clinical Session Logger", 105, 280, { align: "center" });
    
    doc.save(`${selectedCandidate}-session-${currentSession.sessionNumber}.pdf`);
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
                Share Text to WhatsApp
              </Button>
              
              <Button 
                variant="outline" 
                onClick={handleDownloadPDF}
              >
                Download as PDF
              </Button>

              <Button 
                variant="outline" 
                onClick={handleSharePDFViaWhatsApp}
              >
                Share PDF via WhatsApp
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

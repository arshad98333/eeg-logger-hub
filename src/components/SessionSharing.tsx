
import { Button } from "@/components/ui/button";
import { generateSessionPDF } from "@/utils/pdfGenerator";
import { formatSessionData } from "@/utils/sessionFormatter";
import { CheckCircle } from "lucide-react";

interface SessionSharingProps {
  selectedCandidate: string | null;
  sessionData: any;
  isAllSessionsCompleted: boolean;
  onMarkComplete: () => void;
}

export const SessionSharing = ({
  selectedCandidate,
  sessionData,
  isAllSessionsCompleted,
  onMarkComplete
}: SessionSharingProps) => {
  const handleShareToWhatsApp = () => {
    if (!selectedCandidate || !sessionData) return;
    const formattedText = formatSessionData(sessionData, selectedCandidate);
    const encodedText = encodeURIComponent(formattedText);
    window.open(`https://wa.me/?text=${encodedText}`, '_blank');
  };

  const handleDownloadPDF = () => {
    if (!selectedCandidate || !sessionData) return;
    const doc = generateSessionPDF(selectedCandidate, sessionData);
    doc.save(`${selectedCandidate}-session-${sessionData.sessionNumber}.pdf`);
  };

  const handleSharePDFViaWhatsApp = () => {
    if (!selectedCandidate || !sessionData) return;
    const doc = generateSessionPDF(selectedCandidate, sessionData);
    const pdfData = doc.output('datauristring');
    window.open(`https://wa.me/?text=${encodeURIComponent('Clinical Session Report')}&document=${encodeURIComponent(pdfData)}`, '_blank');
  };

  return (
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
          onClick={onMarkComplete}
          className="bg-green-500 hover:bg-green-600"
        >
          <CheckCircle className="mr-2 h-4 w-4" />
          Mark as Complete
        </Button>
      )}
    </div>
  );
};

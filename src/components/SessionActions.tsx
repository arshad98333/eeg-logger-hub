
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { generateSessionPDF } from "@/utils/pdfGenerator";

interface SessionActionsProps {
  selectedCandidate: string | null;
  sessionData: any;
  isAllSessionsCompleted: boolean;
  onMarkComplete: () => void;
}

export const SessionActions = ({
  selectedCandidate,
  sessionData,
  isAllSessionsCompleted,
  onMarkComplete
}: SessionActionsProps) => {
  const handleShareToWhatsApp = () => {
    if (!selectedCandidate || !sessionData) return;

    const formattedText = formatSessionData(sessionData);
    const encodedText = encodeURIComponent(formattedText);
    window.open(`https://wa.me/?text=${encodedText}`, '_blank');
  };

  const handleDownloadPDF = () => {
    if (!selectedCandidate || !sessionData) return;
    const doc = generateSessionPDF(selectedCandidate, sessionData);
    doc.save(`${selectedCandidate}-session-${sessionData.sessionNumber}.pdf`);
  };

  const formatSessionData = (sessionData: any) => {
    if (!sessionData || !Array.isArray(sessionData.blocks)) {
      return "No session data available";
    }

    let formattedText = `Session : ${String(sessionData.sessionNumber).padStart(2, '0')}\n`;
    formattedText += `Session ID : ${selectedCandidate}\n`;
    formattedText += `Impedence : H-${sessionData.impedanceH || 'N/A'}/L-${sessionData.impedanceL || 'N/A'}\n`;
    formattedText += `TIMINGS:\n\n`;

    sessionData.blocks.forEach((block: any, index: number) => {
      if (block && (block.startTime || block.endTime)) {
        formattedText += `Block ${index}: ${block.startTime || 'N/A'}\t${block.endTime || 'N/A'}\n`;
      }
    });

    formattedText += `\nNOTES:\n`;
    sessionData.blocks.forEach((block: any, index: number) => {
      formattedText += `Block ${index}: ${block?.notes || 'NO NOTES'}\n`;
    });

    return formattedText;
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-end mt-6">
      <Button 
        variant="outline" 
        onClick={handleShareToWhatsApp}
        className="w-full sm:w-auto"
        disabled={!sessionData}
      >
        Share Text to WhatsApp
      </Button>
      
      <Button 
        variant="outline" 
        onClick={handleDownloadPDF}
        className="w-full sm:w-auto"
        disabled={!sessionData}
      >
        Download as PDF
      </Button>

      {isAllSessionsCompleted && (
        <Button 
          onClick={onMarkComplete}
          className="w-full sm:w-auto bg-green-500 hover:bg-green-600"
        >
          <CheckCircle className="mr-2 h-4 w-4" />
          Mark as Complete
        </Button>
      )}
    </div>
  );
};

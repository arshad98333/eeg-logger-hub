
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

  const handleSharePDFViaWhatsApp = () => {
    if (!selectedCandidate || !sessionData) return;
    const doc = generateSessionPDF(selectedCandidate, sessionData);
    const pdfData = doc.output('datauristring');
    window.open(`https://wa.me/?text=${encodeURIComponent('Clinical Session Report')}&document=${encodeURIComponent(pdfData)}`, '_blank');
  };

  const formatSessionData = (sessionData: any) => {
    const blocks = sessionData.blocks;
    let formattedText = `Session : ${String(sessionData.sessionNumber).padStart(2, '0')}\n`;
    formattedText += `Session ID : ${selectedCandidate}\n`;
    formattedText += `Impedence : H-${sessionData.impedanceH}/L-${sessionData.impedanceL}\n`;
    formattedText += `TIMINGS:\n\n`;

    blocks.forEach((block: any, index: number) => {
      if (block.startTime && block.endTime) {
        formattedText += `Block ${index}: ${block.startTime}\t${block.endTime}\n`;
      }
    });

    formattedText += `\nNOTES:\n`;
    blocks.forEach((block: any, index: number) => {
      formattedText += `Block ${index}: ${block.notes || 'NO NOTES'}\n`;
    });

    return formattedText;
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-end mt-6">
      <Button 
        variant="outline" 
        onClick={handleShareToWhatsApp}
        className="w-full sm:w-auto"
      >
        Share Text to WhatsApp
      </Button>
      
      <Button 
        variant="outline" 
        onClick={handleDownloadPDF}
        className="w-full sm:w-auto"
      >
        Download as PDF
      </Button>

      <Button 
        variant="outline" 
        onClick={handleSharePDFViaWhatsApp}
        className="w-full sm:w-auto"
      >
        Share PDF via WhatsApp
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

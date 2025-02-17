
import { Button } from "@/components/ui/button";
import { CheckCircle, Download, Share } from "lucide-react";
import { generateSessionPDF } from "@/utils/pdfGenerator";
import { useToast } from "@/components/ui/use-toast";

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
  const { toast } = useToast();

  const handleShareToWhatsApp = () => {
    if (!selectedCandidate || !sessionData) {
      toast({
        title: "Error",
        description: "No session data available to share",
        variant: "destructive"
      });
      return;
    }

    const formattedText = formatSessionData(sessionData);
    const encodedText = encodeURIComponent(formattedText);
    window.open(`https://wa.me/?text=${encodedText}`, '_blank');
    
    toast({
      title: "Success",
      description: "WhatsApp sharing window opened",
    });
  };

  const handleDownloadPDF = () => {
    if (!selectedCandidate || !sessionData) {
      toast({
        title: "Error",
        description: "No session data available to download",
        variant: "destructive"
      });
      return;
    }

    try {
      const doc = generateSessionPDF(selectedCandidate, sessionData);
      doc.save(`${selectedCandidate}-session-${sessionData.sessionNumber}.pdf`);
      
      toast({
        title: "Success",
        description: "PDF downloaded successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate PDF",
        variant: "destructive"
      });
    }
  };

  const formatSessionData = (sessionData: any) => {
    const blocks = sessionData.blocks;
    let formattedText = `*Clinical Session Report*\n\n`;
    formattedText += `*Session* : ${String(sessionData.sessionNumber).padStart(2, '0')}\n`;
    formattedText += `*Session ID* : ${selectedCandidate}\n`;
    formattedText += `*Impedance* : H-${sessionData.impedanceH}/L-${sessionData.impedanceL}\n\n`;
    formattedText += `*TIMINGS:*\n\n`;

    blocks.forEach((block: any, index: number) => {
      if (block.startTime && block.endTime) {
        formattedText += `Block ${index}: ${block.startTime} - ${block.endTime}\n`;
      }
    });

    formattedText += `\n*NOTES:*\n`;
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
        <Share className="mr-2 h-4 w-4" />
        Share to WhatsApp
      </Button>
      
      <Button 
        variant="outline" 
        onClick={handleDownloadPDF}
        className="w-full sm:w-auto"
      >
        <Download className="mr-2 h-4 w-4" />
        Download PDF
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

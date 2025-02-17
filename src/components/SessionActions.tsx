
import { Button } from "@/components/ui/button";
import { CheckCircle, Download, Share } from "lucide-react";
import { generateSessionPDF } from "@/utils/pdfGenerator";
import { useToast } from "@/components/ui/use-toast";

interface Block {
  startTime: string;
  endTime: string;
  notes: string;
}

interface SessionData {
  sessionNumber: number;
  sessionId: string;
  blocks: Block[];
}

interface SessionActionsProps {
  selectedCandidate: string | null;
  sessionData: SessionData;
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

  const validateSessionData = () => {
    if (!selectedCandidate || !sessionData) {
      toast({
        title: "Error",
        description: "No session data available",
        variant: "destructive"
      });
      return false;
    }
    return true;
  };

  const handleShareToWhatsApp = () => {
    if (!validateSessionData()) return;

    try {
      const formattedText = formatSessionData(sessionData);
      const encodedText = encodeURIComponent(formattedText);
      window.open(`https://wa.me/?text=${encodedText}`, '_blank');
      
      toast({
        title: "Success",
        description: "WhatsApp sharing window opened",
      });
    } catch (error) {
      console.error('WhatsApp Sharing Error:', error);
      toast({
        title: "Error",
        description: "Failed to share to WhatsApp",
        variant: "destructive"
      });
    }
  };

  const handleDownloadPDF = () => {
    if (!validateSessionData()) return;

    try {
      const doc = generateSessionPDF(selectedCandidate, sessionData);
      doc.save(`${selectedCandidate}-session-${sessionData.sessionNumber}.pdf`);
      
      toast({
        title: "Success",
        description: "PDF downloaded successfully",
      });
    } catch (error) {
      console.error('PDF Generation Error:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF",
        variant: "destructive"
      });
    }
  };

  const formatSessionData = (data: SessionData) => {
    let formattedText = `Session ${data.sessionNumber}\n\n`;
    formattedText += `Session ID: ${data.sessionId}\n\n`;
    formattedText += `Blocks:\n\n`;

    data.blocks.forEach((block, index) => {
      formattedText += `Block ${index}\n`;
      if (block.startTime) {
        formattedText += `Start Time: ${block.startTime}\n`;
      }
      if (block.endTime) {
        formattedText += `End Time: ${block.endTime}\n`;
      }
      if (block.notes && block.notes.trim() !== '') {
        formattedText += `Notes: ${block.notes}\n`;
      }
      formattedText += '\n';
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
        <Share className="mr-2 h-4 w-4" />
        Share to WhatsApp
      </Button>
      
      <Button 
        variant="outline" 
        onClick={handleDownloadPDF}
        className="w-full sm:w-auto"
        disabled={!sessionData}
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

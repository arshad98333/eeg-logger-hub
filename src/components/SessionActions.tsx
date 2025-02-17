
import { Button } from "@/components/ui/button";
import { CheckCircle, Download, Share } from "lucide-react";
import { generateSessionPDF } from "@/utils/pdfGenerator";
import { useToast } from "@/hooks/use-toast";

interface Block {
  startTime: string;
  endTime: string;
  notes: string;
}

interface SessionData {
  candidateName: string;
  sessionNumber: number;
  sessionId: string;
  impedanceH: string;
  impedanceL: string;
  blocks: Block[];
}

interface SessionActionsProps {
  selectedCandidate: string | null;
  sessionData: SessionData | null;
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
    if (!validateSessionData() || !sessionData) return;

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
    if (!validateSessionData() || !sessionData) return;

    try {
      // Use the exact frontend data for PDF generation
      generateSessionPDF(selectedCandidate!, {
        sessionNumber: sessionData.sessionNumber,
        impedanceH: sessionData.impedanceH,
        impedanceL: sessionData.impedanceL,
        session_id: sessionData.sessionId,
        blocks: sessionData.blocks.map(block => ({
          start_time: block.startTime,
          end_time: block.endTime,
          notes: block.notes
        }))
      });
      
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
    let formattedText = `Session Details:\n`;
    formattedText += `Session Number: ${data.sessionNumber}\n`;
    formattedText += `Session ID: ${data.sessionId}\n\n`;
    
    formattedText += `Impedance Values:\n`;
    formattedText += `High: ${data.impedanceH || 'Not set'}\n`;
    formattedText += `Low: ${data.impedanceL || 'Not set'}\n\n`;
    
    formattedText += `Block Details:\n`;
    data.blocks.forEach((block, index) => {
      if (block.startTime || block.endTime || block.notes) {
        formattedText += `\nBlock ${index + 1}:\n`;
        if (block.startTime) formattedText += `Start: ${block.startTime}\n`;
        if (block.endTime) formattedText += `End: ${block.endTime}\n`;
        if (block.notes) formattedText += `Notes: ${block.notes}\n`;
      }
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


import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { generateSessionPDF } from "@/utils/pdfGenerator";
import { useToast } from "@/hooks/use-toast";

interface BlockData {
  block_index: number;
  start_time: string;
  end_time: string;
  notes: string;
}

interface SessionData {
  candidate_name: string;
  session_number: number;
  impedance_h: string;
  impedance_l: string;
  blocks: BlockData[];
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
  onMarkComplete,
}: SessionActionsProps) => {
  const { toast } = useToast();

  const handleShareToWhatsApp = () => {
    if (!selectedCandidate || !sessionData || !sessionData.blocks) {
      toast({
        title: "Error",
        description: "No session data available to share",
        variant: "destructive",
      });
      return;
    }

    const formattedText = formatSessionData(sessionData);
    const encodedText = encodeURIComponent(formattedText);
    window.open(`https://wa.me/?text=${encodedText}`, '_blank');
  };

  const handleDownloadPDF = () => {
    if (!selectedCandidate || !sessionData || !sessionData.blocks) {
      toast({
        title: "Error",
        description: "No session data available to download",
        variant: "destructive",
      });
      return;
    }

    try {
      const doc = generateSessionPDF(selectedCandidate, sessionData);
      doc.save(`${selectedCandidate}-session-${sessionData.session_number}.pdf`);
      toast({
        title: "Success",
        description: "PDF downloaded successfully",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF",
        variant: "destructive",
      });
    }
  };

  const formatSessionData = (data: SessionData): string => {
    let formattedText = `Session : ${String(data.session_number).padStart(2, '0')}\n`;
    formattedText += `Session ID : ${selectedCandidate}\n`;
    formattedText += `Impedance : H-${data.impedance_h}/L-${data.impedance_l}\n`;
    formattedText += `TIMINGS:\n\n`;

    // Ensure blocks exists and is an array before using forEach
    if (Array.isArray(data.blocks)) {
      data.blocks.forEach((block) => {
        if (block.start_time && block.end_time) {
          formattedText += `Block ${block.block_index}: ${block.start_time}\t${block.end_time}\n`;
        }
      });

      formattedText += `\nNOTES:\n`;
      data.blocks.forEach((block) => {
        formattedText += `Block ${block.block_index}: ${block.notes || 'NO NOTES'}\n`;
      });
    }

    return formattedText;
  };

  // Don't render anything if we don't have valid session data
  if (!sessionData || !sessionData.blocks) {
    return null;
  }

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

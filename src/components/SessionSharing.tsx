
import { Button } from "@/components/ui/button";
import { generateSessionPDF } from "@/utils/pdfGenerator";
import { formatSessionData } from "@/utils/sessionFormatter";
import { CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

    try {
      const formattedText = formatSessionData(sessionData, selectedCandidate);
      const encodedText = encodeURIComponent(formattedText);
      window.open(`https://wa.me/?text=${encodedText}`, '_blank');
    } catch (error) {
      console.error('Error sharing to WhatsApp:', error);
      toast({
        title: "Error",
        description: "Failed to share session data",
        variant: "destructive"
      });
    }
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
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF",
        variant: "destructive"
      });
    }
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

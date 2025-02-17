
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

  const validateSessionData = () => {
    if (!selectedCandidate || !sessionData) {
      toast({
        title: "Error",
        description: "No session data available",
        variant: "destructive"
      });
      return false;
    }

    if (!sessionData.blocks || !Array.isArray(sessionData.blocks)) {
      toast({
        title: "Error",
        description: "Invalid session data structure",
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

  const formatSessionData = (data: any) => {
    let formattedText = `*CLINICAL SESSION REPORT*\n\n`;
    
    // Candidate Information
    formattedText += `*CANDIDATE INFORMATION*\n`;
    formattedText += `Name: ${selectedCandidate}\n`;
    formattedText += `Date: ${new Date().toLocaleDateString()}\n`;
    formattedText += `Time: ${new Date().toLocaleTimeString()}\n\n`;
    
    // Session Information
    formattedText += `*SESSION INFORMATION*\n`;
    formattedText += `Session Number: ${String(data.sessionNumber || '').padStart(2, '0')}\n`;
    formattedText += `Session ID: ${selectedCandidate}\n\n`;
    
    // Impedance Values
    formattedText += `*IMPEDANCE VALUES*\n`;
    formattedText += `High (H): ${data.impedanceH || 'N/A'}\n`;
    formattedText += `Low (L): ${data.impedanceL || 'N/A'}\n\n`;
    
    // Block Information
    formattedText += `*BLOCK DETAILS*\n\n`;
    
    data.blocks.forEach((block: any, index: number) => {
      if (block) {
        formattedText += `*BLOCK ${index}*\n`;
        formattedText += `Start Time: ${block.startTime || 'Not recorded'}\n`;
        formattedText += `End Time: ${block.endTime || 'Not recorded'}\n`;
        formattedText += `Duration: ${block.startTime && block.endTime ? 
          calculateDuration(block.startTime, block.endTime) : 'N/A'}\n`;
        formattedText += `Notes: ${block.notes || 'No notes recorded'}\n\n`;
      }
    });
    
    // Session Status
    formattedText += `*SESSION STATUS*\n`;
    formattedText += `Completed: ${isAllSessionsCompleted ? 'Yes' : 'No'}\n\n`;
    
    return formattedText;
  };

  const calculateDuration = (startTime: string, endTime: string) => {
    try {
      const [startHours, startMinutes] = startTime.split(':').map(Number);
      const [endHours, endMinutes] = endTime.split(':').map(Number);
      
      let durationMinutes = (endHours * 60 + endMinutes) - (startHours * 60 + startMinutes);
      
      if (durationMinutes < 0) {
        durationMinutes += 24 * 60; // Add 24 hours if end time is on next day
      }
      
      const hours = Math.floor(durationMinutes / 60);
      const minutes = durationMinutes % 60;
      
      return `${hours}h ${minutes}m`;
    } catch {
      return 'Invalid duration';
    }
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

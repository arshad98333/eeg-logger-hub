
import { Button } from "@/components/ui/button";
import { CheckCircle, Download, Share } from "lucide-react";
import { generateSessionPDF } from "@/utils/pdfGenerator";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

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
    return true;
  };

  const fetchSessionBlocks = async (sessionId: string) => {
    const { data: blocks, error } = await supabase
      .from('blocks')
      .select('*')
      .eq('session_id', sessionId)
      .order('block_index');

    if (error) {
      console.error('Error fetching blocks:', error);
      return [];
    }

    return blocks || [];
  };

  const handleShareToWhatsApp = async () => {
    if (!validateSessionData()) return;

    try {
      const blocks = await fetchSessionBlocks(sessionData.id);
      const formattedText = formatSessionData(sessionData, blocks);
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

  const handleDownloadPDF = async () => {
    if (!validateSessionData()) return;

    try {
      const blocks = await fetchSessionBlocks(sessionData.id);
      const doc = generateSessionPDF(selectedCandidate, { ...sessionData, blocks });
      doc.save(`${selectedCandidate}-session-${sessionData.session_number}.pdf`);
      
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

  const formatTimeTo12Hour = (time24: string) => {
    if (!time24) return '';
    try {
      const [hours, minutes, seconds] = time24.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'pm' : 'am';
      const hour12 = hour % 12 || 12;
      return `${String(hour12).padStart(2, '0')}:${minutes}:${seconds || '00'} ${ampm}`;
    } catch {
      return '';
    }
  };

  const formatSessionData = (session: any, blocks: any[]) => {
    let formattedText = `Session ${session.session_number || ''}\n\n`;
    formattedText += `Session ID: ${session.session_id || ''}\n\n`;
    formattedText += `Blocks:\n\n`;

    blocks.forEach((block, index) => {
      formattedText += `Block ${block.block_index}\n`;
      if (block.start_time) {
        formattedText += `Start Time: ${formatTimeTo12Hour(block.start_time)}\n`;
      }
      if (block.end_time) {
        formattedText += `End Time: ${formatTimeTo12Hour(block.end_time)}\n`;
      }
      if (block.notes) {
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

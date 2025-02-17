
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { TimeBlock } from "./TimeBlock";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface SessionLoggingProps {
  candidateName: string;
  sessionNumber: number;
  onSave: (sessionData: any) => void;
}

interface Block {
  startTime: string;
  endTime: string;
  notes: string;
  isRecording: boolean;
}

interface SessionData {
  candidateName: string;
  sessionNumber: number;
  impedanceH: string;
  impedanceL: string;
  blocks: Block[];
}

export const SessionLogging = ({ candidateName, sessionNumber: initialSession, onSave }: SessionLoggingProps) => {
  const [currentSession, setCurrentSession] = useState(initialSession);
  const [sessionData, setSessionData] = useState<SessionData>({
    candidateName,
    sessionNumber: currentSession,
    impedanceH: "",
    impedanceL: "",
    blocks: Array(7).fill({ startTime: "", endTime: "", notes: "", isRecording: false })
  });
  const { toast } = useToast();

  const handleBlockChange = (index: number, field: "startTime" | "endTime" | "notes" | "isRecording", value: any) => {
    const newBlocks = [...sessionData.blocks];
    newBlocks[index] = {
      ...newBlocks[index],
      [field]: value,
    };

    setSessionData(prev => ({
      ...prev,
      blocks: newBlocks
    }));

    if (field === "isRecording" && value === true) {
      // Only save to database when recording starts
      saveBlockToDatabase(index, newBlocks[index]);
    }
  };

  const saveBlockToDatabase = async (index: number, blockData: Block) => {
    try {
      const { data: sessionRecord, error: sessionError } = await supabase
        .from('sessions')
        .insert({
          candidate_name: candidateName,
          session_number: currentSession,
          started_at: new Date().toISOString(),
          user_id: 'default'
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      const { error: blockError } = await supabase
        .from('blocks')
        .insert({
          session_id: sessionRecord.id,
          block_index: index,
          start_time: blockData.startTime,
          end_time: blockData.endTime,
          notes: blockData.notes,
          is_recording: blockData.isRecording,
        });

      if (blockError) throw blockError;

      toast({
        title: "Recording Started",
        description: `Block ${index + 1} recording initiated`,
      });
    } catch (error) {
      console.error('Error saving block:', error);
      toast({
        title: "Error",
        description: "Failed to start recording",
        variant: "destructive",
      });
    }
  };

  const handleSessionChange = (direction: 'next' | 'prev') => {
    if (direction === 'next' && currentSession < 14) {
      setCurrentSession(prev => prev + 1);
      setSessionData(prev => ({
        ...prev,
        sessionNumber: currentSession + 1,
        blocks: Array(7).fill({ startTime: "", endTime: "", notes: "", isRecording: false })
      }));
    } else if (direction === 'prev' && currentSession > 1) {
      setCurrentSession(prev => prev - 1);
      setSessionData(prev => ({
        ...prev,
        sessionNumber: currentSession - 1,
        blocks: Array(7).fill({ startTime: "", endTime: "", notes: "", isRecording: false })
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(sessionData);
    toast({
      title: "Success",
      description: "Session saved successfully",
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-slide-up px-4 md:px-0">
      <Card className="p-4 md:p-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-4">
          <h3 className="text-xl font-semibold">
            Session {currentSession}
          </h3>
          <div className="flex items-center space-x-2 md:space-x-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => handleSessionChange('prev')}
              disabled={currentSession <= 1}
              className="px-2 md:px-4"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden md:inline ml-1">Previous</span>
            </Button>
            <span className="text-sm font-medium">
              {currentSession} / 14
            </span>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => handleSessionChange('next')}
              disabled={currentSession >= 14}
              className="px-2 md:px-4"
            >
              <span className="hidden md:inline mr-1">Next</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-clinical-800">Impedance Values</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="impedanceH">High</Label>
                <Input
                  id="impedanceH"
                  placeholder="H-value"
                  value={sessionData.impedanceH}
                  onChange={(e) => setSessionData(prev => ({
                    ...prev,
                    impedanceH: e.target.value
                  }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="impedanceL">Low</Label>
                <Input
                  id="impedanceL"
                  placeholder="L-value"
                  value={sessionData.impedanceL}
                  onChange={(e) => setSessionData(prev => ({
                    ...prev,
                    impedanceL: e.target.value
                  }))}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4 mt-6">
          {sessionData.blocks.map((block, index) => (
            <div key={index} className="border rounded-lg p-4 bg-clinical-50">
              <TimeBlock
                index={index}
                startTime={block.startTime}
                endTime={block.endTime}
                notes={block.notes}
                sessionId={`${candidateName}-${currentSession}-${index}`}
                onChange={handleBlockChange}
              />
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <Button type="submit">Save Session</Button>
        </div>
      </Card>
    </form>
  );
};

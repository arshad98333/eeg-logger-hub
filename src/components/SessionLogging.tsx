import { useState, useEffect } from "react";
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

interface SessionData {
  id: string;
  candidate_name: string;
  session_number: number;
  impedance_h?: string;
  impedance_l?: string;
  blocks: Array<{
    id?: string;
    startTime: string;
    endTime: string;
    notes: string;
    isRecording: boolean;
  }>;
}

export const SessionLogging = ({ candidateName, sessionNumber: initialSession, onSave }: SessionLoggingProps) => {
  const [currentSession, setCurrentSession] = useState(initialSession);
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadSessionData();
  }, [candidateName, currentSession]);

  const loadSessionData = async () => {
    try {
      setIsLoading(true);

      const { data: existingSession, error: fetchError } = await supabase
        .from('sessions')
        .select('*')
        .eq('candidate_name', candidateName)
        .eq('session_number', currentSession)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (existingSession) {
        const { data: blocks } = await supabase
          .from('blocks')
          .select('*')
          .eq('session_id', existingSession.id)
          .order('block_index', { ascending: true });

        setSessionData({
          ...existingSession,
          blocks: blocks?.map(block => ({
            id: block.id,
            startTime: block.start_time || "",
            endTime: block.end_time || "",
            notes: block.notes || "",
            isRecording: block.is_recording || false,
          })) || Array(7).fill({ startTime: "", endTime: "", notes: "", isRecording: false })
        });
      } else {
        const { data: newSession, error: insertError } = await supabase
          .from('sessions')
          .insert({
            candidate_name: candidateName,
            session_number: currentSession,
            started_at: new Date().toISOString(),
            user_id: 'default'
          })
          .select()
          .single();

        if (insertError) throw insertError;
        if (newSession) {
          setSessionData({
            ...newSession,
            blocks: Array(7).fill({ startTime: "", endTime: "", notes: "", isRecording: false })
          });
        }
      }
    } catch (error) {
      console.error('Error loading session:', error);
      toast({
        title: "Error",
        description: "Failed to load session data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBlockChange = (index: number, field: "startTime" | "endTime" | "notes" | "isRecording", value: any) => {
    if (!sessionData) return;

    const newBlocks = [...sessionData.blocks];
    newBlocks[index] = {
      ...newBlocks[index],
      [field]: value,
    };

    setSessionData(prev => prev ? {
      ...prev,
      blocks: newBlocks
    } : null);

    saveBlockToDatabase(index, newBlocks[index]);
  };

  const saveBlockToDatabase = async (index: number, blockData: any) => {
    if (!sessionData) return;

    try {
      const data = {
        session_id: sessionData.id,
        block_index: index,
        start_time: blockData.startTime,
        end_time: blockData.endTime,
        notes: blockData.notes,
        is_recording: blockData.isRecording,
      };

      if (blockData.id) {
        await supabase
          .from('blocks')
          .update(data)
          .eq('id', blockData.id);
      } else {
        await supabase
          .from('blocks')
          .insert(data)
          .select();
      }
    } catch (error) {
      console.error('Error saving block:', error);
    }
  };

  const handleSessionChange = (direction: 'next' | 'prev') => {
    if (direction === 'next' && currentSession < 14) {
      setCurrentSession(prev => prev + 1);
    } else if (direction === 'prev' && currentSession > 1) {
      setCurrentSession(prev => prev - 1);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionData) return;
    
    onSave(sessionData);
    toast({
      title: "Success",
      description: "Session saved successfully",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-pulse text-clinical-800">Loading session data...</div>
      </div>
    );
  }

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
          <div className="space-y-2">
            <Label htmlFor="sessionId">Session ID</Label>
            <Input
              id="sessionId"
              placeholder="Enter session ID (e.g., AR0007)"
              value={sessionData?.id || ""}
              readOnly
            />
          </div>

          <div className="space-y-4">
            <h4 className="text-lg font-medium text-clinical-800">Impedance Values</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="impedanceH">High</Label>
                <Input
                  id="impedanceH"
                  placeholder="H-value"
                  value={sessionData?.impedance_h || ""}
                  onChange={(e) => setSessionData(prev => prev ? {
                    ...prev,
                    impedance_h: e.target.value
                  } : null)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="impedanceL">Low</Label>
                <Input
                  id="impedanceL"
                  placeholder="L-value"
                  value={sessionData?.impedance_l || ""}
                  onChange={(e) => setSessionData(prev => prev ? {
                    ...prev,
                    impedance_l: e.target.value
                  } : null)}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4 mt-6">
          {sessionData?.blocks.map((block, index) => (
            <div key={index} className="border rounded-lg p-4 bg-clinical-50">
              <TimeBlock
                index={index}
                startTime={block.startTime}
                endTime={block.endTime}
                notes={block.notes}
                sessionId={sessionData.id}
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

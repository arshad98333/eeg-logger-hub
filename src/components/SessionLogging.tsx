
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { TimeBlock } from "./TimeBlock";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY = "clinical-session-data";

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
  sessionId: string;
  impedanceH: string;
  impedanceL: string;
  blocks: Block[];
}

export const SessionLogging = ({ candidateName, sessionNumber: initialSession, onSave }: SessionLoggingProps) => {
  const [currentSession, setCurrentSession] = useState(initialSession);
  const [sessionData, setSessionData] = useState<SessionData>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const allSessions = JSON.parse(stored);
      const candidateData = allSessions[candidateName];
      if (candidateData && candidateData[initialSession]) {
        return candidateData[initialSession];
      }
    }
    
    // Initialize empty session data
    return {
      candidateName,
      sessionNumber: initialSession,
      sessionId: currentSession === 1 ? "1" : "0", // Only set initial session ID for session 1
      impedanceH: "",
      impedanceL: "",
      blocks: Array(14).fill({ startTime: "", endTime: "", notes: "", isRecording: false })
    };
  });
  
  const { toast } = useToast();

  useEffect(() => {
    const loadSessionState = async () => {
      try {
        const { data, error } = await supabase
          .from('sessions')
          .select('*')
          .eq('candidate_name', candidateName)
          .eq('session_number', currentSession)
          .maybeSingle();

        if (error) {
          console.error('Error loading session state:', error);
          return;
        }

        if (data) {
          // If data exists, load it
          setSessionData(prev => ({
            ...prev,
            sessionId: data.session_id || String(currentSession),
            impedanceH: data.impedance_h || "",
            impedanceL: data.impedance_l || "",
          }));
        } else {
          // If no session exists, create one with appropriate initial values
          const initialSessionData = {
            candidate_name: candidateName,
            session_number: currentSession,
            session_id: currentSession === 1 ? "1" : "0", // Only set session ID for first session
            current_block: 1,
            started_at: new Date().toISOString(),
            impedance_h: currentSession === 1 ? sessionData.impedanceH : "", // Only keep impedance values for session 1
            impedance_l: currentSession === 1 ? sessionData.impedanceL : ""
          };

          const { error: insertError } = await supabase
            .from('sessions')
            .insert(initialSessionData);

          if (insertError) {
            console.error('Error creating new session:', insertError);
            toast({
              title: "Error",
              description: "Failed to create new session",
              variant: "destructive"
            });
          } else {
            // Reset session data for non-first sessions
            if (currentSession !== 1) {
              setSessionData(prev => ({
                ...prev,
                sessionId: "0",
                impedanceH: "",
                impedanceL: "",
                blocks: Array(14).fill({ startTime: "", endTime: "", notes: "", isRecording: false })
              }));
            }
          }
        }
      } catch (error) {
        console.error('Error loading session state:', error);
        toast({
          title: "Error",
          description: "Failed to load session state",
          variant: "destructive"
        });
      }
    };

    loadSessionState();
  }, [candidateName, currentSession]);

  const handleBlockChange = async (index: number, field: "startTime" | "endTime" | "notes" | "isRecording", value: any) => {
    const newBlocks = [...sessionData.blocks];
    newBlocks[index] = {
      ...newBlocks[index],
      [field]: value,
    };

    const newSessionData = {
      ...sessionData,
      blocks: newBlocks
    };
    
    setSessionData(newSessionData);

    try {
      const { error } = await supabase
        .from('sessions')
        .update({
          current_block: index + 1,
          session_number: currentSession,
          session_id: sessionData.sessionId.toString()
        })
        .eq('candidate_name', candidateName)
        .eq('session_number', currentSession);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating session:', error);
      toast({
        title: "Error",
        description: "Failed to update session",
        variant: "destructive"
      });
    }

    const stored = localStorage.getItem(STORAGE_KEY);
    const allSessions = stored ? JSON.parse(stored) : {};
    allSessions[candidateName] = {
      ...allSessions[candidateName],
      [currentSession]: newSessionData
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allSessions));
  };

  const handleCompleteShift = async () => {
    try {
      // Mark current session as completed
      const { error: updateError } = await supabase
        .from('sessions')
        .update({ 
          ended_at: new Date().toISOString(),
          session_shift: 1,
          current_block: 14
        })
        .eq('candidate_name', candidateName)
        .eq('session_number', currentSession);

      if (updateError) throw updateError;

      // Create new session entry
      const { error: insertError } = await supabase
        .from('sessions')
        .insert({
          candidate_name: candidateName,
          session_number: 1,
          session_id: sessionData.sessionId.toString(),
          current_block: 1,
          started_at: new Date().toISOString()
        });

      if (insertError) throw insertError;

      setCurrentSession(1);
      setSessionData({
        candidateName,
        sessionNumber: 1,
        sessionId: sessionData.sessionId,
        impedanceH: "",
        impedanceL: "",
        blocks: Array(14).fill({ startTime: "", endTime: "", notes: "", isRecording: false })
      });

      toast({
        title: "Success",
        description: "Shift completed. Starting new session.",
      });
    } catch (error) {
      console.error('Error completing shift:', error);
      toast({
        title: "Error",
        description: "Failed to complete shift",
        variant: "destructive"
      });
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
    onSave(sessionData);
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
            <h4 className="text-lg font-medium text-clinical-800">Session Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sessionId">Session ID</Label>
                <Input
                  id="sessionId"
                  placeholder="Session ID"
                  value={sessionData.sessionId}
                  onChange={(e) => {
                    const newData = { ...sessionData, sessionId: e.target.value };
                    setSessionData(newData);
                    
                    try {
                      supabase
                        .from('sessions')
                        .update({
                          session_id: e.target.value
                        })
                        .eq('candidate_name', candidateName)
                        .eq('session_number', currentSession);
                    } catch (error) {
                      console.error('Error updating session ID:', error);
                    }
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="impedanceH">High</Label>
                <Input
                  id="impedanceH"
                  placeholder="H-value"
                  value={sessionData.impedanceH}
                  onChange={(e) => {
                    const newData = { ...sessionData, impedanceH: e.target.value };
                    setSessionData(newData);
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="impedanceL">Low</Label>
                <Input
                  id="impedanceL"
                  placeholder="L-value"
                  value={sessionData.impedanceL}
                  onChange={(e) => {
                    const newData = { ...sessionData, impedanceL: e.target.value };
                    setSessionData(newData);
                  }}
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

        <div className="mt-6 flex justify-end space-x-4">
          <Button type="submit">Save Session</Button>
          {currentSession === 14 && (
            <Button 
              type="button"
              onClick={handleCompleteShift}
              variant="default"
            >
              Complete Shift
            </Button>
          )}
        </div>
      </Card>
    </form>
  );
};

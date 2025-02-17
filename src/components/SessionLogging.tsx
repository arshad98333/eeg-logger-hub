
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TimeBlock } from "./TimeBlock";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { SessionHeader } from "./session/SessionHeader";
import { SessionInfo } from "./session/SessionInfo";
import { SessionData, SessionLoggingProps } from "@/types/session";

const STORAGE_KEY = "clinical-session-data";

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
    
    return {
      candidateName,
      sessionNumber: initialSession,
      sessionId: currentSession === 1 ? "1" : "0",
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
          setSessionData(prev => ({
            ...prev,
            sessionId: data.session_id || String(currentSession),
            impedanceH: data.impedance_h || "",
            impedanceL: data.impedance_l || "",
          }));
        } else {
          const initialSessionData = {
            candidate_name: candidateName,
            session_number: currentSession,
            session_id: currentSession === 1 ? "1" : "0",
            current_block: 1,
            started_at: new Date().toISOString(),
            impedance_h: currentSession === 1 ? sessionData.impedanceH : "",
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
        <SessionHeader 
          currentSession={currentSession}
          onSessionChange={handleSessionChange}
        />

        <div className="space-y-6">
          <SessionInfo
            sessionData={sessionData}
            onSessionDataChange={setSessionData}
            candidateName={candidateName}
            currentSession={currentSession}
          />
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

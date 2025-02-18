import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TimeBlock } from "./TimeBlock";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { SessionHeader } from "./session/SessionHeader";
import { SessionInfo } from "./session/SessionInfo";
import { SessionData, SessionLoggingProps, MAX_BLOCKS_PER_SESSION, Block } from "@/types/session";
import { Plus } from "lucide-react";
import { Json } from "@/integrations/supabase/types";

const STORAGE_KEY = "clinical-session-data";

export const SessionLogging = ({ candidateName, sessionNumber: initialSession, onSave }: SessionLoggingProps) => {
  const [currentSession, setCurrentSession] = useState(initialSession);
  const [sessionData, setSessionData] = useState<SessionData>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const allSessions = JSON.parse(stored);
      const candidateData = allSessions[candidateName];
      if (candidateData && candidateData[initialSession]) {
        return {
          ...candidateData[initialSession],
          candidateName,
          sessionNumber: initialSession,
          blocks: candidateData[initialSession].blocks || []
        };
      }
    }
    
    return {
      candidateName,
      sessionNumber: initialSession,
      sessionId: initialSession === 1 ? "1" : "0",
      impedanceH: "",
      impedanceL: "",
      blocks: []
    };
  });

  const { toast } = useToast();

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: existingSession, error: fetchError } = await supabase
          .from('sessions')
          .select('*')
          .eq('candidate_name', candidateName)
          .eq('session_number', currentSession)
          .maybeSingle();

        if (fetchError) throw fetchError;

        if (existingSession) {
          // Load data from Supabase and update both state and localStorage
          const blocks = existingSession.block_data ? existingSession.block_data as Block[] : [];
          
          const newSessionData = {
            ...sessionData,
            sessionId: existingSession.session_id || String(currentSession),
            impedanceH: existingSession.impedance_h || "",
            impedanceL: existingSession.impedance_l || "",
            blocks: blocks
          };

          setSessionData(newSessionData);

          // Update localStorage with session-specific data
          const stored = localStorage.getItem(STORAGE_KEY);
          const allSessions = stored ? JSON.parse(stored) : {};
          if (!allSessions[candidateName]) {
            allSessions[candidateName] = {};
          }
          allSessions[candidateName][currentSession] = newSessionData;
          localStorage.setItem(STORAGE_KEY, JSON.stringify(allSessions));
        } else {
          // Initialize new session with empty blocks
          setSessionData(prev => ({
            ...prev,
            sessionNumber: currentSession,
            sessionId: currentSession === 1 ? "1" : "0",
            impedanceH: "",
            impedanceL: "",
            blocks: []
          }));
        }
      } catch (error) {
        console.error('Error loading session data:', error);
        toast({
          title: "Error",
          description: "Failed to load session data",
          variant: "destructive"
        });
      }
    };

    loadData();
  }, [candidateName, currentSession]);

  const handleSessionChange = (direction: 'next' | 'prev') => {
    if (direction === 'next' && currentSession < 14) {
      setCurrentSession(prev => prev + 1);
    } else if (direction === 'prev' && currentSession > 1) {
      setCurrentSession(prev => prev - 1);
    }
  };

  const handleAddBlock = () => {
    if (sessionData.blocks.length >= MAX_BLOCKS_PER_SESSION) {
      toast({
        title: "Maximum Blocks Reached",
        description: `Cannot add more than ${MAX_BLOCKS_PER_SESSION} blocks per session.`,
        variant: "destructive"
      });
      return;
    }

    const newBlock: Block = { startTime: "", endTime: "", notes: "", isRecording: false };
    
    // Update localStorage with session-specific blocks
    const stored = localStorage.getItem(STORAGE_KEY);
    const allSessions = stored ? JSON.parse(stored) : {};
    if (!allSessions[candidateName]) {
      allSessions[candidateName] = {};
    }
    
    const updatedBlocks = [...sessionData.blocks, newBlock];
    allSessions[candidateName][currentSession] = {
      ...sessionData,
      blocks: updatedBlocks
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allSessions));
    
    setSessionData(prev => ({
      ...prev,
      blocks: updatedBlocks
    }));

    // Convert blocks to JSON compatible format for Supabase
    const blockDataForSupabase = updatedBlocks.map(block => ({
      startTime: block.startTime,
      endTime: block.endTime,
      notes: block.notes,
      isRecording: block.isRecording
    })) as Json;

    // Update Supabase with session-specific blocks
    supabase
      .from('sessions')
      .upsert({
        candidate_name: candidateName,
        session_number: currentSession,
        block_data: blockDataForSupabase
      })
      .then(({ error }) => {
        if (error) console.error('Error updating Supabase:', error);
      });
  };

  const handleBlockChange = async (index: number, field: keyof Block, value: any) => {
    const newBlocks = [...sessionData.blocks];
    newBlocks[index] = {
      ...newBlocks[index],
      [field]: value,
    };

    // Update local state and localStorage with session-specific blocks
    const newSessionData = {
      ...sessionData,
      blocks: newBlocks
    };
    
    setSessionData(newSessionData);

    // Update localStorage
    const stored = localStorage.getItem(STORAGE_KEY);
    const allSessions = stored ? JSON.parse(stored) : {};
    if (!allSessions[candidateName]) {
      allSessions[candidateName] = {};
    }
    allSessions[candidateName][currentSession] = newSessionData;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allSessions));

    // Convert blocks to JSON compatible format for Supabase
    const blockDataForSupabase = newBlocks.map(block => ({
      startTime: block.startTime,
      endTime: block.endTime,
      notes: block.notes,
      isRecording: block.isRecording
    })) as Json;

    // Update Supabase with session-specific blocks
    try {
      const { error } = await supabase
        .from('sessions')
        .upsert(
          {
            candidate_name: candidateName,
            session_number: currentSession,
            session_id: sessionData.sessionId,
            block_data: blockDataForSupabase,
            current_block: index + 1
          },
          {
            onConflict: 'candidate_name,session_number'
          }
        );

      if (error) throw error;
    } catch (error) {
      console.error('Error updating session:', error);
      toast({
        title: "Error",
        description: "Failed to update session in database",
        variant: "destructive"
      });
    }
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Save to localStorage
    const stored = localStorage.getItem(STORAGE_KEY);
    const allSessions = stored ? JSON.parse(stored) : {};
    if (!allSessions[candidateName]) {
      allSessions[candidateName] = {};
    }
    allSessions[candidateName][currentSession] = sessionData;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allSessions));
    
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
          
          {sessionData.blocks.length < MAX_BLOCKS_PER_SESSION && (
            <Button
              type="button"
              onClick={handleAddBlock}
              className="w-full border-dashed border-2 bg-clinical-50 hover:bg-clinical-100"
              variant="outline"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Block
            </Button>
          )}
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

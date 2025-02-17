
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { STORAGE_KEY, CURRENT_SESSION_KEY } from "@/components/SessionLogging";

export const useSessionManagement = () => {
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);
  const [isAllSessionsCompleted, setIsAllSessionsCompleted] = useState(false);
  const { toast } = useToast();

  const checkSessionCompletion = async () => {
    if (!selectedCandidate) return;
    
    try {
      const { data: sessions, error } = await supabase
        .from('sessions')
        .select('session_number')
        .eq('candidate_name', selectedCandidate)
        .order('session_number', { ascending: true });

      if (error) throw error;

      const hasAllSessions = sessions && sessions.length === 14;
      setIsAllSessionsCompleted(hasAllSessions);
    } catch (error) {
      console.error('Error checking session completion:', error);
      setIsAllSessionsCompleted(false);
    }
  };

  const handleAddCandidate = async (data: { name: string; date: string; shift: string }) => {
    try {
      // First, clear any existing data
      localStorage.clear();
      
      const { error } = await supabase
        .from('sessions')
        .insert({
          candidate_name: data.name,
          session_number: 1,
          started_at: new Date().toISOString(),
        });

      if (error) throw error;

      setSelectedCandidate(data.name);
      localStorage.setItem("selectedCandidate", data.name);
      localStorage.setItem(CURRENT_SESSION_KEY, "1");
      
      toast({
        title: "New Candidate Added",
        description: "You can now start session 1",
      });
    } catch (error) {
      console.error('Error adding candidate:', error);
      toast({
        title: "Error",
        description: "Failed to add candidate",
        variant: "destructive",
      });
    }
  };

  const handleSaveSession = async (sessionData: any) => {
    if (!selectedCandidate) return;

    try {
      // First delete any existing session and its blocks
      const { data: existingSession } = await supabase
        .from('sessions')
        .select('id')
        .eq('candidate_name', selectedCandidate)
        .eq('session_number', sessionData.sessionNumber)
        .maybeSingle();

      if (existingSession) {
        // Delete existing blocks
        await supabase
          .from('blocks')
          .delete()
          .eq('session_id', existingSession.id);

        // Delete existing session
        await supabase
          .from('sessions')
          .delete()
          .eq('id', existingSession.id);
      }

      // Create new session
      const { data: newSession, error: sessionError } = await supabase
        .from('sessions')
        .insert({
          candidate_name: selectedCandidate,
          session_number: sessionData.sessionNumber,
          session_id: sessionData.sessionId,
          started_at: new Date().toISOString()
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Insert blocks exactly as they are
      for (const [index, block] of sessionData.blocks.entries()) {
        if (block.startTime || block.endTime || block.notes) {
          const { error: blockError } = await supabase
            .from('blocks')
            .insert({
              session_id: newSession.id,
              block_index: index,
              start_time: block.startTime,
              end_time: block.endTime,
              notes: block.notes,
              is_recording: false
            });

          if (blockError) throw blockError;
        }
      }

      if (sessionData.sessionNumber === 14) {
        setIsAllSessionsCompleted(true);
        toast({
          title: "Final Session Saved",
          description: "Session 14 complete. You can now mark all sessions as complete.",
        });
      } else {
        toast({
          title: "Session Saved",
          description: `Session ${sessionData.sessionNumber} saved successfully.`,
        });
      }
    } catch (error) {
      console.error('Error saving session:', error);
      toast({
        title: "Error",
        description: "Failed to save session",
        variant: "destructive",
      });
    }
  };

  const handleMarkAsComplete = async () => {
    if (!selectedCandidate || !isAllSessionsCompleted) return;

    try {
      // Mark all sessions as ended
      const { error } = await supabase
        .from('sessions')
        .update({ ended_at: new Date().toISOString() })
        .eq('candidate_name', selectedCandidate);

      if (error) throw error;

      // Clear ALL localStorage data
      localStorage.clear();
      
      // Reset all states
      setSelectedCandidate(null);
      setIsAllSessionsCompleted(false);

      toast({
        title: "All Sessions Completed",
        description: "All data has been cleared. You can start with a new candidate.",
      });
    } catch (error) {
      console.error('Error marking as complete:', error);
      toast({
        title: "Error",
        description: "Failed to mark sessions as complete",
        variant: "destructive",
      });
    }
  };

  const getCurrentSessionData = async () => {
    if (!selectedCandidate) return null;
    
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select(`
          *,
          blocks (*)
        `)
        .eq('candidate_name', selectedCandidate)
        .order('session_number', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching session data:', error);
      return null;
    }
  };

  const getInitialSessionNumber = () => {
    const storedSession = localStorage.getItem(CURRENT_SESSION_KEY);
    return storedSession ? parseInt(storedSession) : 1;
  };

  return {
    selectedCandidate,
    isAllSessionsCompleted,
    handleAddCandidate,
    handleSaveSession,
    handleMarkAsComplete,
    getCurrentSessionData,
    getInitialSessionNumber,
    setSelectedCandidate
  };
};

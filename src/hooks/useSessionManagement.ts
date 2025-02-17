
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { STORAGE_KEY, CURRENT_SESSION_KEY } from "@/components/SessionLogging";

export const useSessionManagement = () => {
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(() => {
    const stored = localStorage.getItem("selectedCandidate");
    return stored ? stored : null;
  });

  const [isAllSessionsCompleted, setIsAllSessionsCompleted] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (selectedCandidate) {
      localStorage.setItem("selectedCandidate", selectedCandidate);
      checkSessionCompletion();
    }
  }, [selectedCandidate]);

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
      const { error } = await supabase
        .from('sessions')
        .insert({
          candidate_name: data.name,
          session_number: 1,
          started_at: new Date().toISOString(),
        });

      if (error) throw error;

      setSelectedCandidate(data.name);
      localStorage.setItem(CURRENT_SESSION_KEY, "1"); // Reset to session 1
      
      toast({
        title: "Candidate Added",
        description: "New candidate has been successfully added",
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
      const { data: existingSession } = await supabase
        .from('sessions')
        .select('id')
        .eq('candidate_name', selectedCandidate)
        .eq('session_number', sessionData.sessionNumber)
        .maybeSingle();

      if (existingSession) {
        // Update session_id if it exists
        const { error: updateError } = await supabase
          .from('sessions')
          .update({ session_id: sessionData.sessionId })
          .eq('id', existingSession.id);

        if (updateError) throw updateError;

        if (sessionData.sessionNumber === 14) {
          setIsAllSessionsCompleted(true);
          toast({
            title: "Session Already Saved",
            description: "Session 14 is complete. You can now mark all sessions as complete.",
          });
        } else {
          toast({
            title: "Session Already Saved",
            description: "You can proceed to the next session",
          });
        }
        return;
      }

      const { data: sessionResult, error: sessionError } = await supabase
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

      if (!sessionResult) {
        throw new Error('Failed to create session');
      }

      for (const [index, block] of sessionData.blocks.entries()) {
        if (block.startTime || block.endTime || block.notes) {
          const { error: blockError } = await supabase
            .from('blocks')
            .insert({
              session_id: sessionResult.id,
              block_index: index,
              start_time: block.startTime || null,
              end_time: block.endTime || null,
              notes: block.notes || null,
              is_recording: block.isRecording || false
            });

          if (blockError) throw blockError;
        }
      }

      toast({
        title: "Session Saved",
        description: "Session data has been successfully saved",
      });
      
      if (sessionData.sessionNumber === 14) {
        setIsAllSessionsCompleted(true);
        toast({
          title: "All Sessions Complete",
          description: "You can now mark all sessions as complete",
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
      const { error } = await supabase
        .from('sessions')
        .update({ ended_at: new Date().toISOString() })
        .eq('candidate_name', selectedCandidate);

      if (error) throw error;

      // Clear all local storage related to the current session
      localStorage.removeItem("selectedCandidate");
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(CURRENT_SESSION_KEY);
      
      // Reset states
      setSelectedCandidate(null);
      setIsAllSessionsCompleted(false);

      toast({
        title: "Sessions Completed",
        description: "All sessions have been marked as complete. You can now start with a new candidate.",
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


import { useState, useEffect } from "react";
import { CandidateManagement } from "@/components/CandidateManagement";
import { SessionLogging, STORAGE_KEY } from "@/components/SessionLogging";
import { SessionActions } from "@/components/SessionActions";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
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
      // Check if session already exists
      const { data: existingSession } = await supabase
        .from('sessions')
        .select('id')
        .eq('candidate_name', selectedCandidate)
        .eq('session_number', sessionData.sessionNumber)
        .maybeSingle();

      if (existingSession) {
        toast({
          title: "Session Already Exists",
          description: "This session has already been saved",
          variant: "destructive",
        });
        return;
      }

      // Create new session
      const { data: sessionResult, error: sessionError } = await supabase
        .from('sessions')
        .insert({
          candidate_name: selectedCandidate,
          session_number: sessionData.sessionNumber,
          started_at: new Date().toISOString()
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      if (!sessionResult) {
        throw new Error('Failed to create session');
      }

      // Save blocks for the session
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
      
      // Check if this was the last session
      if (sessionData.sessionNumber === 14) {
        setIsAllSessionsCompleted(true);
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
      // Update all sessions for this candidate as completed
      const { error } = await supabase
        .from('sessions')
        .update({ ended_at: new Date().toISOString() })
        .eq('candidate_name', selectedCandidate);

      if (error) throw error;

      // Clear all local storage
      localStorage.removeItem("selectedCandidate");
      localStorage.removeItem(STORAGE_KEY);
      
      // Reset state
      setSelectedCandidate(null);
      setIsAllSessionsCompleted(false);

      toast({
        title: "Sessions Completed",
        description: "All sessions have been marked as complete",
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

  return (
    <div className="min-h-screen bg-clinical-100">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <CandidateManagement
          onSelectCandidate={setSelectedCandidate}
          onAddCandidate={handleAddCandidate}
        />

        {selectedCandidate && (
          <>
            <SessionLogging
              candidateName={selectedCandidate}
              sessionNumber={1}
              onSave={handleSaveSession}
            />
            
            <SessionActions
              selectedCandidate={selectedCandidate}
              sessionData={getCurrentSessionData()}
              isAllSessionsCompleted={isAllSessionsCompleted}
              onMarkComplete={handleMarkAsComplete}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default Index;

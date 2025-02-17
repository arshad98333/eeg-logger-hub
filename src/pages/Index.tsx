
import { useState, useEffect } from "react";
import { CandidateManagement } from "@/components/CandidateManagement";
import { SessionLogging } from "@/components/SessionLogging";
import { SessionActions } from "@/components/SessionActions";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY = "clinical-session-data";
const COMPLETION_KEY = "completed-candidates";

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

  const checkSessionCompletion = () => {
    if (!selectedCandidate) return;
    
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;

    const allSessions = JSON.parse(stored);
    const candidateData = allSessions[selectedCandidate];
    
    if (!candidateData) return;

    const hasAllSessions = Array.from({ length: 14 }, (_, i) => i + 1)
      .every(sessionNum => candidateData[sessionNum]);

    setIsAllSessionsCompleted(hasAllSessions);
  };

  const handleAddCandidate = async (data: { name: string; date: string; shift: string }) => {
    try {
      const { error } = await supabase
        .from('sessions')
        .insert({
          candidate_name: data.name,
          session_number: 1,
          started_at: new Date().toISOString(),
          user_id: 'default'  // We'll update this when auth is implemented
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
      // First, save to Supabase
      const { data: sessionResult, error: sessionError } = await supabase
        .from('sessions')
        .upsert({
          candidate_name: selectedCandidate,
          session_number: sessionData.sessionNumber,
          user_id: 'default', // We'll update this when auth is implemented
          started_at: new Date().toISOString()
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Then save blocks
      const blockPromises = sessionData.blocks.map(async (block: any, index: number) => {
        if (block.startTime || block.endTime || block.notes) {
          const { error: blockError } = await supabase
            .from('blocks')
            .upsert({
              session_id: sessionResult.id,
              block_index: index,
              start_time: block.startTime || null,
              end_time: block.endTime || null,
              notes: block.notes || null,
              is_recording: block.isRecording || false
            });

          if (blockError) throw blockError;
        }
      });

      await Promise.all(blockPromises);

      // Update local storage
      const existingData = localStorage.getItem(STORAGE_KEY);
      const allSessions = existingData ? JSON.parse(existingData) : {};
      
      allSessions[selectedCandidate] = {
        ...allSessions[selectedCandidate],
        [sessionData.sessionNumber]: sessionData
      };
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allSessions));
      checkSessionCompletion();
      
      toast({
        title: "Session Saved",
        description: "Session data has been successfully saved",
      });
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

      // Update local storage
      const completedCandidates = localStorage.getItem(COMPLETION_KEY);
      const completed = completedCandidates ? JSON.parse(completedCandidates) : [];
      completed.push(selectedCandidate);
      localStorage.setItem(COMPLETION_KEY, JSON.stringify(completed));

      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const allSessions = JSON.parse(stored);
        delete allSessions[selectedCandidate];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(allSessions));
      }

      localStorage.removeItem("selectedCandidate");
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
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error fetching session data:', error);
      // Fallback to local storage
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;

      const allSessions = JSON.parse(stored);
      const candidateData = allSessions[selectedCandidate];
      
      if (!candidateData) return null;

      return Object.values(candidateData)[0];
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

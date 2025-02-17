
import { useState, useEffect } from "react";
import { CandidateManagement } from "@/components/CandidateManagement";
import { SessionLogging } from "@/components/SessionLogging";
import { AdminPanel } from "@/components/AdminPanel";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

const Index = () => {
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<Array<{ name: string; date: string; shift: string }>>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('admin')
          .eq('id', user.id)
          .single();
        
        setIsAdmin(profile?.admin || false);
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  };

  const handleAddCandidate = (data: { name: string; date: string; shift: string }) => {
    setCandidates([...candidates, data]);
    setSelectedCandidate(data.name);
    toast({
      title: "Candidate Added",
      description: "New candidate has been successfully added",
    });
  };

  const handleSaveSession = (sessionData: any) => {
    console.log("Saving session:", sessionData);
    toast({
      title: "Session Saved",
      description: "Session data has been successfully saved",
    });
  };

  const scrollToAdmin = () => {
    const adminPanel = document.getElementById('admin-panel');
    if (adminPanel) {
      adminPanel.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-clinical-100">
      <div className="container mx-auto py-8 space-y-8">
        {isAdmin && (
          <div className="flex justify-end">
            <Button
              onClick={scrollToAdmin}
              variant="outline"
              className="mb-4"
            >
              Go to Admin Panel
            </Button>
          </div>
        )}
        
        {isAdmin && <div id="admin-panel"><AdminPanel /></div>}
        
        <CandidateManagement
          candidates={candidates}
          onSelectCandidate={setSelectedCandidate}
          onAddCandidate={handleAddCandidate}
        />

        {selectedCandidate && (
          <SessionLogging
            candidateName={selectedCandidate}
            sessionNumber={1}
            onSave={handleSaveSession}
          />
        )}
      </div>
    </div>
  );
};

export default Index;

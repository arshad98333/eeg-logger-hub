
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

interface SessionProgress {
  candidate_name: string;
  session_number: number | null;
  current_block: number | null;
  progress_percentage: number | null;
}

const Dashboard = () => {
  const [sessions, setSessions] = useState<SessionProgress[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    // Initial fetch
    fetchSessions();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('session_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sessions'
        },
        () => {
          fetchSessions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('candidate_name, session_number, current_block, progress_percentage')
        .order('progress_percentage', { ascending: false });

      if (error) throw error;

      setSessions(data || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast({
        title: "Error",
        description: "Failed to fetch session data",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-clinical-100 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-2xl font-bold mb-8">Session Progress Dashboard</h1>
        <div className="grid gap-4">
          {sessions.map((session, index) => (
            <Card key={index} className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold">{session.candidate_name}</h2>
                <span className="text-sm text-gray-600">
                  Session {session.session_number || 1} - Block {session.current_block || 1}
                </span>
              </div>
              <Progress value={session.progress_percentage || 0} className="h-2" />
              <div className="mt-2 text-sm text-gray-600">
                {(session.progress_percentage || 0).toFixed(1)}% Complete
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

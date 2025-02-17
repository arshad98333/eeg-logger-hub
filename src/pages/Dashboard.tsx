
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { RealtimeTracker } from "@/components/dashboard/RealtimeTracker";
import { PerformanceAnalysis } from "@/components/dashboard/PerformanceAnalysis";

const Dashboard = () => {
  const [candidatesData, setCandidatesData] = useState<any[]>([]);

  useEffect(() => {
    // Initial fetch
    fetchCandidatesData();

    // Set up real-time subscription
    const channel = supabase
      .channel('session-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sessions'
        },
        () => {
          fetchCandidatesData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchCandidatesData = async () => {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select(`
          candidate_name,
          session_number,
          blocks (
            block_index,
            start_time,
            end_time
          )
        `)
        .order('session_number', { ascending: true });

      if (error) throw error;

      // Process data to group by candidate
      const processedData = processCandidateData(data);
      setCandidatesData(processedData);
    } catch (error) {
      console.error('Error fetching candidate data:', error);
    }
  };

  const processCandidateData = (data: any[]) => {
    // Group sessions by candidate
    const candidateGroups = data.reduce((groups: { [key: string]: any[] }, session) => {
      if (!groups[session.candidate_name]) {
        groups[session.candidate_name] = [];
      }
      groups[session.candidate_name].push({
        session_number: session.session_number,
        blocks: session.blocks || []
      });
      return groups;
    }, {});

    // Convert grouped data to final format
    return Object.entries(candidateGroups).map(([name, sessions]) => {
      const sessionCount = sessions.length;
      const progress = (sessionCount / 14) * 100;

      // Sort sessions by session number
      const sortedSessions = sessions.sort((a, b) => a.session_number - b.session_number);

      return {
        name,
        sessionCount,
        progress,
        status: getCompletionStatus(sessionCount),
        sessions: sortedSessions
      };
    }).sort((a, b) => b.sessionCount - a.sessionCount);
  };

  const getCompletionStatus = (sessionCount: number) => {
    if (sessionCount >= 14) return { color: '#22c55e', opacity: 1 }; // green-500
    if (sessionCount >= 13) return { color: '#22c55e', opacity: 0.75 };
    if (sessionCount >= 12) return { color: '#22c55e', opacity: 0.5 };
    return { color: '#6b7280', opacity: 0.3 }; // gray-500
  };

  return (
    <div className="min-h-screen bg-clinical-100 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-clinical-800 mb-8">Session Progress Dashboard</h1>
        
        <div className="grid gap-8">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Real-time Session Tracker</h2>
            <RealtimeTracker data={candidatesData} />
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Performance Analysis</h2>
            <PerformanceAnalysis data={candidatesData} />
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

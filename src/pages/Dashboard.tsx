
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
            notes,
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
    const candidateMap = new Map();

    data.forEach(session => {
      if (!candidateMap.has(session.candidate_name)) {
        candidateMap.set(session.candidate_name, {
          name: session.candidate_name,
          sessions: new Set(),
          totalBlocks: 0,
          completedBlocks: 0
        });
      }

      const candidate = candidateMap.get(session.candidate_name);
      candidate.sessions.add(session.session_number);
      
      if (session.blocks) {
        session.blocks.forEach((block: any) => {
          candidate.totalBlocks++;
          if (block.start_time && block.end_time) {
            candidate.completedBlocks++;
          }
        });
      }
    });

    return Array.from(candidateMap.values())
      .map(candidate => ({
        ...candidate,
        sessionCount: candidate.sessions.size,
        progress: (candidate.sessions.size / 14) * 100,
        status: getCompletionStatus(candidate.sessions.size)
      }))
      .sort((a, b) => b.sessionCount - a.sessionCount);
  };

  const getCompletionStatus = (sessionCount: number) => {
    if (sessionCount >= 14) return { color: 'green', opacity: 1 };
    if (sessionCount >= 13) return { color: 'green', opacity: 0.75 };
    if (sessionCount >= 12) return { color: 'green', opacity: 0.5 };
    return { color: 'gray', opacity: 0.3 };
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


import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Award } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SessionProgress {
  candidate_name: string;
  session_number: number | null;
  current_block: number | null;
  progress_percentage: number | null;
}

interface AggregatedProgress {
  candidate_name: string;
  current_session: number;
  current_block: number;
  total_progress: number;
  position?: number;
}

const Dashboard = () => {
  const [aggregatedSessions, setAggregatedSessions] = useState<AggregatedProgress[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchSessions();

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

      // Aggregate progress for each candidate
      const aggregated = (data || []).reduce<{ [key: string]: AggregatedProgress }>((acc, session) => {
        if (!acc[session.candidate_name]) {
          acc[session.candidate_name] = {
            candidate_name: session.candidate_name,
            current_session: session.session_number || 1,
            current_block: session.current_block || 1,
            total_progress: ((session.session_number || 1) - 1) * (100/14) + 
                          ((session.current_block || 1) * (100/14/7))
          };
        }
        return acc;
      }, {});

      // Convert to array and sort by total progress
      const sortedSessions = Object.values(aggregated)
        .sort((a, b) => b.total_progress - a.total_progress)
        .map((session, index) => ({
          ...session,
          position: index + 1
        }));

      setAggregatedSessions(sortedSessions);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast({
        title: "Error",
        description: "Failed to fetch session data",
        variant: "destructive",
      });
    }
  };

  const getMedalColor = (position: number) => {
    switch (position) {
      case 1:
        return "text-yellow-400"; // Gold
      case 2:
        return "text-gray-400"; // Silver
      case 3:
        return "text-amber-700"; // Bronze
      default:
        return "hidden";
    }
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-clinical-100 py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl font-bold mb-8">Session Progress Dashboard</h1>
          <div className="grid gap-4">
            {aggregatedSessions.map((session) => (
              <Card key={session.candidate_name} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold">{session.candidate_name}</h2>
                    <Award 
                      className={`w-6 h-6 ${getMedalColor(session.position || 0)}`}
                      fill="currentColor"
                    />
                  </div>
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="relative">
                      <Progress 
                        value={session.total_progress} 
                        className="h-2 cursor-pointer" 
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="bg-white p-2 rounded-lg shadow-lg">
                    <div className="text-sm font-medium">
                      <p className="text-gray-900">Currently on:</p>
                      <p className="text-clinical-600">Session {session.current_session}</p>
                      <p className="text-clinical-600">Block {session.current_block} of 7</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
                <div className="mt-2 text-sm text-gray-600">
                  {session.total_progress.toFixed(1)}% Complete
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default Dashboard;

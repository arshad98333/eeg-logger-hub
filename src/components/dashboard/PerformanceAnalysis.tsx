import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw } from "lucide-react";

interface AnalysisProps {
  data: Array<{
    name: string;
    sessionCount: number;
    sessions: Array<{
      session_number: number;
      blocks: Array<{
        block_index: number;
        start_time: string | null;
        end_time: string | null;
      }>;
    }>;
  }>;
}

export const PerformanceAnalysis = ({ data }: AnalysisProps) => {
  const [analysis, setAnalysis] = useState<any[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchAnalysis();

    const scheduleNextAnalysis = () => {
      const minInterval = 40 * 60 * 1000; // 40 minutes
      const maxInterval = 80 * 60 * 1000; // 1h20m
      const randomInterval = Math.random() * (maxInterval - minInterval) + minInterval;
      
      return setTimeout(async () => {
        await triggerAnalysis();
        scheduleNextAnalysis();
      }, randomInterval);
    };

    const timer = scheduleNextAnalysis();
    return () => clearTimeout(timer);
  }, []);

  const calculateCompletionRate = (candidate: AnalysisProps['data'][0]) => {
    let totalCompletedBlocks = 0;
    let totalExpectedBlocks = 0;

    candidate.sessions.forEach(session => {
      const completedBlocks = session.blocks.filter(block => 
        block.start_time && block.end_time
      ).length;
      totalCompletedBlocks += completedBlocks;
      totalExpectedBlocks += 7; // Each session should have 7 blocks
    });

    return totalExpectedBlocks > 0 
      ? Math.round((totalCompletedBlocks / totalExpectedBlocks) * 100) 
      : 0;
  };

  const fetchAnalysis = async () => {
    try {
      const { data: analysisData, error } = await supabase
        .from('session_analysis')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setAnalysis(analysisData);
    } catch (error) {
      console.error('Error fetching analysis:', error);
      toast({
        title: "Error",
        description: "Failed to fetch analysis data",
        variant: "destructive",
      });
    }
  };

  const triggerAnalysis = async () => {
    try {
      setIsAnalyzing(true);
      const response = await supabase.functions.invoke('analyze-sessions');
      if (!response.error) {
        await fetchAnalysis();
        toast({
          title: "Analysis Updated",
          description: "Session analysis has been refreshed",
        });
      }
    } catch (error) {
      console.error('Error triggering analysis:', error);
      toast({
        title: "Error",
        description: "Failed to update analysis",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end mb-4">
        <Button 
          onClick={triggerAnalysis} 
          disabled={isAnalyzing}
          className="gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
          {isAnalyzing ? 'Analyzing...' : 'Run Analysis'}
        </Button>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Candidate</TableHead>
              <TableHead>Sessions Completed</TableHead>
              <TableHead>Completion Rate</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Analysis</TableHead>
              <TableHead>AI Insights</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {analysis.map((item) => {
              const candidateData = data.find(d => d.name === item.candidate_name);
              const completionRate = candidateData ? calculateCompletionRate(candidateData) : 0;

              return (
                <TableRow key={`${item.candidate_name}-${item.created_at}`}>
                  <TableCell className="font-medium">{item.candidate_name}</TableCell>
                  <TableCell>
                    {candidateData?.sessionCount || 0}/14
                  </TableCell>
                  <TableCell>
                    {completionRate}%
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        (candidateData?.sessionCount || 0) >= 12
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {(candidateData?.sessionCount || 0) >= 12 ? "Qualified" : "In Progress"}
                    </span>
                  </TableCell>
                  <TableCell>
                    {new Date(item.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell className="max-w-md">
                    <div className="text-sm text-gray-600 truncate">
                      {item.analysis}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

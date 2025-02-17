
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AnalysisProps {
  data: Array<{
    name: string;
    sessionCount: number;
    completedBlocks: number;
    totalBlocks: number;
  }>;
}

export const PerformanceAnalysis = ({ data }: AnalysisProps) => {
  const [analysis, setAnalysis] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchAnalysis();
  }, []);

  const fetchAnalysis = async () => {
    try {
      const { data: sessionsData, error } = await supabase
        .from('sessions')
        .select(`
          *,
          blocks (*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setAnalysis(sessionsData || []);
    } catch (error) {
      console.error('Error fetching analysis:', error);
      toast({
        title: "Error",
        description: "Failed to fetch analysis data",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Candidate</TableHead>
              <TableHead>Sessions Completed</TableHead>
              <TableHead>Completion Rate</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(data || []).map((item) => (
              <TableRow key={item.name}>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell>{item.sessionCount}/14</TableCell>
                <TableCell>
                  {Math.round((item.completedBlocks / item.totalBlocks) * 100)}%
                </TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      item.sessionCount >= 12
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {item.sessionCount >= 12 ? "Qualified" : "In Progress"}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

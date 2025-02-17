
import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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

  useEffect(() => {
    // Simulate AI analysis for now
    // In the next implementation, we'll integrate with Gemini AI
    const newAnalysis = data.map(candidate => ({
      name: candidate.name,
      sessionCount: candidate.sessionCount,
      completionRate: ((candidate.completedBlocks / candidate.totalBlocks) * 100).toFixed(1),
      timestamp: new Date().toISOString(),
      status: candidate.sessionCount >= 12 ? "Qualified" : "In Progress"
    }));
    
    setAnalysis(newAnalysis);
  }, [data]);

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Candidate</TableHead>
            <TableHead>Sessions Completed</TableHead>
            <TableHead>Completion Rate</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Last Updated</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {analysis.map((item) => (
            <TableRow key={item.name}>
              <TableCell className="font-medium">{item.name}</TableCell>
              <TableCell>{item.sessionCount}/14</TableCell>
              <TableCell>{item.completionRate}%</TableCell>
              <TableCell>
                <span
                  className={`px-2 py-1 rounded-full text-xs ${
                    item.status === "Qualified"
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {item.status}
                </span>
              </TableCell>
              <TableCell>
                {new Date(item.timestamp).toLocaleString()}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

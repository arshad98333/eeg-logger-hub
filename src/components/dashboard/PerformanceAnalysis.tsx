
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
    progress: number;
    status: { color: string; opacity: number };
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
            {data.map((item) => (
              <TableRow key={item.name}>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell>{item.sessionCount}/14</TableCell>
                <TableCell>{Math.round(item.progress)}%</TableCell>
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
};


import { motion } from "framer-motion";
import { Trophy } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Block {
  block_index: number;
  start_time: string | null;
  end_time: string | null;
}

interface Session {
  session_number: number;
  blocks: Block[];
}

interface TrackerProps {
  data: Array<{
    name: string;
    sessionCount: number;
    progress: number;
    status: {
      color: string;
      opacity: number;
    };
    sessions: Session[];
  }>;
}

export const RealtimeTracker = ({ data }: TrackerProps) => {
  const getSessionStatus = (session: Session) => {
    if (!session.blocks) return { completed: 0, message: "No blocks recorded" };
    
    const completedBlocks = session.blocks.filter(
      block => block.start_time && block.end_time
    ).length;

    const inProgressBlocks = session.blocks.filter(
      block => block.start_time && !block.end_time
    ).length;

    return {
      completed: completedBlocks,
      inProgress: inProgressBlocks,
      message: `${completedBlocks}/7 blocks completed${inProgressBlocks > 0 ? `, ${inProgressBlocks} in progress` : ''}`
    };
  };

  const getLatestSessionInfo = (sessions: Session[]) => {
    if (!sessions.length) return null;
    
    const latestSession = sessions[sessions.length - 1];
    const status = getSessionStatus(latestSession);
    
    return {
      sessionNumber: latestSession.session_number,
      ...status,
      blocks: latestSession.blocks
    };
  };

  return (
    <div className="space-y-4">
      {data.map((candidate, index) => {
        const latestSession = getLatestSessionInfo(candidate.sessions);
        
        return (
          <motion.div
            key={candidate.name}
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="relative"
          >
            <div className="flex items-center gap-4">
              <div className="w-24 text-sm font-medium truncate">
                {candidate.name}
              </div>
              <div className="flex-1 h-8 bg-clinical-200 rounded-full overflow-hidden relative">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <motion.div
                        className="h-full rounded-full"
                        style={{
                          backgroundColor: candidate.status.color,
                          opacity: candidate.status.opacity,
                          width: `${candidate.progress}%`,
                        }}
                        initial={{ width: 0 }}
                        animate={{ width: `${candidate.progress}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      {latestSession ? (
                        <div className="space-y-2">
                          <p className="font-semibold">Current Progress:</p>
                          <div className="text-sm">
                            <p>Session {latestSession.sessionNumber}</p>
                            <p>{latestSession.message}</p>
                            <div className="mt-1 grid grid-cols-7 gap-1">
                              {Array.from({ length: 7 }).map((_, i) => {
                                const block = latestSession.blocks.find(b => b.block_index === i);
                                const status = block?.end_time ? "completed" : 
                                             block?.start_time ? "in-progress" : "pending";
                                
                                return (
                                  <div
                                    key={i}
                                    className={`w-3 h-3 rounded-sm ${
                                      status === "completed" ? "bg-green-500" :
                                      status === "in-progress" ? "bg-yellow-500" :
                                      "bg-gray-300"
                                    }`}
                                    title={`Block ${i + 1}: ${status}`}
                                  />
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p>No sessions recorded</p>
                      )}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="w-20 text-right">
                <span className="font-mono font-medium">
                  {candidate.sessionCount}/14
                </span>
              </div>
              {index < 3 && (
                <Trophy 
                  className={`w-5 h-5 ${
                    index === 0 ? 'text-yellow-500' :
                    index === 1 ? 'text-gray-400' :
                    'text-orange-600'
                  }`}
                />
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

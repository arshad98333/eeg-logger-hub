
import { motion } from "framer-motion";
import { Trophy } from "lucide-react";

interface TrackerProps {
  data: Array<{
    name: string;
    sessionCount: number;
    progress: number;
    status: {
      color: string;
      opacity: number;
    };
  }>;
}

export const RealtimeTracker = ({ data }: TrackerProps) => {
  return (
    <div className="space-y-4">
      {data.map((candidate, index) => (
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
            <div className="flex-1 h-8 bg-clinical-200 rounded-full overflow-hidden">
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
      ))}
    </div>
  );
};


import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface SessionHeaderProps {
  currentSession: number;
  onSessionChange: (direction: 'next' | 'prev') => void;
}

export const SessionHeader = ({ currentSession, onSessionChange }: SessionHeaderProps) => {
  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-4">
      <h3 className="text-xl font-semibold">
        Session {currentSession}
      </h3>
      <div className="flex items-center space-x-2 md:space-x-4">
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => onSessionChange('prev')}
          disabled={currentSession <= 1}
          className="px-2 md:px-4"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden md:inline ml-1">Previous</span>
        </Button>
        <span className="text-sm font-medium">
          {currentSession} / 14
        </span>
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => onSessionChange('next')}
          disabled={currentSession >= 14}
          className="px-2 md:px-4"
        >
          <span className="hidden md:inline mr-1">Next</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

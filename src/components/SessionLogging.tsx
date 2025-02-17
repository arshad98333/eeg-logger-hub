
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { TimeBlock } from "./TimeBlock";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY = "clinical-session-data";

interface SessionLoggingProps {
  candidateName: string;
  sessionNumber: number;
  onSave: (sessionData: any) => void;
}

interface Block {
  startTime: string;
  endTime: string;
  notes: string;
  isRecording: boolean;
}

interface SessionData {
  candidateName: string;
  sessionNumber: number;
  impedanceH: string;
  impedanceL: string;
  blocks: Block[];
}

export const SessionLogging = ({ candidateName, sessionNumber: initialSession, onSave }: SessionLoggingProps) => {
  const [currentSession, setCurrentSession] = useState(initialSession);
  const [sessionData, setSessionData] = useState<SessionData>(() => {
    // Initialize from localStorage if available
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const allSessions = JSON.parse(stored);
      const candidateData = allSessions[candidateName];
      if (candidateData && candidateData[initialSession]) {
        return candidateData[initialSession];
      }
    }
    return {
      candidateName,
      sessionNumber: initialSession,
      impedanceH: "",
      impedanceL: "",
      blocks: Array(7).fill({ startTime: "", endTime: "", notes: "", isRecording: false })
    };
  });
  
  const { toast } = useToast();

  // Load session data when switching sessions
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const allSessions = JSON.parse(stored);
      const candidateData = allSessions[candidateName];
      if (candidateData && candidateData[currentSession]) {
        setSessionData(candidateData[currentSession]);
      } else {
        // Initialize new session
        setSessionData({
          candidateName,
          sessionNumber: currentSession,
          impedanceH: "",
          impedanceL: "",
          blocks: Array(7).fill({ startTime: "", endTime: "", notes: "", isRecording: false })
        });
      }
    }
  }, [currentSession, candidateName]);

  const handleBlockChange = (index: number, field: "startTime" | "endTime" | "notes" | "isRecording", value: any) => {
    const newBlocks = [...sessionData.blocks];
    newBlocks[index] = {
      ...newBlocks[index],
      [field]: value,
    };

    const newSessionData = {
      ...sessionData,
      blocks: newBlocks
    };
    
    setSessionData(newSessionData);

    // Save to localStorage on every change
    const stored = localStorage.getItem(STORAGE_KEY);
    const allSessions = stored ? JSON.parse(stored) : {};
    allSessions[candidateName] = {
      ...allSessions[candidateName],
      [currentSession]: newSessionData
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allSessions));
  };

  const handleSessionChange = (direction: 'next' | 'prev') => {
    if (direction === 'next' && currentSession < 14) {
      setCurrentSession(prev => prev + 1);
    } else if (direction === 'prev' && currentSession > 1) {
      setCurrentSession(prev => prev - 1);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(sessionData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-slide-up px-4 md:px-0">
      <Card className="p-4 md:p-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-4">
          <h3 className="text-xl font-semibold">
            Session {currentSession}
          </h3>
          <div className="flex items-center space-x-2 md:space-x-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => handleSessionChange('prev')}
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
              onClick={() => handleSessionChange('next')}
              disabled={currentSession >= 14}
              className="px-2 md:px-4"
            >
              <span className="hidden md:inline mr-1">Next</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-clinical-800">Impedance Values</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="impedanceH">High</Label>
                <Input
                  id="impedanceH"
                  placeholder="H-value"
                  value={sessionData.impedanceH}
                  onChange={(e) => {
                    const newData = { ...sessionData, impedanceH: e.target.value };
                    setSessionData(newData);
                    // Save to localStorage
                    const stored = localStorage.getItem(STORAGE_KEY);
                    const allSessions = stored ? JSON.parse(stored) : {};
                    allSessions[candidateName] = {
                      ...allSessions[candidateName],
                      [currentSession]: newData
                    };
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(allSessions));
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="impedanceL">Low</Label>
                <Input
                  id="impedanceL"
                  placeholder="L-value"
                  value={sessionData.impedanceL}
                  onChange={(e) => {
                    const newData = { ...sessionData, impedanceL: e.target.value };
                    setSessionData(newData);
                    // Save to localStorage
                    const stored = localStorage.getItem(STORAGE_KEY);
                    const allSessions = stored ? JSON.parse(stored) : {};
                    allSessions[candidateName] = {
                      ...allSessions[candidateName],
                      [currentSession]: newData
                    };
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(allSessions));
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4 mt-6">
          {sessionData.blocks.map((block, index) => (
            <div key={index} className="border rounded-lg p-4 bg-clinical-50">
              <TimeBlock
                index={index}
                startTime={block.startTime}
                endTime={block.endTime}
                notes={block.notes}
                sessionId={`${candidateName}-${currentSession}-${index}`}
                onChange={handleBlockChange}
              />
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <Button type="submit">Save Session</Button>
        </div>
      </Card>
    </form>
  );
};

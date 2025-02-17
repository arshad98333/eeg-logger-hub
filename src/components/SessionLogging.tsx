import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { TimeBlock } from "./TimeBlock";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const STORAGE_KEY = "clinical-session-data";
export const CURRENT_SESSION_KEY = "current-session-number";

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
  sessionId: string;
  impedanceH: string;
  impedanceL: string;
  blocks: Block[];
}

export const SessionLogging = ({ candidateName, sessionNumber: initialSession, onSave }: SessionLoggingProps) => {
  const [currentSession, setCurrentSession] = useState(() => {
    const storedSession = localStorage.getItem(CURRENT_SESSION_KEY);
    return storedSession ? parseInt(storedSession) : initialSession;
  });

  const [sessionData, setSessionData] = useState<SessionData>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const allSessions = JSON.parse(stored);
      const candidateData = allSessions[candidateName];
      if (candidateData && candidateData[currentSession]) {
        return candidateData[currentSession];
      }
    }
    return {
      candidateName,
      sessionNumber: currentSession,
      sessionId: '',
      impedanceH: "",
      impedanceL: "",
      blocks: Array(7).fill({ startTime: "", endTime: "", notes: "", isRecording: false })
    };
  });
  
  const { toast } = useToast();

  useEffect(() => {
    localStorage.setItem(CURRENT_SESSION_KEY, currentSession.toString());
  }, [currentSession]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const allSessions = JSON.parse(stored);
      const candidateData = allSessions[candidateName];
      if (candidateData && candidateData[currentSession]) {
        setSessionData(candidateData[currentSession]);
      } else {
        setSessionData({
          candidateName,
          sessionNumber: currentSession,
          sessionId: '',
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Update session_id in Supabase
      const { error: updateError } = await supabase
        .from('sessions')
        .update({ session_id: sessionData.sessionId })
        .eq('candidate_name', candidateName)
        .eq('session_number', currentSession);

      if (updateError) throw updateError;

      onSave({
        ...sessionData,
        sessionNumber: currentSession
      });

      toast({
        title: "Success",
        description: "Session data saved successfully",
      });
    } catch (error) {
      console.error('Error saving session:', error);
      toast({
        title: "Error",
        description: "Failed to save session data",
        variant: "destructive"
      });
    }
  };

  const exampleSession = {
    candidateName: "Example",
    sessionNumber: 12,
    sessionId: "AD0350",
    impedanceH: "20K",
    impedanceL: "13K",
    blocks: [
      { startTime: "13:00:34", endTime: "13:04:27", notes: "NO NOTES", isRecording: false },
      { startTime: "13:04:45", endTime: "13:08:36", notes: "NO NOTES", isRecording: false },
      { startTime: "13:08:52", endTime: "13:12:44", notes: "NO NOTES", isRecording: false },
      { startTime: "13:13:06", endTime: "13:17:04", notes: "NO NOTES", isRecording: false },
      { startTime: "13:17:22", endTime: "13:21:19", notes: "NO NOTES", isRecording: false },
      { startTime: "13:21:34", endTime: "13:25:31", notes: "NO NOTES", isRecording: false },
      { startTime: "13:25:55", endTime: "13:29:47", notes: "NO NOTES", isRecording: false }
    ]
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
          {/* Session ID input */}
          <div className="space-y-2">
            <Label htmlFor="sessionId">Session ID</Label>
            <Input
              id="sessionId"
              placeholder="Enter Session ID"
              value={sessionData.sessionId}
              onChange={(e) => {
                const newData = { ...sessionData, sessionId: e.target.value };
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
              className="max-w-xs"
            />
          </div>

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

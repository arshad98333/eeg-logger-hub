
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { TimeBlock } from "./TimeBlock";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface SessionLoggingProps {
  candidateName: string;
  sessionNumber: number;
  onSave: (sessionData: any) => void;
}

export const SessionLogging = ({ candidateName, sessionNumber: initialSession, onSave }: SessionLoggingProps) => {
  const [currentSession, setCurrentSession] = useState(initialSession);
  const [sessionId, setSessionId] = useState("");
  const [impedanceH, setImpedanceH] = useState("");
  const [impedanceL, setImpedanceL] = useState("");
  const [blocks, setBlocks] = useState(
    Array(7).fill({
      startTime: "",
      endTime: "",
      notes: "",
    })
  );
  const { toast } = useToast();

  const handleBlockChange = (index: number, field: "startTime" | "endTime" | "notes", value: string) => {
    const newBlocks = [...blocks];
    newBlocks[index] = {
      ...newBlocks[index],
      [field]: value,
    };
    setBlocks(newBlocks);
  };

  const handleSessionChange = (direction: 'next' | 'prev') => {
    if (direction === 'next' && currentSession < 14) {
      setCurrentSession(prev => prev + 1);
      // Reset form for new session
      setSessionId("");
      setImpedanceH("");
      setImpedanceL("");
      setBlocks(Array(7).fill({ startTime: "", endTime: "", notes: "" }));
    } else if (direction === 'prev' && currentSession > 1) {
      setCurrentSession(prev => prev - 1);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const sessionData = {
      session_id: sessionId,
      impedance_h: impedanceH,
      impedance_l: impedanceL,
      blocks,
    };

    onSave(sessionData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-slide-up">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold">
            Session {currentSession}
          </h3>
          <div className="flex items-center space-x-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => handleSessionChange('prev')}
              disabled={currentSession <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm font-medium">
              {currentSession} / 14
            </span>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => handleSessionChange('next')}
              disabled={currentSession >= 14}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="sessionId">Session ID</Label>
            <Input
              id="sessionId"
              placeholder="Enter session ID (e.g., AR0007)"
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
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
                  value={impedanceH}
                  onChange={(e) => setImpedanceH(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="impedanceL">Low</Label>
                <Input
                  id="impedanceL"
                  placeholder="L-value"
                  value={impedanceL}
                  onChange={(e) => setImpedanceL(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4 mt-6">
          {blocks.map((block, index) => (
            <div key={index} className="border rounded-lg p-4 bg-clinical-50">
              <h4 className="text-lg font-medium mb-4 text-clinical-800">Block {index}</h4>
              <TimeBlock
                index={index}
                startTime={block.startTime}
                endTime={block.endTime}
                notes={block.notes}
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


import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Circle, CheckCircle2, XCircle } from "lucide-react";

interface TimeBlockProps {
  index: number;
  startTime: string;
  endTime: string;
  notes: string;
  sessionId: string;
  onChange: (index: number, field: "startTime" | "endTime" | "notes" | "isRecording", value: any) => void;
}

export const TimeBlock = ({ index, startTime, endTime, notes, onChange }: TimeBlockProps) => {
  const [isRecording, setIsRecording] = useState(false);

  const toggleRecording = () => {
    const newRecordingState = !isRecording;
    setIsRecording(newRecordingState);
    
    if (newRecordingState) {
      // If starting recording, set current time as start time
      const now = new Date();
      const timeString = now.toTimeString().split(' ')[0];
      onChange(index, "startTime", timeString);
    } else {
      // If stopping recording, set current time as end time
      const now = new Date();
      const timeString = now.toTimeString().split(' ')[0];
      onChange(index, "endTime", timeString);
    }
    
    onChange(index, "isRecording", newRecordingState);
  };

  return (
    <div className="space-y-4 p-4 bg-clinical-50 rounded-lg animate-fade-in">
      <div className="flex justify-between items-start mb-4">
        <h4 className="text-lg font-medium text-clinical-800">Block {index + 1}</h4>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleRecording}
          className="relative"
        >
          {!isRecording && !startTime && !endTime && (
            <Circle className="h-6 w-6 text-gray-500" />
          )}
          {isRecording && (
            <CheckCircle2 className="h-6 w-6 text-green-500 animate-pulse" />
          )}
          {!isRecording && (startTime || endTime) && (
            <XCircle className="h-6 w-6 text-red-500" />
          )}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`start-time-${index}`}>Start Time</Label>
          <Input
            id={`start-time-${index}`}
            type="time"
            step="1"
            value={startTime}
            onChange={(e) => onChange(index, "startTime", e.target.value)}
            readOnly={isRecording}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`end-time-${index}`}>End Time</Label>
          <Input
            id={`end-time-${index}`}
            type="time"
            step="1"
            value={endTime}
            onChange={(e) => onChange(index, "endTime", e.target.value)}
            readOnly={isRecording}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`notes-${index}`}>Notes</Label>
        <Textarea
          id={`notes-${index}`}
          placeholder="Add notes here..."
          value={notes}
          onChange={(e) => onChange(index, "notes", e.target.value)}
          className="h-20"
        />
      </div>
    </div>
  );
};


import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface TimeBlockProps {
  index: number;
  startTime: string;
  endTime: string;
  notes: string;
  onChange: (index: number, field: "startTime" | "endTime" | "notes", value: string) => void;
}

export const TimeBlock = ({ index, startTime, endTime, notes, onChange }: TimeBlockProps) => {
  return (
    <div className="space-y-4 p-4 bg-clinical-50 rounded-lg animate-fade-in">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`start-time-${index}`}>Start Time</Label>
          <Input
            id={`start-time-${index}`}
            type="time"
            step="1"
            value={startTime}
            onChange={(e) => onChange(index, "startTime", e.target.value)}
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

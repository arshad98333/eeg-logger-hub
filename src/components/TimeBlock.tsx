
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface TimeBlockProps {
  index: number;
  startTime: string;
  endTime: string;
  notes: string;
  sessionId: string;
  onChange: (index: number, field: "startTime" | "endTime" | "notes" | "isRecording", value: any) => void;
}

const formatTimeTo12Hour = (time24: string) => {
  if (!time24) return '';
  try {
    const [hours, minutes, seconds] = time24.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'pm' : 'am';
    const hour12 = hour % 12 || 12;
    return `${String(hour12).padStart(2, '0')}:${minutes}:${seconds || '00'} ${ampm}`;
  } catch {
    return '';
  }
};

export const TimeBlock = ({ index, startTime, endTime, notes, onChange }: TimeBlockProps) => {
  return (
    <div className="space-y-4 p-4 bg-clinical-50 rounded-lg animate-fade-in">
      <div className="flex justify-between items-start mb-4">
        <h4 className="text-lg font-medium text-clinical-800">Block {index}</h4>
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
          />
          {startTime && (
            <p className="text-sm text-gray-500 mt-1">
              {formatTimeTo12Hour(startTime)}
            </p>
          )}
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
          {endTime && (
            <p className="text-sm text-gray-500 mt-1">
              {formatTimeTo12Hour(endTime)}
            </p>
          )}
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

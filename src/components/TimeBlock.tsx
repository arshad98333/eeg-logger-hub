
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Circle, CheckCircle2, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface TimeBlockProps {
  index: number;
  startTime: string;
  endTime: string;
  notes: string;
  sessionId: string;
  onChange: (index: number, field: "startTime" | "endTime" | "notes", value: string) => void;
}

export const TimeBlock = ({ index, startTime, endTime, notes, sessionId, onChange }: TimeBlockProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [blockId, setBlockId] = useState<string | null>(null);

  useEffect(() => {
    loadBlockData();
  }, [sessionId, index]);

  const loadBlockData = async () => {
    try {
      const { data, error } = await supabase
        .from('blocks')
        .select('*')
        .eq('session_id', sessionId)
        .eq('block_index', index)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setBlockId(data.id);
        setIsRecording(data.is_recording);
        onChange(index, "startTime", data.start_time || "");
        onChange(index, "endTime", data.end_time || "");
        onChange(index, "notes", data.notes || "");
      }
    } catch (error) {
      console.error('Error loading block data:', error);
    }
  };

  const saveBlockData = async () => {
    try {
      const blockData = {
        session_id: sessionId,
        block_index: index,
        start_time: startTime,
        end_time: endTime,
        notes,
        is_recording: isRecording,
      };

      if (blockId) {
        const { error } = await supabase
          .from('blocks')
          .update(blockData)
          .eq('id', blockId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('blocks')
          .insert(blockData)
          .select('id')
          .single();
        if (error) throw error;
        if (data) setBlockId(data.id);
      }
    } catch (error) {
      console.error('Error saving block data:', error);
    }
  };

  const toggleRecording = async () => {
    const newRecordingState = !isRecording;
    setIsRecording(newRecordingState);
    await saveBlockData();
  };

  // Save block data whenever any field changes
  useEffect(() => {
    if (sessionId) {
      saveBlockData();
    }
  }, [startTime, endTime, notes, isRecording]);

  return (
    <div className="space-y-4 p-4 bg-clinical-50 rounded-lg animate-fade-in">
      <div className="flex justify-between items-start mb-4">
        <h4 className="text-lg font-medium text-clinical-800">Block {index}</h4>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleRecording}
          className="relative"
        >
          {!isRecording && (
            <Circle className="h-6 w-6 text-gray-500" />
          )}
          {isRecording && (
            <CheckCircle2 className="h-6 w-6 text-green-500 animate-pulse" />
          )}
          {!isRecording && startTime && endTime && (
            <XCircle className="h-6 w-6 text-red-500 animate-pulse" />
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

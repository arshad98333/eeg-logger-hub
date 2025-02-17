
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { TimeBlock } from "./TimeBlock";
import { useToast } from "@/hooks/use-toast";

interface SessionLoggingProps {
  candidateName: string;
  sessionNumber: number;
  onSave: (sessionData: any) => void;
}

export const SessionLogging = ({ candidateName, sessionNumber, onSave }: SessionLoggingProps) => {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!impedanceH || !impedanceL) {
      toast({
        title: "Missing Information",
        description: "Please fill in impedance values",
        variant: "destructive",
      });
      return;
    }

    const sessionData = {
      session_id: `${candidateName.substring(0, 2).toUpperCase()}${String(sessionNumber).padStart(4, "0")}`,
      impedance_h: impedanceH,
      impedance_l: impedanceL,
      blocks,
    };

    onSave(sessionData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-slide-up">
      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4">
          Session {sessionNumber} - ID: {candidateName.substring(0, 2).toUpperCase()}
          {String(sessionNumber).padStart(4, "0")}
        </h3>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="space-y-2">
            <Label htmlFor="impedanceH">Impedance H</Label>
            <Input
              id="impedanceH"
              placeholder="H-value"
              value={impedanceH}
              onChange={(e) => setImpedanceH(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="impedanceL">Impedance L</Label>
            <Input
              id="impedanceL"
              placeholder="L-value"
              value={impedanceL}
              onChange={(e) => setImpedanceL(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-4">
          {blocks.map((block, index) => (
            <TimeBlock
              key={index}
              index={index}
              startTime={block.startTime}
              endTime={block.endTime}
              notes={block.notes}
              onChange={handleBlockChange}
            />
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <Button type="submit">Save Session</Button>
        </div>
      </Card>
    </form>
  );
};

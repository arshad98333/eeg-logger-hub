
export interface Block {
  startTime: string;
  endTime: string;
  notes: string;
  isRecording: boolean;
}

export interface SessionData {
  candidateName: string;
  sessionNumber: number;
  sessionId: string;
  impedanceH: string;
  impedanceL: string;
  blocks: Block[];
}

export interface SessionLoggingProps {
  candidateName: string;
  sessionNumber: number;
  onSave: (sessionData: any) => void;
}


export const MAX_BLOCKS_PER_SESSION = 7;
export const MAX_SESSIONS = 14;

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

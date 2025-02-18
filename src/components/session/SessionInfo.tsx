
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { SessionData } from "@/types/session";

interface SessionInfoProps {
  sessionData: SessionData;
  onSessionDataChange: (newData: SessionData) => void;
  candidateName: string;
  currentSession: number;
}

export const SessionInfo = ({ 
  sessionData, 
  onSessionDataChange, 
  candidateName, 
  currentSession 
}: SessionInfoProps) => {
  return (
    <div className="space-y-4">
      <h4 className="text-lg font-medium text-clinical-800">Session Information</h4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="sessionId">Session ID</Label>
          <Input
            id="sessionId"
            placeholder="Session ID"
            value={sessionData.sessionId}
            onChange={(e) => {
              const newData = { ...sessionData, sessionId: e.target.value };
              onSessionDataChange(newData);
              
              try {
                supabase
                  .from('sessions')
                  .update({
                    session_id: e.target.value
                  })
                  .eq('candidate_name', candidateName)
                  .eq('session_number', currentSession);
              } catch (error) {
                console.error('Error updating session ID:', error);
              }
            }}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="impedanceH">High</Label>
          <Input
            id="impedanceH"
            placeholder="H-value"
            value={sessionData.impedanceH}
            onChange={(e) => {
              const newData = { ...sessionData, impedanceH: e.target.value };
              onSessionDataChange(newData);
              
              // Save to Supabase
              try {
                supabase
                  .from('sessions')
                  .update({
                    impedance_h: e.target.value
                  })
                  .eq('candidate_name', candidateName)
                  .eq('session_number', currentSession);

                // Save to localStorage
                const stored = localStorage.getItem("clinical-session-data");
                if (stored) {
                  const allSessions = JSON.parse(stored);
                  if (!allSessions[candidateName]) {
                    allSessions[candidateName] = {};
                  }
                  if (!allSessions[candidateName][currentSession]) {
                    allSessions[candidateName][currentSession] = {};
                  }
                  allSessions[candidateName][currentSession] = {
                    ...allSessions[candidateName][currentSession],
                    impedanceH: e.target.value
                  };
                  localStorage.setItem("clinical-session-data", JSON.stringify(allSessions));
                }
              } catch (error) {
                console.error('Error updating impedance H:', error);
              }
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
              onSessionDataChange(newData);
              
              // Save to Supabase
              try {
                supabase
                  .from('sessions')
                  .update({
                    impedance_l: e.target.value
                  })
                  .eq('candidate_name', candidateName)
                  .eq('session_number', currentSession);

                // Save to localStorage
                const stored = localStorage.getItem("clinical-session-data");
                if (stored) {
                  const allSessions = JSON.parse(stored);
                  if (!allSessions[candidateName]) {
                    allSessions[candidateName] = {};
                  }
                  if (!allSessions[candidateName][currentSession]) {
                    allSessions[candidateName][currentSession] = {};
                  }
                  allSessions[candidateName][currentSession] = {
                    ...allSessions[candidateName][currentSession],
                    impedanceL: e.target.value
                  };
                  localStorage.setItem("clinical-session-data", JSON.stringify(allSessions));
                }
              } catch (error) {
                console.error('Error updating impedance L:', error);
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};

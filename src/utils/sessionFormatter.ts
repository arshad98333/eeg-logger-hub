
export const formatSessionData = (sessionData: any, selectedCandidate: string) => {
  if (!sessionData || !sessionData.blocks) {
    return "No session data available";
  }

  let formattedText = `CANDIDATE NAME: ${selectedCandidate}\n\n`;
  formattedText += `SESSION INFORMATION:\n`;
  formattedText += `Session : ${String(sessionData.sessionNumber).padStart(2, '0')}\n`;
  formattedText += `Session ID : ${sessionData.sessionId}\n`;
  formattedText += `High (H) : ${sessionData.impedanceH}\n`;
  formattedText += `Low (L) : ${sessionData.impedanceL}\n\n`;
  formattedText += `TIMINGS:\n\n`;

  sessionData.blocks.forEach((block: any, index: number) => {
    formattedText += `Block ${index + 1}:\n`;
    if (block.startTime && block.endTime) {
      formattedText += `${block.startTime} - ${block.endTime}\n`;
    }
    if (block.notes) {
      formattedText += `Notes: ${block.notes}\n`;
    }
    formattedText += '\n';
  });

  return formattedText;
};

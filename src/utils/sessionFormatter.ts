
export const formatSessionData = (sessionData: any, selectedCandidate: string) => {
  const blocks = sessionData.blocks;
  let formattedText = `CANDIDATE NAME: ${selectedCandidate}\n\n`;
  formattedText += `SESSION INFORMATION:\n`;
  formattedText += `Session : ${String(sessionData.sessionNumber).padStart(2, '0')}\n`;
  formattedText += `Session ID : ${sessionData.sessionId}\n`;
  formattedText += `High (H) : ${sessionData.impedanceH}\n`;
  formattedText += `Low (L) : ${sessionData.impedanceL}\n\n`;
  formattedText += `TIMINGS:\n\n`;

  blocks.forEach((block: any) => {
    if (block.startTime && block.endTime) {
      formattedText += `${block.startTime}\t${block.endTime}\n`;
    }
  });

  formattedText += `\nNOTES:\n`;
  blocks.forEach((block: any) => {
    formattedText += `${block.notes || 'NO NOTES'}\n`;
  });

  return formattedText;
};

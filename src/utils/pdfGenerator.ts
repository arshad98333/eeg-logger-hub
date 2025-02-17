
import jsPDF from 'jspdf';

export const generateSessionPDF = (
  selectedCandidate: string,
  currentSession: any
) => {
  const doc = new jsPDF();
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  
  doc.text("Clinical Session Report", 105, 20, { align: "center" });
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(`Candidate: ${selectedCandidate}`, 20, 40);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 48);
  
  doc.setFont("helvetica", "bold");
  doc.text(`Session: ${String(currentSession.sessionNumber).padStart(2, '0')}`, 20, 60);
  doc.text(`Session ID: ${currentSession.sessionId}`, 20, 68);
  doc.text(`High (H): ${currentSession.impedanceH}`, 20, 76);
  doc.text(`Low (L): ${currentSession.impedanceL}`, 20, 84);
  
  doc.setFont("helvetica", "bold");
  doc.text("TIMINGS:", 20, 98);
  doc.setFont("helvetica", "normal");
  
  let yPosition = 108;
  currentSession.blocks.forEach((block: any) => {
    if (block.startTime && block.endTime) {
      doc.text(`${block.startTime}  -  ${block.endTime}`, 20, yPosition);
      yPosition += 8;
    }
  });
  
  yPosition += 10;
  doc.setFont("helvetica", "bold");
  doc.text("NOTES:", 20, yPosition);
  doc.setFont("helvetica", "normal");
  
  yPosition += 10;
  currentSession.blocks.forEach((block: any) => {
    const note = block.notes || 'NO NOTES';
    const splitNotes = doc.splitTextToSize(note, 170);
    doc.text(splitNotes, 20, yPosition);
    yPosition += 10 * splitNotes.length;
  });
  
  doc.setFontSize(10);
  doc.setTextColor(128, 128, 128);
  doc.text("ARSHADIFY MEDICS", 105, 280, { align: "center" });
  
  return doc;
};

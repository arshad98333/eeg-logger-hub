
import { jsPDF } from "jspdf";

interface BlockData {
  block_index: number;
  start_time: string;
  end_time: string;
  notes: string;
}

interface SessionData {
  session_number: number;
  impedance_h: string;
  impedance_l: string;
  blocks: BlockData[];
}

export const generateSessionPDF = (candidateName: string, sessionData: SessionData) => {
  const doc = new jsPDF();
  
  // Add header
  doc.setFontSize(16);
  doc.text(`Session Report - ${candidateName}`, 20, 20);
  
  // Add session info
  doc.setFontSize(12);
  doc.text(`Session Number: ${sessionData.session_number}`, 20, 40);
  doc.text(`Impedance Values: H-${sessionData.impedance_h} / L-${sessionData.impedance_l}`, 20, 50);
  
  // Add blocks information
  doc.text("Block Timings:", 20, 70);
  let yPos = 80;
  
  sessionData.blocks.forEach((block) => {
    if (block.start_time && block.end_time) {
      doc.text(`Block ${block.block_index}: ${block.start_time} - ${block.end_time}`, 30, yPos);
      yPos += 10;
    }
  });
  
  // Add notes
  doc.text("Notes:", 20, yPos + 10);
  yPos += 20;
  
  sessionData.blocks.forEach((block) => {
    if (block.notes) {
      const noteText = `Block ${block.block_index}: ${block.notes}`;
      doc.text(noteText, 30, yPos, { maxWidth: 150 });
      yPos += 10;
    }
  });
  
  return doc;
};

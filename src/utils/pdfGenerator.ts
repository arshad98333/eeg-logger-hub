
import jsPDF from 'jspdf';

interface SessionData {
  sessionNumber: number;
  impedanceH: string;
  impedanceL: string;
  session_id: string;
  blocks: {
    start_time: string;
    end_time: string;
    notes: string;
  }[];
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

export const generateSessionPDF = (candidateName: string, sessionData: SessionData) => {
  const doc = new jsPDF();
  
  // Header Section
  doc.setFillColor(240, 240, 240);
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(44, 62, 80);
  doc.text("Clinical Session Report", 105, 20, { align: "center" });
  
  // Candidate Info Box
  doc.setFillColor(249, 250, 251);
  doc.rect(10, 45, 190, 25, 'F');
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text("Candidate Details", 15, 55);
  doc.setFont("helvetica", "normal");
  doc.text(`Name: ${candidateName}`, 25, 63);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 120, 63);
  
  // Session Info Box
  doc.setFillColor(249, 250, 251);
  doc.rect(10, 75, 190, 30, 'F');
  doc.setFont("helvetica", "bold");
  doc.text("Session Information", 15, 85);
  doc.setFont("helvetica", "normal");
  doc.text(`Session: ${String(sessionData.sessionNumber).padStart(2, '0')}`, 25, 93);
  doc.text(`Session ID: ${sessionData.session_id || candidateName}`, 25, 100);
  doc.text(`Impedance: H-${sessionData.impedanceH || 'N/A'}/L-${sessionData.impedanceL || 'N/A'}`, 120, 100);
  
  // Timings Box
  doc.setFillColor(249, 250, 251);
  doc.rect(10, 110, 190, 80, 'F');
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("TIMINGS", 15, 120);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  
  let yPosition = 130;
  sessionData.blocks.forEach((block, index) => {
    if (block.start_time && block.end_time) {
      const start12h = formatTimeTo12Hour(block.start_time);
      const end12h = formatTimeTo12Hour(block.end_time);
      doc.text(`${start12h}  -  ${end12h}`, 25, yPosition);
      yPosition += 8;
    }
  });
  
  // Notes Box
  doc.setFillColor(249, 250, 251);
  doc.rect(10, 195, 190, 80, 'F');
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("NOTES", 15, 205);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  
  yPosition = 215;
  sessionData.blocks.forEach((block, index) => {
    if (block.notes) {
      const splitNotes = doc.splitTextToSize(block.notes, 150);
      doc.text(splitNotes, 25, yPosition);
      yPosition += 8 * (splitNotes.length || 1) + 2;
    } else {
      doc.text("NO NOTES", 25, yPosition);
      yPosition += 8;
    }
  });
  
  // Footer
  doc.setFillColor(240, 240, 240);
  doc.rect(0, 275, 210, 22, 'F');
  doc.setFontSize(10);
  doc.setTextColor(128, 128, 128);
  doc.text("Generated by Clinical Session Logger", 105, 287, { align: "center" });
  
  return doc;
};

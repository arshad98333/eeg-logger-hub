
import { jsPDF } from 'jspdf';
import { drawTable, formatBlocksForTable } from './pdfTableFormatter';

export const generateSessionPDF = (
  selectedCandidate: string,
  currentSession: any
) => {
  const doc = new jsPDF();
  let yPosition = 20;
  
  // Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Clinical Session Report", 105, yPosition, { align: "center" });
  
  // Basic Info Table
  yPosition += 15;
  const basicInfoData = [
    ["Candidate", selectedCandidate],
    ["Date", new Date().toLocaleDateString()],
    ["Session", String(currentSession.sessionNumber).padStart(2, '0')],
    ["Session ID", currentSession.sessionId],
    ["High (H)", currentSession.impedanceH],
    ["Low (L)", currentSession.impedanceL]
  ];

  yPosition = drawTable(doc, basicInfoData, yPosition, {
    columnWidths: [40, 70],
    rowHeight: 8,
    fontSize: 10
  });

  // Blocks Table
  yPosition += 10;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("SESSION BLOCKS", 20, yPosition);
  
  yPosition += 5;
  const blocksTableHeaders = [["Block", "Start", "End", "Notes"]];
  const blocksData = formatBlocksForTable(currentSession.blocks);
  const allBlocksData = [...blocksTableHeaders, ...blocksData];

  drawTable(doc, allBlocksData, yPosition, {
    columnWidths: [25, 30, 30, 85],
    rowHeight: 10,
    fontSize: 9,
    headerColor: '#e5e7eb'
  });

  // Footer
  doc.setFontSize(10);
  doc.setTextColor(128, 128, 128);
  doc.text("ARSHADIFY MEDICS", 105, 280, { align: "center" });
  
  return doc;
};

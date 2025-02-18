
import { jsPDF } from 'jspdf';
import { drawTable, formatBlocksForTable } from './pdfTableFormatter';

export const generateSessionPDF = (
  selectedCandidate: string,
  currentSession: any
) => {
  const doc = new jsPDF();
  let yPosition = 20;
  
  // Colors
  const primaryPurple = '#9b87f5';
  const darkCharcoal = '#221F26';
  const oceanBlue = '#0EA5E9';
  
  // Header with gradient-like effect
  doc.setFillColor(parseInt(primaryPurple.slice(1,3), 16), 
                   parseInt(primaryPurple.slice(3,5), 16), 
                   parseInt(primaryPurple.slice(5,7), 16));
  doc.rect(0, 0, doc.internal.pageSize.width, 40, 'F');
  
  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("Clinical Session Report", 105, yPosition, { align: "center" });
  
  // Reset text color
  doc.setTextColor(darkCharcoal);
  
  // Basic Info Table
  yPosition += 30;
  const basicInfoData = [
    ["Candidate", "Date", "Session", "Session ID", "High (H)", "Low (L)"],
    [
      selectedCandidate,
      new Date().toLocaleDateString(),
      String(currentSession.sessionNumber).padStart(2, '0'),
      currentSession.sessionId,
      currentSession.impedanceH,
      currentSession.impedanceL
    ]
  ];

  yPosition = drawTable(doc, basicInfoData, yPosition, {
    columnWidths: [30, 30, 25, 40, 30, 30],
    rowHeight: 12,
    fontSize: 10,
    headerColor: primaryPurple,
    headerTextColor: '#FFFFFF'
  });

  // Blocks Table
  yPosition += 15;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(oceanBlue);
  doc.text("SESSION BLOCKS", 20, yPosition);
  
  yPosition += 8;
  const blocksTableHeaders = [["Block", "Start", "End", "Notes"]];
  const blocksData = formatBlocksForTable(currentSession.blocks);
  const allBlocksData = [...blocksTableHeaders, ...blocksData];

  drawTable(doc, allBlocksData, yPosition, {
    columnWidths: [25, 30, 30, 85],
    rowHeight: 10,
    fontSize: 9,
    headerColor: primaryPurple,
    headerTextColor: '#FFFFFF'
  });

  // Footer with company name
  doc.setFillColor(parseInt(darkCharcoal.slice(1,3), 16), 
                   parseInt(darkCharcoal.slice(3,5), 16), 
                   parseInt(darkCharcoal.slice(5,7), 16));
  doc.rect(0, doc.internal.pageSize.height - 20, doc.internal.pageSize.width, 20, 'F');
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text("ARSHADIFY MEDICS", 105, doc.internal.pageSize.height - 8, { 
    align: "center"
  });
  
  return doc;
};

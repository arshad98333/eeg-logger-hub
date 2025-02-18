
import { jsPDF } from 'jspdf';

export const drawTable = (doc: jsPDF, data: string[][], startY: number, config: {
  columnWidths: number[];
  rowHeight: number;
  fontSize?: number;
  headerColor?: string;
  headerTextColor?: string;
}) => {
  const { 
    columnWidths, 
    rowHeight, 
    fontSize = 10, 
    headerColor = '#f3f4f6',
    headerTextColor = '#000000'
  } = config;
  
  const margin = 20;
  doc.setFontSize(fontSize);

  // Draw header row with background
  if (headerColor) {
    doc.setFillColor(
      parseInt(headerColor.slice(1,3), 16),
      parseInt(headerColor.slice(3,5), 16),
      parseInt(headerColor.slice(5,7), 16)
    );
    doc.rect(margin, startY, columnWidths.reduce((a, b) => a + b, 0), rowHeight, 'F');
  }
  
  let currentY = startY;
  let currentX = margin;

  data.forEach((row, rowIndex) => {
    currentX = margin;
    
    row.forEach((cell, colIndex) => {
      // Center align text in cell
      const textWidth = doc.getStringUnitWidth(cell) * fontSize / doc.internal.scaleFactor;
      const xOffset = (columnWidths[colIndex] - textWidth) / 2;
      
      // Header row styling
      if (rowIndex === 0) {
        doc.setFont("helvetica", "bold");
        doc.setTextColor(headerTextColor);
      } else {
        doc.setFont("helvetica", "normal");
        doc.setTextColor(0, 0, 0);
      }
      
      doc.text(cell, currentX + xOffset, currentY + (rowHeight / 1.5));
      
      // Draw cell borders with subtle color
      doc.setDrawColor(220, 220, 220);
      doc.rect(currentX, currentY, columnWidths[colIndex], rowHeight);
      
      currentX += columnWidths[colIndex];
    });
    
    currentY += rowHeight;
  });

  return currentY;
};

export const formatBlocksForTable = (blocks: any[]) => {
  return blocks
    .filter(block => block.startTime && block.endTime)
    .map((block, index) => [
      `Block ${index + 1}`,
      block.startTime,
      block.endTime,
      block.notes || 'NO NOTES'
    ]);
};

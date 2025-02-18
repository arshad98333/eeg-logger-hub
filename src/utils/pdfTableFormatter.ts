
import { jsPDF } from 'jspdf';

export const drawTable = (doc: jsPDF, data: string[][], startY: number, config: {
  columnWidths: number[];
  rowHeight: number;
  fontSize?: number;
  headerColor?: string;
}) => {
  const { columnWidths, rowHeight, fontSize = 10, headerColor = '#f3f4f6' } = config;
  const margin = 20;
  doc.setFontSize(fontSize);

  // Draw header row with background
  doc.setFillColor(headerColor);
  doc.rect(margin, startY, columnWidths.reduce((a, b) => a + b, 0), rowHeight, 'F');
  
  let currentY = startY;
  let currentX = margin;

  data.forEach((row, rowIndex) => {
    currentX = margin;
    
    row.forEach((cell, colIndex) => {
      // Center align text in cell
      const textWidth = doc.getStringUnitWidth(cell) * fontSize / doc.internal.scaleFactor;
      const xOffset = (columnWidths[colIndex] - textWidth) / 2;
      
      // Bold for header row
      if (rowIndex === 0) {
        doc.setFont("helvetica", "bold");
      } else {
        doc.setFont("helvetica", "normal");
      }
      
      doc.text(cell, currentX + xOffset, currentY + (rowHeight / 1.5));
      
      // Draw cell borders
      doc.rect(currentX, currentY, columnWidths[colIndex], rowHeight);
      
      currentX += columnWidths[colIndex];
    });
    
    currentY += rowHeight;
  });

  return currentY; // Return the Y position after the table
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

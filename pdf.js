const PDFDocument = require('pdfkit');

// Builds a PDF for a teacher's weekly schedule and pipes it to `res`.
// grid: 2D array [day][period] -> {subject, className} | null
function streamTeacherPdf(res, teacherName, days, periodsPerDay, grid) {
  const doc = new PDFDocument({ margin: 36, size: 'A4', layout: 'landscape' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${teacherName.replace(/\s+/g, '_')}_timetable.pdf"`);
  doc.pipe(res);

  doc.fontSize(18).text(`${teacherName}: Weekly Timetable`, { align: 'center' });
  doc.moveDown(1);

  const startX = doc.page.margins.left;
  const startY = doc.y;
  const usableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const colWidth = usableWidth / (periodsPerDay + 1);
  const rowHeight = 36;

  doc.fontSize(10);

  // Header row
  doc.font('Helvetica-Bold');
  drawCell(doc, startX, startY, colWidth, rowHeight, 'Day');
  for (let period = 0; period < periodsPerDay; period++) {
    drawCell(doc, startX + colWidth * (period + 1), startY, colWidth, rowHeight, `P${period + 1}`);
  }

  // Body rows
  doc.font('Helvetica');
  days.forEach((day, dayIndex) => {
    const y = startY + rowHeight * (dayIndex + 1);
    drawCell(doc, startX, y, colWidth, rowHeight, day);

    for (let period = 0; period < periodsPerDay; period++) {
      const cell = grid[dayIndex][period];
      const text = cell
        ? `${cell.subject}\n${cell.className}${cell.room ? '\n' + cell.room : ''}${cell.locked ? '\n(fixed)' : ''}`
        : '';
      drawCell(doc, startX + colWidth * (period + 1), y, colWidth, rowHeight, text);
    }
  });

  doc.end();
}

function drawCell(doc, x, y, width, height, text) {
  doc.rect(x, y, width, height).stroke();
  doc.text(text, x + 4, y + 4, { width: width - 8, height: height - 8 });
}

module.exports = { streamTeacherPdf };

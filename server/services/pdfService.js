const pdfParse = require('pdf-parse');

/**
 * Extract text content from a PDF buffer.
 */
async function extractTextFromPDF(buffer) {
  try {
    const data = await pdfParse(buffer);
    return data.text || '';
  } catch (err) {
    console.error('PDF extraction error:', err);
    throw new Error('Failed to extract text from PDF.');
  }
}

module.exports = { extractTextFromPDF };

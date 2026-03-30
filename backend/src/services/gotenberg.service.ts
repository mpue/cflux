import axios from 'axios';
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import AdmZip from 'adm-zip';

const GOTENBERG_URL = process.env.GOTENBERG_URL || 'http://localhost:3000';

// File extensions that Gotenberg can convert to PDF via LibreOffice
const LIBRE_OFFICE_EXTENSIONS = new Set([
  '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
  '.odt', '.ods', '.odp', '.odg',
  '.rtf', '.txt', '.csv', '.html', '.htm',
  '.bmp', '.gif', '.jpg', '.jpeg', '.png', '.svg', '.tiff', '.webp',
]);

// Presentation formats are typically landscape
const PRESENTATION_EXTENSIONS = new Set(['.ppt', '.pptx', '.odp']);

/**
 * Check if a file can be converted to PDF via Gotenberg
 */
export function canConvertToPdf(filename: string): boolean {
  const ext = path.extname(filename).toLowerCase();
  // Already a PDF - no conversion needed
  if (ext === '.pdf') return false;
  return LIBRE_OFFICE_EXTENSIONS.has(ext);
}

/**
 * Check if a file is already a PDF
 */
export function isPdf(filename: string): boolean {
  return path.extname(filename).toLowerCase() === '.pdf';
}

/**
 * Detect if a document file has landscape orientation.
 * Parses OOXML (.docx, .xlsx, .pptx) and ODF (.odt, .ods, .odp) formats.
 * Presentations default to landscape.
 */
export function detectLandscape(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();

  // Presentations are almost always landscape
  if (PRESENTATION_EXTENSIONS.has(ext)) {
    return true;
  }

  try {
    const zip = new AdmZip(filePath);

    if (ext === '.docx') {
      const entry = zip.getEntry('word/document.xml');
      if (entry) {
        const xml = entry.getData().toString('utf8');
        // <w:pgSz ... w:orient="landscape" ...>
        return /w:orient\s*=\s*"landscape"/i.test(xml);
      }
    }

    if (ext === '.xlsx') {
      // Check the first worksheet for landscape page setup
      const entry = zip.getEntry('xl/worksheets/sheet1.xml');
      if (entry) {
        const xml = entry.getData().toString('utf8');
        // <pageSetup ... orientation="landscape" ...>
        return /orientation\s*=\s*"landscape"/i.test(xml);
      }
    }

    if (ext === '.odt' || ext === '.ods') {
      const entry = zip.getEntry('styles.xml');
      if (entry) {
        const xml = entry.getData().toString('utf8');
        // <style:page-layout-properties ... style:print-orientation="landscape" ...>
        return /print-orientation\s*=\s*"landscape"/i.test(xml);
      }
    }
  } catch (err) {
    // If we can't parse the file, default to portrait
    console.warn('Could not detect document orientation:', err);
  }

  return false;
}

/**
 * Convert a document to PDF using Gotenberg's LibreOffice route
 * Returns the path to the generated PDF file
 */
export async function convertToPdf(
  inputFilePath: string,
  outputDir: string,
  outputFilename: string,
  landscape?: boolean
): Promise<string> {
  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, outputFilename);

  // Auto-detect landscape if not explicitly provided
  const isLandscape = landscape ?? detectLandscape(inputFilePath);

  const form = new FormData();
  form.append('files', fs.createReadStream(inputFilePath), {
    filename: path.basename(inputFilePath),
  });

  if (isLandscape) {
    form.append('landscape', 'true');
  }

  const response = await axios.post(
    `${GOTENBERG_URL}/forms/libreoffice/convert`,
    form,
    {
      headers: form.getHeaders(),
      responseType: 'arraybuffer',
      timeout: 60000, // 60s timeout for large documents
    }
  );

  fs.writeFileSync(outputPath, Buffer.from(response.data));
  return outputPath;
}

/**
 * Generate a PDF preview for an uploaded attachment.
 * - If the file is already a PDF, returns null (use the original).
 * - If the file can be converted, creates a PDF in the pdfs/ subdirectory.
 * - If the file type is unsupported, returns null.
 */
export async function generatePdfPreview(
  originalFilePath: string,
  originalFilename: string,
  attachmentFilename: string
): Promise<string | null> {
  if (isPdf(originalFilename)) {
    // Already a PDF - no conversion needed
    return null;
  }

  if (!canConvertToPdf(originalFilename)) {
    // Unsupported format
    return null;
  }

  const pdfDir = path.join(path.dirname(originalFilePath), '..', 'attachments-pdf');
  const pdfFilename = attachmentFilename.replace(path.extname(attachmentFilename), '.pdf');

  try {
    await convertToPdf(originalFilePath, pdfDir, pdfFilename);
    return `/uploads/attachments-pdf/${pdfFilename}`;
  } catch (error) {
    console.error('Gotenberg PDF conversion failed:', error);
    return null;
  }
}

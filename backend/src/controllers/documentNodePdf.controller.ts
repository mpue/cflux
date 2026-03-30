import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import axios from 'axios';
import FormData from 'form-data';

const GOTENBERG_URL = process.env.GOTENBERG_URL || 'http://localhost:3000';

/**
 * Build a styled HTML page for Gotenberg Chromium conversion
 */
function buildHtmlPage(title: string, content: string, meta: {
  author?: string;
  createdAt?: string;
  updatedAt?: string;
}): string {
  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <style>
    @page { size: A4; margin: 20mm; }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 11pt;
      line-height: 1.6;
      color: #1a1a1a;
      max-width: 100%;
    }
    .header { margin-bottom: 24px; }
    .header h1 { font-size: 22pt; margin: 0 0 8px 0; color: #111; }
    .meta { font-size: 9pt; color: #666; margin-bottom: 16px; }
    .meta span { margin-right: 16px; }
    hr.title-rule { border: none; border-top: 1px solid #ccc; margin: 16px 0 24px 0; }
    h1 { font-size: 20pt; margin-top: 24px; }
    h2 { font-size: 16pt; margin-top: 20px; }
    h3 { font-size: 14pt; margin-top: 16px; }
    h4 { font-size: 12pt; margin-top: 14px; }
    h5, h6 { font-size: 11pt; margin-top: 12px; }
    p { margin: 8px 0; }
    ul, ol { margin: 8px 0; padding-left: 24px; }
    li { margin: 4px 0; }
    code {
      font-family: 'Consolas', 'Courier New', monospace;
      background: #f5f5f5;
      padding: 2px 4px;
      border-radius: 3px;
      font-size: 10pt;
      color: #d63384;
    }
    pre {
      background: #f8f9fa;
      border: 1px solid #dee2e6;
      border-radius: 4px;
      padding: 12px;
      overflow-x: auto;
      font-size: 9pt;
      line-height: 1.4;
    }
    pre code { background: none; padding: 0; color: #212529; }
    blockquote {
      border-left: 4px solid #dee2e6;
      margin: 12px 0;
      padding: 8px 16px;
      color: #6c757d;
      font-style: italic;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 12px 0;
    }
    th, td {
      border: 1px solid #dee2e6;
      padding: 8px 12px;
      text-align: left;
    }
    th { background: #f8f9fa; font-weight: 600; }
    a { color: #0d6efd; }
    img { max-width: 100%; height: auto; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${escapeHtml(title)}</h1>
    <div class="meta">
      ${meta.author ? `<span>Autor: ${escapeHtml(meta.author)}</span>` : ''}
      ${meta.createdAt ? `<span>Erstellt: ${meta.createdAt}</span>` : ''}
      ${meta.updatedAt ? `<span>Zuletzt bearbeitet: ${meta.updatedAt}</span>` : ''}
    </div>
    <hr class="title-rule">
  </div>
  ${content}
</body>
</html>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Export a document node as PDF via Gotenberg
 */
export const exportDocumentToPDF = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Get the document
    const document = await prisma.documentNode.findFirst({
      where: {
        id,
        deletedAt: null,
        type: 'DOCUMENT',
      },
      include: {
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        updatedBy: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Check permissions (same as read permission)
    const userGroups = await prisma.userGroupMembership.findMany({
      where: {
        userId,
        userGroup: { isActive: true },
      },
      select: {
        userGroupId: true,
      },
    });

    const userGroupIds = userGroups.map((ug) => ug.userGroupId);

    const nodePermissions = await prisma.documentNodeGroupPermission.findMany({
      where: { documentNodeId: id },
    });

    // If permissions are set, check if user has access
    if (nodePermissions.length > 0) {
      const hasAccess = nodePermissions.some((perm) =>
        userGroupIds.includes(perm.userGroupId)
      );
      if (!hasAccess) {
        return res.status(403).json({ error: 'No permission to access this document' });
      }
    }

    // Build styled HTML page
    const htmlPage = buildHtmlPage(document.title, document.content, {
      author: document.updatedBy
        ? `${document.updatedBy.firstName} ${document.updatedBy.lastName}`
        : undefined,
      createdAt: document.createdAt
        ? new Date(document.createdAt).toLocaleString('de-DE')
        : undefined,
      updatedAt: document.updatedAt
        ? new Date(document.updatedAt).toLocaleString('de-DE')
        : undefined,
    });

    // Send to Gotenberg Chromium route
    const form = new FormData();
    form.append('files', Buffer.from(htmlPage, 'utf-8'), {
      filename: 'index.html',
      contentType: 'text/html',
    });
    form.append('paperWidth', '8.27');   // A4
    form.append('paperHeight', '11.69'); // A4
    form.append('marginTop', '0.79');    // ~20mm
    form.append('marginBottom', '0.79');
    form.append('marginLeft', '0.79');
    form.append('marginRight', '0.79');

    const pdfResponse = await axios.post(
      `${GOTENBERG_URL}/forms/chromium/convert/html`,
      form,
      {
        headers: form.getHeaders(),
        responseType: 'arraybuffer',
        timeout: 30000,
      }
    );

    // Set response headers for PDF download
    const filename = `${document.title.replace(/[^a-z0-9äöüß]/gi, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(Buffer.from(pdfResponse.data));
  } catch (err: any) {
    console.error('PDF export error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to export PDF' });
    }
  }
};

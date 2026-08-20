/**
 * Client-Side Document Exporter Suite for Hackord AI Workspace
 * Pure browser-based export for PDF, DOCX, CSV, and Markdown without external server dependency.
 */

import { toast } from 'sonner';
import { formatDateNumeric } from './date-utils';

/**
 * Export raw text content as a Markdown (.md) file
 */
export function exportToMarkdown(content: string, filename: string = 'document.md') {
  try {
    const cleanFilename = filename.endsWith('.md') ? filename : `${filename}.md`;
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    downloadBlob(blob, cleanFilename);
    toast.success(`Exported "${cleanFilename}"`);
  } catch (err) {
    console.error('Markdown export error:', err);
    toast.error('Failed to export Markdown file');
  }
}

/**
 * Export tabular or CSV-formatted data as a clean CSV spreadsheet (.csv)
 */
export function exportToCsv(content: string, filename: string = 'data.csv') {
  try {
    const cleanFilename = filename.endsWith('.csv') ? filename : `${filename}.csv`;
    let csvData = content;

    // If the content is markdown table format (| col1 | col2 |), convert to CSV
    if (content.includes('|')) {
      const lines = content.split('\n');
      const csvLines: string[] = [];
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('|') || trimmed.includes('---')) continue;
        const cells = trimmed
          .split('|')
          .slice(1, -1)
          .map((c) => `"${c.trim().replace(/"/g, '""')}"`);
        if (cells.length > 0) {
          csvLines.push(cells.join(','));
        }
      }
      if (csvLines.length > 0) {
        csvData = csvLines.join('\r\n');
      }
    }

    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    downloadBlob(blob, cleanFilename);
    toast.success(`Exported "${cleanFilename}" spreadsheet`);
  } catch (err) {
    console.error('CSV export error:', err);
    toast.error('Failed to export CSV file');
  }
}

/**
 * Export content as a styled Microsoft Word document (.docx) using clean Word HTML/XML envelope
 */
export function exportToDocx(title: string, markdownOrHtml: string, filename: string = 'document.docx') {
  try {
    const cleanFilename = filename.endsWith('.docx') ? filename : `${filename}.docx`;

    // Convert markdown basics into formatted HTML for Word
    const htmlBody = markdownToFormattedHtml(markdownOrHtml);

    const docContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset="utf-8">
        <title>${escapeXml(title)}</title>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
            <w:DoNotOptimizeForBrowser/>
          </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          body {
            font-family: 'Calibri', 'Segoe UI', Arial, sans-serif;
            font-size: 11pt;
            line-height: 1.5;
            color: #1a1a1a;
            margin: 1in;
          }
          h1 { font-size: 20pt; color: #1e3a8a; border-bottom: 2pt solid #3b82f6; padding-bottom: 4pt; margin-top: 16pt; margin-bottom: 8pt; }
          h2 { font-size: 15pt; color: #1e40af; margin-top: 14pt; margin-bottom: 6pt; }
          h3 { font-size: 13pt; color: #2563eb; margin-top: 12pt; margin-bottom: 4pt; }
          p { margin: 0 0 6pt 0; }
          ul, ol { margin-top: 0; margin-bottom: 8pt; padding-left: 20pt; }
          li { margin-bottom: 3pt; }
          code { font-family: 'Consolas', monospace; background-color: #f1f5f9; padding: 2pt 4pt; font-size: 9.5pt; color: #0f172a; }
          pre { background-color: #f8fafc; border: 1pt solid #cbd5e1; padding: 8pt; font-family: 'Consolas', monospace; font-size: 9.5pt; margin-bottom: 8pt; }
          blockquote { border-left: 3pt solid #3b82f6; margin-left: 0; padding-left: 10pt; color: #475569; font-style: italic; }
          table { border-collapse: collapse; width: 100%; margin-bottom: 10pt; }
          th, td { border: 1pt solid #cbd5e1; padding: 6pt 8pt; text-align: left; font-size: 10pt; }
          th { background-color: #f1f5f9; font-weight: bold; }
          .footer { font-size: 9pt; color: #64748b; margin-top: 24pt; border-top: 1pt solid #e2e8f0; padding-top: 6pt; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 style="color:#2563eb; margin-bottom:2pt;">${escapeXml(title)}</h1>
          <p style="font-size:9pt; color:#64748b; margin-bottom:14pt;">Generated via Hackord AI Workspace • ${formatDateNumeric(new Date())}</p>
        </div>
        ${htmlBody}
        <div class="footer">
          Hackord Virtual Project Room & AI Workspace
        </div>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff' + docContent], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document;charset=utf-8',
    });
    downloadBlob(blob, cleanFilename);
    toast.success(`Exported "${cleanFilename}" (Word Document)`);
  } catch (err) {
    console.error('DOCX export error:', err);
    toast.error('Failed to export DOCX document');
  }
}

/**
 * Export content to a high-quality formatted PDF via browser printing engine
 */
export function exportToPdf(title: string, markdownOrHtml: string) {
  try {
    const htmlBody = markdownToFormattedHtml(markdownOrHtml);
    const printWin = window.open('', '_blank');
    if (!printWin) {
      toast.error('Pop-up blocked. Please allow pop-ups to generate PDF.');
      return;
    }

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${escapeXml(title)} - Hackord PDF Export</title>
          <style>
            @page {
              size: A4;
              margin: 18mm 16mm 18mm 16mm;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              color: #0f172a;
              background: #ffffff;
              line-height: 1.6;
              font-size: 11pt;
              margin: 0;
              padding: 10px;
            }
            .header-bar {
              border-bottom: 2px solid #6366f1;
              padding-bottom: 12px;
              margin-bottom: 20px;
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
            }
            .doc-title {
              font-size: 20pt;
              font-weight: 800;
              color: #1e1b4b;
              margin: 0;
            }
            .doc-meta {
              font-size: 9pt;
              color: #64748b;
            }
            h1 { font-size: 16pt; color: #312e81; margin-top: 18px; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
            h2 { font-size: 13pt; color: #4338ca; margin-top: 14px; margin-bottom: 6px; }
            h3 { font-size: 11.5pt; color: #4f46e5; margin-top: 12px; margin-bottom: 4px; }
            p { margin: 0 0 8px 0; }
            ul, ol { margin: 0 0 10px 0; padding-left: 22px; }
            li { margin-bottom: 4px; }
            strong { color: #0f172a; font-weight: 700; }
            code {
              font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
              background: #f1f5f9;
              color: #0369a1;
              padding: 2px 5px;
              border-radius: 4px;
              font-size: 9.5pt;
            }
            pre {
              background: #0f172a;
              color: #38bdf8;
              padding: 12px;
              border-radius: 8px;
              font-family: monospace;
              font-size: 9pt;
              overflow-x: auto;
              white-space: pre-wrap;
              margin: 10px 0;
            }
            blockquote {
              border-left: 4px solid #6366f1;
              background: #f8fafc;
              margin: 10px 0;
              padding: 8px 12px;
              color: #475569;
              font-style: italic;
            }
            table {
              border-collapse: collapse;
              width: 100%;
              margin: 12px 0;
            }
            th, td {
              border: 1px solid #cbd5e1;
              padding: 6px 10px;
              font-size: 9.5pt;
            }
            th {
              background: #f1f5f9;
              font-weight: bold;
              text-align: left;
            }
            .footer-bar {
              margin-top: 30px;
              padding-top: 10px;
              border-top: 1px solid #e2e8f0;
              font-size: 8.5pt;
              color: #94a3b8;
              display: flex;
              justify-content: space-between;
            }
          </style>
        </head>
        <body>
          <div class="header-bar">
            <div>
              <h1 class="doc-title">${escapeXml(title)}</h1>
              <div class="doc-meta">Generated via Hackord AI Workspace</div>
            </div>
            <div class="doc-meta">${formatDateNumeric(new Date())}</div>
          </div>
          <div class="content">
            ${htmlBody}
          </div>
          <div class="footer-bar">
            <span>Hackord Collaborative Platform</span>
            <span>Page 1</span>
          </div>
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWin.document.close();
    toast.success('Print dialog opened. Select "Save as PDF" to save!');
  } catch (err) {
    console.error('PDF export error:', err);
    toast.error('Failed to export PDF');
  }
}

/**
 * Helper to download Blob to disk
 */
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Escape XML special characters
 */
function escapeXml(unsafe: string): string {
  return (unsafe || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Lightweight Markdown to HTML parser for PDF and Word documents
 */
function markdownToFormattedHtml(md: string): string {
  if (!md) return '';

  const lines = md.split('\n');
  const out: string[] = [];
  let inList = false;
  let inCodeBlock = false;
  let codeBuffer: string[] = [];
  let inTable = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Code blocks
    if (trimmed.startsWith('```')) {
      if (inCodeBlock) {
        out.push(`<pre><code>${escapeXml(codeBuffer.join('\n'))}</code></pre>`);
        codeBuffer = [];
        inCodeBlock = false;
      } else {
        if (inList) {
          out.push('</ul>');
          inList = false;
        }
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      continue;
    }

    // Blank line
    if (!trimmed) {
      if (inList) {
        out.push('</ul>');
        inList = false;
      }
      continue;
    }

    // Headers
    if (trimmed.startsWith('### ')) {
      if (inList) { out.push('</ul>'); inList = false; }
      out.push(`<h3>${formatInline(trimmed.replace(/^###\s+/, ''))}</h3>`);
      continue;
    }
    if (trimmed.startsWith('## ')) {
      if (inList) { out.push('</ul>'); inList = false; }
      out.push(`<h2>${formatInline(trimmed.replace(/^##\s+/, ''))}</h2>`);
      continue;
    }
    if (trimmed.startsWith('# ')) {
      if (inList) { out.push('</ul>'); inList = false; }
      out.push(`<h1>${formatInline(trimmed.replace(/^#\s+/, ''))}</h1>`);
      continue;
    }

    // Blockquote
    if (trimmed.startsWith('>')) {
      if (inList) { out.push('</ul>'); inList = false; }
      out.push(`<blockquote>${formatInline(trimmed.replace(/^>\s*/, ''))}</blockquote>`);
      continue;
    }

    // Unordered list
    if (trimmed.match(/^[-*•]\s+/)) {
      if (!inList) {
        out.push('<ul>');
        inList = true;
      }
      out.push(`<li>${formatInline(trimmed.replace(/^[-*•]\s+/, ''))}</li>`);
      continue;
    }

    // Numbered list
    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (numMatch) {
      if (!inList) {
        out.push('<ol>');
        inList = true;
      }
      out.push(`<li>${formatInline(numMatch[2])}</li>`);
      continue;
    }

    if (inList) {
      out.push('</ul>');
      inList = false;
    }

    // Table row
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      if (trimmed.includes('---')) continue;
      const cells = trimmed.split('|').slice(1, -1).map((c) => c.trim());
      const isHeader = !inTable;
      if (!inTable) {
        out.push('<table>');
        inTable = true;
      }
      const cellTag = isHeader ? 'th' : 'td';
      out.push(`<tr>${cells.map((c) => `<${cellTag}>${formatInline(c)}</${cellTag}>`).join('')}</tr>`);
      continue;
    } else if (inTable) {
      out.push('</table>');
      inTable = false;
    }

    // Regular paragraph
    out.push(`<p>${formatInline(line)}</p>`);
  }

  if (inList) out.push('</ul>');
  if (inTable) out.push('</table>');
  if (inCodeBlock) out.push(`<pre><code>${escapeXml(codeBuffer.join('\n'))}</code></pre>`);

  return out.join('\n');
}

/**
 * Format inline bold, italic, code, links
 */
function formatInline(text: string): string {
  let res = escapeXml(text);
  // Bold **text**
  res = res.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // Italic *text*
  res = res.replace(/\*(.*?)\*/g, '<em>$1</em>');
  // Inline code `code`
  res = res.replace(/`([^`]+)`/g, '<code>$1</code>');
  return res;
}

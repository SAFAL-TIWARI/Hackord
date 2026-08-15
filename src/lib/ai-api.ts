const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export interface AiFileAttachment {
  id?: string;
  name: string;
  size?: number;
  type?: string;
  dataUrl?: string;
  extractedText?: string;
  uploadedAt?: string | Date;
  author_name?: string;
  author_id?: string;
}

export interface AiChatMessage {
  id: string;
  sender: 'user' | 'ai';
  author_name?: string;
  author_avatar?: string;
  author_id?: string;
  text: string;
  timestamp: string;
  date?: string; // YYYY-MM-DD for date headers
  plugin?: string | null;
  fileAttachment?: AiFileAttachment | null;
  structuredData?: any;
  createdAt?: string;
}

export interface AiConversation {
  id: string;
  roomId: string;
  userId: string;
  author_name?: string;
  author_avatar?: string;
  title: string;
  pinned: boolean;
  activePlugin?: string | null;
  messages: AiChatMessage[];
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Fetch all AI conversations for a room from MongoDB (Room-wide visibility)
 */
export async function fetchAiConversations(
  roomId: string,
  _userId?: string
): Promise<AiConversation[]> {
  try {
    const params = new URLSearchParams({ roomId });
    const res = await fetch(`${API_URL}/ai/conversations?${params.toString()}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch AI conversations: ${res.statusText}`);
    }
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error('[ai-api] fetchAiConversations error:', err);
    return [];
  }
}

/**
 * Create a new AI conversation thread in MongoDB
 */
export async function createAiConversation(params: {
  roomId: string;
  userId: string;
  userName?: string;
  userAvatar?: string;
  title?: string;
  activePlugin?: string;
}): Promise<AiConversation> {
  const res = await fetch(`${API_URL}/ai/conversations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to create AI conversation');
  }

  return await res.json();
}

/**
 * Update an existing conversation (rename, pin/unpin, active plugin)
 */
export async function updateAiConversation(
  id: string,
  updates: { title?: string; pinned?: boolean; activePlugin?: string | null }
): Promise<AiConversation> {
  const res = await fetch(`${API_URL}/ai/conversations/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to update AI conversation');
  }

  return await res.json();
}

/**
 * Delete a conversation from MongoDB
 */
export async function deleteAiConversation(id: string): Promise<{ success: boolean; id: string }> {
  const res = await fetch(`${API_URL}/ai/conversations/${id}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to delete AI conversation');
  }

  return await res.json();
}

/**
 * Upload single file (< 5MB) & deduplicate if already in MongoDB
 */
export async function uploadAiFile(params: {
  roomId: string;
  userId: string;
  userName?: string;
  file: File;
}): Promise<{
  id: string;
  name: string;
  type: string;
  size: number;
  dataUrl: string;
  extractedText: string;
  extractedTextPreview: string;
  isDuplicate?: boolean;
}> {
  const { file, roomId, userId, userName } = params;

  // Max 5MB check
  const MAX_BYTES = 5 * 1024 * 1024;
  if (file.size > MAX_BYTES) {
    throw new Error('File size exceeds the 5MB limit. Please upload a smaller file.');
  }

  // Convert to Base64 Data URL
  const base64Data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (e) => reject(e);
    reader.readAsDataURL(file);
  });

  const res = await fetch(`${API_URL}/ai/upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      roomId,
      userId,
      userName,
      filename: file.name,
      mimeType: file.type || 'application/octet-stream',
      fileSize: file.size,
      base64Data,
    }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to upload file');
  }

  const data = await res.json();
  return {
    ...data.file,
    dataUrl: data.file.dataUrl || base64Data,
    isDuplicate: data.isDuplicate || false,
  };
}

/**
 * Helper to open any file in a new tab
 */
export function openFileInNewTab(file: {
  name: string;
  type?: string;
  dataUrl?: string;
  extractedText?: string;
}) {
  try {
    const { name, type, dataUrl, extractedText } = file;

    // 1. If PDF and dataUrl exists, create Blob URL for PDF viewer
    if (type === 'application/pdf' || name.toLowerCase().endsWith('.pdf')) {
      if (dataUrl && dataUrl.startsWith('data:application/pdf;base64,')) {
        const byteCharacters = atob(dataUrl.split(',')[1]);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, '_blank');
        return;
      }
    }

    // 2. If Image, open directly
    if (type?.startsWith('image/') || name.match(/\.(png|jpg|jpeg|webp|gif|svg)$/i)) {
      if (dataUrl) {
        const newWin = window.open('', '_blank');
        if (newWin) {
          newWin.document.write(`
            <!DOCTYPE html>
            <html>
              <head><title>${name}</title><style>body{margin:0;background:#0b0f19;display:flex;align-items:center;justify-content:center;min-height:100vh;}img{max-width:95vw;max-height:95vh;border-radius:8px;box-shadow:0 8px 30px rgba(0,0,0,0.5);}</style></head>
              <body><img src="${dataUrl}" alt="${name}" /></body>
            </html>
          `);
          newWin.document.close();
          return;
        }
      }
    }

    // 3. If Markdown / Code / Text Document:
    const contentToDisplay =
      extractedText ||
      (dataUrl && dataUrl.startsWith('data:') ? atob(dataUrl.split(',')[1] || '') : '');

    const newWin = window.open('', '_blank');
    if (newWin) {
      newWin.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${name} - Hackord File Viewer</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace; background: #0B0F19; color: #F8FAFC; margin: 0; padding: 24px; line-height: 1.6; }
              header { border-bottom: 1px solid #1E293B; padding-bottom: 16px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
              h1 { font-size: 18px; margin: 0; color: #818CF8; }
              pre { background: #060911; padding: 20px; border-radius: 12px; border: 1px solid #1E293B; overflow-x: auto; white-space: pre-wrap; font-size: 13px; color: #67E8F9; }
            </style>
          </head>
          <body>
            <header>
              <h1>📄 ${name}</h1>
              <span style="font-size: 12px; color: #94A3B8;">Hackord AI Workspace</span>
            </header>
            <pre><code>${contentToDisplay.replace(/</g, '&lt;').replace(/>/g, '&gt;') || 'No readable text content.'}</code></pre>
          </body>
        </html>
      `);
      newWin.document.close();
    }
  } catch (err) {
    console.error('Error opening file in new tab:', err);
  }
}

/**
 * Scrape web URL using cheerio on backend for context injection
 */
export async function scrapeWebLink(url: string): Promise<{
  title: string;
  url: string;
  content: string;
}> {
  const res = await fetch(`${API_URL}/ai/scrape-link`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to scrape URL');
  }

  return await res.json();
}

/**
 * Send chat message to Gemini backend with active plugin & file attachment
 */
export async function sendAiChatMessage(params: {
  conversationId?: string;
  roomId: string;
  userId: string;
  userName?: string;
  userAvatar?: string;
  prompt: string;
  pluginTitle?: string | null;
  fileAttachment?: AiFileAttachment | null;
  webUrls?: string[];
}): Promise<{
  conversation: AiConversation;
  userMessage: AiChatMessage;
  aiMessage: AiChatMessage;
  modelUsed?: string;
}> {
  const res = await fetch(`${API_URL}/ai/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to generate AI response');
  }

  return await res.json();
}

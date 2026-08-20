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
 * Check if a file is an audio file
 */
export function isAudioFile(file: { name?: string; type?: string }): boolean {
  const name = (file.name || '').toLowerCase();
  const type = (file.type || '').toLowerCase();
  if (type.startsWith('audio/')) return true;
  if (/\.(mp3|m4a|wav|aac|ogg|flac)$/i.test(name)) return true;
  if (name.endsWith('.webm') && (type.includes('audio') || name.includes('audio') || name.includes('voice'))) return true;
  return false;
}

/**
 * Check if a file is a video file
 */
export function isVideoFile(file: { name?: string; type?: string }): boolean {
  const name = (file.name || '').toLowerCase();
  const type = (file.type || '').toLowerCase();
  if (type.startsWith('video/')) return true;
  if (/\.(mp4|mov|webm|mkv|avi)$/i.test(name) && !isAudioFile(file)) return true;
  return false;
}

/**
 * Check if a file is an image file
 */
export function isImageFile(file: { name?: string; type?: string }): boolean {
  const name = (file.name || '').toLowerCase();
  const type = (file.type || '').toLowerCase();
  return type.startsWith('image/') || /\.(png|jpg|jpeg|webp|gif|svg)$/i.test(name);
}

/**
 * Check if a file is a PDF
 */
export function isPdfFile(file: { name?: string; type?: string }): boolean {
  const name = (file.name || '').toLowerCase();
  const type = (file.type || '').toLowerCase();
  return type === 'application/pdf' || name.endsWith('.pdf');
}

/**
 * Convert base64 data URL to a playable Blob URL
 */
export function createMediaBlobUrl(dataUrl: string, fallbackMime: string): string {
  try {
    if (!dataUrl || !dataUrl.startsWith('data:')) return dataUrl;
    const parts = dataUrl.split(',');
    const mimeMatch = parts[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : fallbackMime;
    const bstr = atob(parts[1] || '');
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    const blob = new Blob([u8arr], { type: mime });
    return URL.createObjectURL(blob);
  } catch (e) {
    console.warn('Failed to convert dataUrl to Blob URL, falling back to original dataUrl', e);
    return dataUrl;
  }
}

/**
 * Fetch a single file from MongoDB by ID (retrieves full dataUrl on demand)
 */
export async function fetchAiFileById(id: string): Promise<AiFileAttachment | null> {
  if (!id) return null;
  try {
    const res = await fetch(`${API_URL}/ai/files/${id}`);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error('[ai-api] fetchAiFileById error:', err);
    return null;
  }
}

/**
 * Helper to open any file in a new tab with specialized rich players for Audio, Video, PDF, Images & Documents
 */
export async function openFileInNewTab(file: {
  id?: string;
  name: string;
  type?: string;
  dataUrl?: string;
  extractedText?: string;
  size?: number;
}) {
  try {
    let activeDataUrl = file.dataUrl || '';
    let activeExtractedText = file.extractedText || '';

    // If dataUrl is missing and file has an ID, fetch on-demand from MongoDB
    if (!activeDataUrl && file.id) {
      const fetched = await fetchAiFileById(file.id);
      if (fetched?.dataUrl) {
        activeDataUrl = fetched.dataUrl;
        if (fetched.extractedText) activeExtractedText = fetched.extractedText;
      }
    }

    const { name, type, size } = file;
    const dataUrl = activeDataUrl;
    const extractedText = activeExtractedText;
    const ext = (name.toLowerCase().split('.').pop() || '').toUpperCase();
    const sizeStr = size ? `${(size / (1024 * 1024)).toFixed(2)} MB` : '';

    // 1. Audio File Player (.mp3, .m4a, .wav, audio/*)
    if (isAudioFile(file)) {
      const mediaUrl = dataUrl ? createMediaBlobUrl(dataUrl, type || 'audio/mpeg') : '';
      const newWin = window.open('', '_blank');
      if (newWin) {
        newWin.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>🎧 ${name} - Hackord Audio Player</title>
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>
                * { box-sizing: border-box; }
                body {
                  margin: 0;
                  background: radial-gradient(circle at 50% 30%, #1e1b4b 0%, #0b0f19 100%);
                  color: #f8fafc;
                  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  justify-content: center;
                  min-height: 100vh;
                  padding: 20px;
                }
                .player-card {
                  background: rgba(15, 23, 42, 0.85);
                  backdrop-filter: blur(20px);
                  border: 1px solid rgba(129, 140, 248, 0.25);
                  box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 35px rgba(99, 102, 241, 0.2);
                  border-radius: 28px;
                  padding: 36px;
                  width: 100%;
                  max-width: 540px;
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  gap: 24px;
                  animation: popIn 0.4s ease-out;
                }
                @keyframes popIn {
                  from { opacity: 0; transform: scale(0.95) translateY(10px); }
                  to { opacity: 1; transform: scale(1) translateY(0); }
                }
                .sound-badge {
                  display: flex;
                  align-items: center;
                  gap: 8px;
                  padding: 6px 14px;
                  border-radius: 9999px;
                  background: rgba(99, 102, 241, 0.15);
                  border: 1px solid rgba(129, 140, 248, 0.35);
                  color: #a5b4fc;
                  font-size: 11px;
                  font-weight: 700;
                  letter-spacing: 0.05em;
                  text-transform: uppercase;
                }
                .wave-bars {
                  display: flex;
                  align-items: center;
                  gap: 4px;
                  height: 36px;
                  margin: 8px 0;
                }
                .bar {
                  width: 4px;
                  background: linear-gradient(to top, #6366f1, #a855f7);
                  border-radius: 4px;
                  animation: wave 1.2s infinite ease-in-out;
                }
                .bar:nth-child(1) { height: 16px; animation-delay: 0.1s; }
                .bar:nth-child(2) { height: 28px; animation-delay: 0.2s; }
                .bar:nth-child(3) { height: 20px; animation-delay: 0.4s; }
                .bar:nth-child(4) { height: 34px; animation-delay: 0.3s; }
                .bar:nth-child(5) { height: 24px; animation-delay: 0.5s; }
                .bar:nth-child(6) { height: 18px; animation-delay: 0.2s; }
                .bar:nth-child(7) { height: 30px; animation-delay: 0.4s; }
                .bar:nth-child(8) { height: 22px; animation-delay: 0.1s; }
                @keyframes wave {
                  0%, 100% { transform: scaleY(0.4); opacity: 0.6; }
                  50% { transform: scaleY(1); opacity: 1; }
                }
                .file-info {
                  text-align: center;
                  max-width: 100%;
                }
                .file-title {
                  font-size: 18px;
                  font-weight: 700;
                  color: #ffffff;
                  margin: 0 0 6px 0;
                  word-break: break-word;
                }
                .file-sub {
                  font-size: 12px;
                  color: #94a3b8;
                  margin: 0;
                }
                audio {
                  width: 100%;
                  border-radius: 14px;
                  outline: none;
                }
                .actions-row {
                  display: flex;
                  gap: 12px;
                  width: 100%;
                }
                .btn {
                  flex: 1;
                  padding: 10px 18px;
                  border-radius: 14px;
                  font-size: 12px;
                  font-weight: 600;
                  text-decoration: none;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  gap: 8px;
                  transition: all 0.2s;
                  cursor: pointer;
                  border: none;
                }
                .btn-primary {
                  background: #4f46e5;
                  color: #ffffff;
                }
                .btn-primary:hover { background: #4338ca; }
                .btn-secondary {
                  background: rgba(255, 255, 255, 0.08);
                  color: #cbd5e1;
                  border: 1px solid rgba(255, 255, 255, 0.15);
                }
                .btn-secondary:hover { background: rgba(255, 255, 255, 0.15); color: #ffffff; }
              </style>
            </head>
            <body>
              <div class="player-card">
                <div class="sound-badge">
                  <span>🎵</span> ${ext || 'AUDIO'} RECORDING
                </div>
                <div class="wave-bars">
                  <div class="bar"></div>
                  <div class="bar"></div>
                  <div class="bar"></div>
                  <div class="bar"></div>
                  <div class="bar"></div>
                  <div class="bar"></div>
                  <div class="bar"></div>
                  <div class="bar"></div>
                </div>
                <div class="file-info">
                  <h1 class="file-title">${name}</h1>
                  <p class="file-sub">${sizeStr ? sizeStr + ' • ' : ''}Hackord AI Multimodal Audio</p>
                </div>
                ${
                  mediaUrl
                    ? `<audio controls autoplay src="${mediaUrl}"></audio>`
                    : `<p style="color:#ef4444; font-size:12px;">Audio stream unavailable.</p>`
                }
                <div class="actions-row">
                  ${
                    mediaUrl
                      ? `<a href="${mediaUrl}" download="${name}" class="btn btn-primary">⬇ Download Audio</a>`
                      : ''
                  }
                  <button onclick="window.close()" class="btn btn-secondary">Close</button>
                </div>
              </div>
            </body>
          </html>
        `);
        newWin.document.close();
        return;
      }
    }

    // 2. Video File Cinema Player (.mp4, .mov, .webm, video/*)
    if (isVideoFile(file)) {
      const mediaUrl = dataUrl ? createMediaBlobUrl(dataUrl, type || 'video/mp4') : '';
      const newWin = window.open('', '_blank');
      if (newWin) {
        newWin.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>🎬 ${name} - Hackord Video Cinema</title>
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>
                * { box-sizing: border-box; }
                body {
                  margin: 0;
                  background: #060911;
                  color: #f8fafc;
                  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                  display: flex;
                  flex-direction: column;
                  min-height: 100vh;
                }
                header {
                  padding: 16px 24px;
                  background: rgba(15, 23, 42, 0.9);
                  backdrop-filter: blur(16px);
                  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                  display: flex;
                  align-items: center;
                  justify-content: space-between;
                  gap: 16px;
                }
                .title-group {
                  display: flex;
                  align-items: center;
                  gap: 12px;
                  overflow: hidden;
                }
                .badge {
                  padding: 4px 10px;
                  border-radius: 8px;
                  background: rgba(6, 182, 212, 0.15);
                  border: 1px solid rgba(6, 182, 212, 0.3);
                  color: #22d3ee;
                  font-size: 11px;
                  font-weight: 700;
                  letter-spacing: 0.05em;
                  white-space: nowrap;
                }
                .header-title {
                  font-size: 15px;
                  font-weight: 600;
                  margin: 0;
                  white-space: nowrap;
                  overflow: hidden;
                  text-overflow: ellipsis;
                }
                .header-actions {
                  display: flex;
                  align-items: center;
                  gap: 10px;
                  shrink: 0;
                }
                .btn {
                  padding: 8px 14px;
                  border-radius: 10px;
                  font-size: 12px;
                  font-weight: 600;
                  text-decoration: none;
                  display: flex;
                  align-items: center;
                  gap: 6px;
                  border: none;
                  cursor: pointer;
                  transition: all 0.2s;
                }
                .btn-primary { background: #0891b2; color: #fff; }
                .btn-primary:hover { background: #0e7490; }
                .btn-ghost { background: rgba(255,255,255,0.08); color: #cbd5e1; }
                .btn-ghost:hover { background: rgba(255,255,255,0.15); color: #fff; }
                .video-container {
                  flex: 1;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  padding: 24px;
                }
                video {
                  max-width: 95vw;
                  max-height: 82vh;
                  border-radius: 16px;
                  box-shadow: 0 20px 50px rgba(0,0,0,0.8), 0 0 40px rgba(6, 182, 212, 0.15);
                  background: #000;
                  outline: none;
                }
              </style>
            </head>
            <body>
              <header>
                <div class="title-group">
                  <span class="badge">▶ ${ext || 'VIDEO'}</span>
                  <h1 class="header-title">${name}</h1>
                  <span style="font-size:12px; color:#64748b;">${sizeStr}</span>
                </div>
                <div class="header-actions">
                  ${
                    mediaUrl
                      ? `<a href="${mediaUrl}" download="${name}" class="btn btn-primary">⬇ Download</a>`
                      : ''
                  }
                  <button onclick="window.close()" class="btn btn-ghost">Close</button>
                </div>
              </header>
              <div class="video-container">
                ${
                  mediaUrl
                    ? `<video controls autoplay playsinline src="${mediaUrl}"></video>`
                    : `<p style="color:#ef4444;">Video source unavailable.</p>`
                }
              </div>
            </body>
          </html>
        `);
        newWin.document.close();
        return;
      }
    }

    // 3. If PDF and dataUrl exists, create Blob URL for native PDF viewer
    if (isPdfFile(file)) {
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

    // 4. If Image, open directly with dark backdrop
    if (isImageFile(file)) {
      if (dataUrl) {
        const newWin = window.open('', '_blank');
        if (newWin) {
          newWin.document.write(`
            <!DOCTYPE html>
            <html>
              <head><title>🖼 ${name}</title><style>body{margin:0;background:#0b0f19;display:flex;align-items:center;justify-content:center;min-height:100vh;}img{max-width:95vw;max-height:95vh;border-radius:8px;box-shadow:0 8px 30px rgba(0,0,0,0.5);}</style></head>
              <body><img src="${dataUrl}" alt="${name}" /></body>
            </html>
          `);
          newWin.document.close();
          return;
        }
      }
    }

    // 5. If Markdown / Code / Text Document:
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

export interface StreamAiChatCallbacks {
  onStart?: (data: { conversationId: string; userMessage: AiChatMessage; aiMessageId: string }) => void;
  onChunk?: (data: { chunk: string; fullText: string; modelUsed?: string }) => void;
  onDone?: (data: {
    conversation: AiConversation;
    userMessage: AiChatMessage;
    aiMessage: AiChatMessage;
    modelUsed?: string;
  }) => void;
  onError?: (err: Error) => void;
}

/**
 * Real-time SSE streaming chat message with token-by-token callback & AbortController support
 */
export async function streamAiChatMessage(
  params: {
    conversationId?: string;
    roomId: string;
    userId: string;
    userName?: string;
    userAvatar?: string;
    prompt: string;
    pluginTitle?: string | null;
    fileAttachment?: AiFileAttachment | null;
    webUrls?: string[];
    editMessageId?: string;
  },
  callbacks: StreamAiChatCallbacks,
  signal?: AbortSignal
): Promise<void> {
  const res = await fetch(`${API_URL}/ai/chat/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
    signal,
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    const error = new Error(errData.error || 'Failed to start AI streaming response');
    callbacks.onError?.(error);
    throw error;
  }

  if (!res.body) {
    const error = new Error('Streaming is not supported on this browser response body');
    callbacks.onError?.(error);
    throw error;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('data:')) {
          const jsonStr = trimmed.slice(5).trim();
          if (!jsonStr) continue;
          try {
            const event = JSON.parse(jsonStr);
            if (event.type === 'start') {
              callbacks.onStart?.(event);
            } else if (event.type === 'chunk') {
              callbacks.onChunk?.({
                chunk: event.text,
                fullText: event.fullText,
                modelUsed: event.modelUsed,
              });
            } else if (event.type === 'done') {
              callbacks.onDone?.(event);
            } else if (event.type === 'error') {
              callbacks.onError?.(new Error(event.error || 'Stream generation failed'));
            }
          } catch (e) {
            // Ignore incomplete JSON chunks in stream
          }
        }
      }
    }
  } catch (err: any) {
    if (signal?.aborted || err.name === 'AbortError') {
      return;
    }
    callbacks.onError?.(err);
    throw err;
  }
}

/**
 * Edit an existing message in an AI conversation
 */
export async function updateAiMessage(
  conversationId: string,
  messageId: string,
  text: string
): Promise<{ success: boolean; conversation: AiConversation; message: AiChatMessage }> {
  const res = await fetch(`${API_URL}/ai/conversations/${conversationId}/messages/${messageId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to update message');
  }

  return await res.json();
}


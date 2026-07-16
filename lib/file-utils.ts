export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

export function getMimeType(filename: string): string {
  const ext = getFileExtension(filename);
  switch (ext) {
    case 'pdf':
      return 'application/pdf';
    case 'png':
      return 'image/png';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'doc':
      return 'application/msword';
    case 'docx':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    case 'xls':
      return 'application/vnd.ms-excel';
    case 'xlsx':
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    default:
      return 'application/octet-stream';
  }
}

export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function isPdf(filename: string): boolean {
  return getFileExtension(filename) === 'pdf';
}

export function cleanFileName(filename: string): string {
  let decoded = filename;
  try {
    decoded = decodeURIComponent(filename);
  } catch (e) {
    // Fallback if decoding fails
  }

  // Separate base name and extension
  const extIdx = decoded.lastIndexOf('.');
  let baseName = extIdx !== -1 ? decoded.substring(0, extIdx) : decoded;
  const ext = extIdx !== -1 ? decoded.substring(extIdx) : '';

  // 1. Replace all non-alphanumeric and non-hyphen characters with underscores
  let sanitizedBase = baseName.replace(/[^a-zA-Z0-9-]/g, '_');

  // 2. Collapse sequences of underscores and hyphens (e.g. "___" -> "_", "_-_" -> "-")
  sanitizedBase = sanitizedBase.replace(/[_-]+/g, (match) => {
    return match.includes('-') ? '-' : '_';
  });

  // 3. Trim leading/trailing underscores and hyphens
  sanitizedBase = sanitizedBase.replace(/^[-_]+|[-_]+$/g, '');

  // Fallback to 'document' if the base name becomes completely empty
  if (!sanitizedBase) {
    sanitizedBase = 'document';
  }

  return `${sanitizedBase}${ext}`;
}



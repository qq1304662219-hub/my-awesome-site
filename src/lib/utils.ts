import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getStoragePathFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    // Pattern: /storage/v1/object/public/[bucket]/[path]
    // or /storage/v1/object/sign/[bucket]/[path]
    const pathParts = urlObj.pathname.split('/');
    // Find 'public' or 'sign' and 'uploads' (bucket name)
    // This is a heuristic. Adjust based on actual URL structure.
    // Example: /storage/v1/object/public/uploads/user/file.mp4
    const bucketIndex = pathParts.findIndex(p => p === 'uploads'); // Assuming bucket is 'uploads'
    if (bucketIndex !== -1 && bucketIndex < pathParts.length - 1) {
      return pathParts.slice(bucketIndex + 1).join('/');
    }
    return null;
  } catch (e) {
    return null;
  }
}

export function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

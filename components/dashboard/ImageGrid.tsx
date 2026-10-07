'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type ImageItem = {
  id: string
  slug: string
  fileName: string
  fileSizeMb: number | null
  mimeType: string | null
  createdAt: string
  telegramMsgId: string | null
}

export default function ImageGrid({ images }: { images: ImageItem[] }) {
  const router = useRouter()
  const [deleting, setDeleting] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  async function handleDelete(slug: string) {
    if (!confirm('Delete this image?')) return
    setDeleting(slug)
    await fetch(`/api/images/${slug}`, { method: 'DELETE' })
    setDeleting(null)
    router.refresh()
  }

  async function handleCopy(slug: string) {
    const url = `${window.location.origin}/i/${slug}`
    await navigator.clipboard.writeText(url)
    setCopied(slug)
    setTimeout(() => setCopied(null), 2000)
  }

  if (images.length === 0) {
    return (
      <div className="text-center py-16 bg-[#111] border border-white/[0.06] rounded-xl text-[#666]">
        <p className="text-4xl mb-3">🖼️</p>
        <p className="font-medium text-white text-sm">No images uploaded yet</p>
        <p className="text-xs mt-1 text-[#555]">Upload an image above to get a custom URL</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {images.map((img) => {
        const fullUrl = typeof window !== 'undefined' ? `${window.location.origin}/i/${img.slug}` : `/i/${img.slug}`

        return (
          <div
            key={img.id}
            className="group relative bg-[#111] border border-white/[0.08] rounded-xl overflow-hidden flex flex-col hover:border-white/20 transition-all"
          >
            <div className="relative aspect-square bg-[#0a0a0a] overflow-hidden">
              <img
                src={`/i/${img.slug}`}
                alt={img.fileName}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  // Fallback in case image fails to load
                  (e.target as HTMLElement).style.display = 'none'
                }}
              />

              {/* Hover overlay with action buttons */}
              <div className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2.5">
                <p className="text-white text-[11px] font-medium truncate w-full text-center">
                  {img.fileName}
                </p>
                <div className="space-y-1 w-full">
                  <button
                    onClick={() => handleCopy(img.slug)}
                    className="w-full bg-white text-black text-[11px] py-1 rounded-md font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-1"
                  >
                    {copied === img.slug ? 'Copied! ✨' : 'Copy View Link 📋'}
                  </button>
                  <a
                    href={`/i/${img.slug}?download=true`}
                    download
                    className="w-full bg-green-600 text-white text-[11px] py-1 rounded-md font-medium hover:bg-green-500 transition-colors flex items-center justify-center gap-1"
                  >
                    Download ⬇️
                  </a>
                  <a
                    href={`/i/${img.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-blue-600 text-white text-[11px] py-1 rounded-md font-medium hover:bg-blue-500 transition-colors flex items-center justify-center gap-1"
                  >
                    Open Image ↗
                  </a>
                  <button
                    onClick={() => handleDelete(img.slug)}
                    disabled={deleting === img.slug}
                    className="w-full bg-red-500/20 text-red-300 border border-red-500/30 text-[11px] py-1 rounded-md font-medium hover:bg-red-500 hover:text-white transition-colors disabled:opacity-50"
                  >
                    {deleting === img.slug ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>

            {/* Always visible footer under image */}
            <div className="p-2.5 border-t border-white/[0.06] bg-[#0d0d0d] space-y-1">
              <p className="text-xs text-[#ccc] truncate font-medium">{img.fileName}</p>
              <div className="flex items-center justify-between text-[10px] text-[#666]">
                <span>{img.fileSizeMb ? `${img.fileSizeMb} MB` : 'Image'}</span>
                <button
                  onClick={() => handleCopy(img.slug)}
                  className="text-blue-400 hover:text-blue-300 transition-colors font-mono"
                >
                  {copied === img.slug ? 'Copied' : `/i/${img.slug}`}
                </button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
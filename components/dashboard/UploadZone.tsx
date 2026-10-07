'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { useRouter } from 'next/navigation'

type UploadState = {
  name: string
  progress: string
  status: 'uploading' | 'done' | 'error'
  url?: string
  error?: string
  copied?: boolean
}

export default function UploadZone() {
  const [uploads, setUploads] = useState<UploadState[]>([])
  const router = useRouter()

  function updateUpload(name: string, patch: Partial<UploadState>) {
    setUploads((prev) =>
      prev.map((u) => (u.name === name ? { ...u, ...patch } : u))
    )
  }

  async function uploadFile(file: File) {
    if (!file.type.startsWith('image/')) {
      setUploads((prev) => [
        { name: file.name, progress: '', status: 'error', error: 'Only images allowed' },
        ...prev,
      ])
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploads((prev) => [
        { name: file.name, progress: '', status: 'error', error: 'Max 10MB' },
        ...prev,
      ])
      return
    }

    setUploads((prev) => [
      { name: file.name, progress: 'Uploading to Telegram...', status: 'uploading' },
      ...prev,
    ])

    try {
      const form = new FormData()
      form.append('image', file)

      const res = await fetch('/api/v1/upload-dashboard', {
        method: 'POST',
        body: form,
      })

      const data = await res.json()

      if (res.ok) {
        updateUpload(file.name, {
          status: 'done',
          progress: 'Uploaded!',
          url: data.url,
        })
        router.refresh()
      } else {
        updateUpload(file.name, {
          status: 'error',
          error: data.error || 'Upload failed. Check Telegram Bot settings.',
        })
      }
    } catch (err: any) {
      updateUpload(file.name, {
        status: 'error',
        error: err.message || 'Upload failed',
      })
    }
  }

  const handleCopy = async (name: string, url: string) => {
    await navigator.clipboard.writeText(url)
    updateUpload(name, { copied: true })
    setTimeout(() => updateUpload(name, { copied: false }), 2000)
  }

  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    for (const file of acceptedFiles) {
      await uploadFile(file)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxSize: 10 * 1024 * 1024,
  })

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
          ${isDragActive ? 'border-blue-500 bg-blue-500/10' : 'border-white/10 hover:border-white/30 bg-[#111]'}`}
      >
        <input {...getInputProps()} />
        <p className="text-3xl mb-2">🖼️</p>
        {isDragActive ? (
          <p className="text-blue-400 font-medium text-sm">Drop images here...</p>
        ) : (
          <>
            <p className="text-white font-medium text-sm">Drag & drop images here</p>
            <p className="text-[#666] text-xs mt-1">or click to browse — JPG, PNG, GIF, WebP up to 10MB</p>
          </>
        )}
      </div>

      {uploads.length > 0 && (
        <div className="space-y-2">
          {uploads.map((u, i) => (
            <div key={i} className="bg-[#111] border border-white/10 rounded-xl px-4 py-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 overflow-hidden">
                  <span className="text-sm">
                    {u.status === 'done' ? '✅' : u.status === 'error' ? '❌' : '⏳'}
                  </span>
                  <p className="text-xs font-medium text-white truncate max-w-xs">{u.name}</p>
                </div>
                <span className="text-xs text-[#888]">{u.progress}</span>
              </div>

              {u.error && <p className="text-xs text-red-400">{u.error}</p>}

              {u.url && (
                <div className="flex flex-col gap-2 bg-[#0a0a0a] border border-white/10 rounded-lg p-2.5 mt-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={u.url}
                      className="flex-1 bg-transparent text-xs font-mono text-blue-400 outline-none truncate"
                    />
                    <button
                      onClick={() => handleCopy(u.name, u.url!)}
                      className="bg-white/10 hover:bg-white/20 text-white text-xs px-2.5 py-1 rounded transition-colors font-medium shrink-0"
                    >
                      {u.copied ? 'Copied! ✨' : 'Copy View URL 📋'}
                    </button>
                    <a
                      href={u.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-2.5 py-1 rounded transition-colors font-medium shrink-0"
                    >
                      View ↗
                    </a>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <span className="text-[11px] text-[#777]">Direct Download:</span>
                    <a
                      href={`${u.url}?download=true`}
                      download
                      className="bg-green-600 hover:bg-green-500 text-white text-xs px-3 py-1 rounded transition-colors font-medium shrink-0 flex items-center gap-1"
                    >
                      Download Image ⬇️
                    </a>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
import { adminDb } from '@/lib/firebase-admin'
import { getImageUrl } from '@/lib/telegram'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const { searchParams } = new URL(req.url)
    const isDownload = searchParams.get('download') === 'true'

    const imagesSnap = await adminDb.collection("images").where("slug", "==", slug).limit(1).get()

    if (imagesSnap.empty) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 })
    }

    const image = imagesSnap.docs[0].data() as any

    // Get fresh download URL from Telegram
    const telegramUrl = await getImageUrl(image.telegramFileId)

    // Fetch from Telegram and stream back
    const res = await fetch(telegramUrl)
    if (!res.ok) {
      console.error('Failed to fetch image from Telegram:', await res.text())
      return NextResponse.json({ error: 'Failed to fetch image from Telegram' }, { status: 502 })
    }

    const buffer = await res.arrayBuffer()
    const dispositionType = isDownload ? 'attachment' : 'inline'

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': image.mimeType || 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Disposition': `${dispositionType}; filename="${image.fileName}"`,
      },
    })
  } catch (error: any) {
    console.error('Error serving image:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

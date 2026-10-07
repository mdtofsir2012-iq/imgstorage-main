import { adminDb } from '@/lib/firebase-admin'
import { uploadImageToTelegram } from '@/lib/telegram'
import { NextRequest, NextResponse } from 'next/server'
import { nanoid } from 'nanoid'
import { corsHeaders, handleOptions } from './cors'
import { FieldValue } from 'firebase-admin/firestore'

export async function OPTIONS() {
  return handleOptions()
}

export const dynamic = 'force-dynamic'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const MAX_SIZE = 4 * 1024 * 1024 // 4MB

export async function POST(req: NextRequest) {
  try {
    const apiKey = req.headers.get('x-api-key')
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing x-api-key header' }, { status: 401, headers: corsHeaders() })
    }

    const keysSnap = await adminDb.collection("apiKeys").where("key", "==", apiKey).limit(1).get()
    if (keysSnap.empty) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401, headers: corsHeaders() })
    }

    const keyDoc = keysSnap.docs[0]
    const keyRecord = { id: keyDoc.id, ...(keyDoc.data() as any) }

    const formData = await req.formData()
    const image = formData.get('image') as File

    if (!image) {
      return NextResponse.json({ error: 'No image provided. Send image as multipart/form-data with key "image"' }, { status: 400, headers: corsHeaders() })
    }

    if (!ALLOWED_TYPES.includes(image.type)) {
      return NextResponse.json({
        error: `Invalid file type. Allowed: ${ALLOWED_TYPES.join(', ')}`
      }, { status: 400, headers: corsHeaders() })
    }

    if (image.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File too large. Max 4MB.' }, { status: 400, headers: corsHeaders() })
    }

    const { file_id, message_id } = await uploadImageToTelegram(image)
    const slug = nanoid(12)
    const createdAt = new Date()

    const imageRef = adminDb.collection("images").doc()
    const imageData = {
      id: imageRef.id,
      userId: keyRecord.userId,
      apiKeyId: keyRecord.id,
      telegramFileId: file_id,
      telegramMsgId: String(message_id),
      slug,
      fileName: image.name,
      fileSizeMb: parseFloat((image.size / 1024 / 1024).toFixed(2)),
      mimeType: image.type,
      createdAt,
    }

    await imageRef.set(imageData)

    try {
      await keyDoc.ref.update({
        usageCount: FieldValue.increment(1)
      })
    } catch (e) {
      console.error('Failed to update usage count:', e)
    }

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'

    return NextResponse.json({
      success: true,
      id: slug,
      url: `${baseUrl}/i/${slug}`,
      fileName: image.name,
      size: image.size,
      type: image.type,
      uploadedAt: createdAt,
    }, { headers: corsHeaders() })
  } catch (error: any) {
    console.error('API Upload error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error during upload' },
      { status: 500, headers: corsHeaders() }
    )
  }
}

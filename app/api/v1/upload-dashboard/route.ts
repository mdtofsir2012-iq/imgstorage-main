import { adminDb } from '@/lib/firebase-admin'
import { uploadImageToTelegram } from '@/lib/telegram'
import { NextRequest, NextResponse } from 'next/server'
import { nanoid } from 'nanoid'
import { FieldValue } from 'firebase-admin/firestore'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const userId = 'admin'

  const keysSnap = await adminDb.collection("apiKeys").where("userId", "==", userId).limit(1).get()
  let apiKeyId = ''
  let keyDocRef = null

  if (keysSnap.empty) {
    const newKeyRef = adminDb.collection("apiKeys").doc()
    await newKeyRef.set({
      id: newKeyRef.id,
      userId,
      key: `img_${nanoid(24)}`,
      name: 'Default Key',
      usageCount: 0,
      createdAt: new Date(),
    })
    apiKeyId = newKeyRef.id
    keyDocRef = newKeyRef
  } else {
    apiKeyId = keysSnap.docs[0].id
    keyDocRef = keysSnap.docs[0].ref
  }

  const formData = await req.formData()
  const image = formData.get('image') as File

  if (!image) return NextResponse.json({ error: 'No image' }, { status: 400 })
  if (!image.type.startsWith('image/')) return NextResponse.json({ error: 'Only images allowed' }, { status: 400 })
  if (image.size > 4 * 1024 * 1024) return NextResponse.json({ error: 'Max 4MB' }, { status: 400 })

  const { file_id, message_id } = await uploadImageToTelegram(image)
  const slug = nanoid(12)
  const createdAt = new Date()

  const imageRef = adminDb.collection("images").doc()
  const imageData = {
    id: imageRef.id,
    userId,
    apiKeyId,
    telegramFileId: file_id,
    telegramMsgId: String(message_id),
    slug,
    fileName: image.name,
    fileSizeMb: parseFloat((image.size / 1024 / 1024).toFixed(2)),
    mimeType: image.type,
    createdAt,
  }

  await imageRef.set(imageData)

  if (keyDocRef) {
    await keyDocRef.update({
      usageCount: FieldValue.increment(1)
    })
  }

  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'

  return NextResponse.json({
    success: true,
    url: `${baseUrl}/i/${slug}`,
    id: slug,
  })
}

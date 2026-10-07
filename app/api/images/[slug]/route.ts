import { adminDb } from '@/lib/firebase-admin'
import { deleteImageFromTelegram } from '@/lib/telegram'
import { NextRequest, NextResponse } from 'next/server'

export async function DELETE(
  req: NextRequest,
 { params }: { params: Promise<{ slug: string }> }  
) {
  const param = (await params).slug
  const userId = 'admin'

  const imagesSnap = await adminDb.collection("images").where("slug", "==", param).where("userId", "==", userId).limit(1).get()
  if (imagesSnap.empty) return NextResponse.json({ error: 'Image not found' }, { status: 404 })

  const imageDoc = imagesSnap.docs[0]
  const image = imageDoc.data() as any

  if (image.telegramMsgId) {
    await deleteImageFromTelegram(Number(image.telegramMsgId))
  }

  await imageDoc.ref.delete()

  return NextResponse.json({ success: true })
}

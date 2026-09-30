import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { deleteImageFromTelegram } from '@/lib/telegram'
import { NextRequest, NextResponse } from 'next/server'

export async function DELETE(
  req: NextRequest,
 { params }: { params: Promise<{ slug: string }> }  
) {
  const param = (await params).slug
  let user
  try {
    user = await getCurrentUser()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const image = await prisma.image.findFirst({
    where: { slug: param, userId: user.id },
  })

  if (!image) return NextResponse.json({ error: 'Image not found' }, { status: 404 })

  if (image.telegramMsgId) {
    await deleteImageFromTelegram(Number(image.telegramMsgId))
  }

  await prisma.image.delete({ where: { id: image.id } })

  return NextResponse.json({ success: true })
}
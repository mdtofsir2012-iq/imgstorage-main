import { getCurrentUser } from '@/lib/auth'
import { generateApiKey } from '@/lib/generate-key'
import { prisma } from '@/lib/prisma'
import { uploadImageToTelegram } from '@/lib/telegram'
import { NextRequest, NextResponse } from 'next/server'
import { nanoid } from 'nanoid'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  let user
  try {
    user = await getCurrentUser()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let apiKey = await prisma.apiKey.findFirst({ where: { userId: user.id }, orderBy: { createdAt: 'asc' } })
  if (!apiKey) {
    apiKey = await prisma.apiKey.create({
      data: { userId: user.id, key: generateApiKey(), name: 'Default Key' },
    })
  }

  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const formData = await req.formData()
  const image = formData.get('image') as File

  if (!image) return NextResponse.json({ error: 'No image' }, { status: 400 })
  if (!image.type.startsWith('image/')) return NextResponse.json({ error: 'Only images allowed' }, { status: 400 })
  if (image.size > 4 * 1024 * 1024) return NextResponse.json({ error: 'Max 4MB' }, { status: 400 })

  const { file_id, message_id } = await uploadImageToTelegram(image)
  const slug = nanoid(12)

  const saved = await prisma.image.create({
    data: {
      userId: user.id,
      apiKeyId: apiKey.id,
      telegramFileId: file_id,
      telegramMsgId: String(message_id),
      slug,
      fileName: image.name,
      fileSizeMb: parseFloat((image.size / 1024 / 1024).toFixed(2)),
      mimeType: image.type,
    },
  })

  await prisma.apiKey.update({
    where: { id: user.apiKeys[0].id },
    data: { usageCount: { increment: 1 } },
  })

  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'

  return NextResponse.json({
    success: true,
    url: `${baseUrl}/i/${slug}`,
    id: slug,
  })
}
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateApiKey } from '@/lib/generate-key'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const user = await getCurrentUser()
    const keys = await prisma.apiKey.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } })
    return NextResponse.json(keys)
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    const { name } = await req.json()
    const apiKey = await prisma.apiKey.create({
      data: { userId: user.id, key: generateApiKey(), name: name || 'New Key' },
    })
    return NextResponse.json(apiKey)
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

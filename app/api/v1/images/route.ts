import { adminDb } from '@/lib/firebase-admin'
import { NextRequest, NextResponse } from 'next/server'
import { corsHeaders, handleOptions } from '../upload/cors'

export async function OPTIONS() {
  return handleOptions()
}

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const apiKey = req.headers.get('x-api-key')
  if (!apiKey) return NextResponse.json({ error: 'Missing x-api-key' }, { status: 401, headers: corsHeaders() })

  const keysSnap = await adminDb.collection("apiKeys").where("key", "==", apiKey).limit(1).get()
  if (keysSnap.empty) return NextResponse.json({ error: 'Invalid API key' }, { status: 401, headers: corsHeaders() })

  const keyDoc = keysSnap.docs[0]
  const apiKeyId = keyDoc.id

  const imagesSnap = await adminDb.collection("images").where("apiKeyId", "==", apiKeyId).orderBy("createdAt", "desc").get()
  const images = imagesSnap.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }))

  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'

  return NextResponse.json({
    success: true,  
    count: images.length,
    images: images.map((img: any)=> ({
      id: img.slug,
      url: `${baseUrl}/i/${img.slug}`,
      fileName: img.fileName,
      size: img.fileSizeMb,
      type: img.mimeType,
      uploadedAt: img.createdAt,
    })),
  }, { headers: corsHeaders() })
}

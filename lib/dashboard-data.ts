import { adminDb } from '@/lib/firebase-admin'

export const getDashboardData = async (userId: string) => {
  const userDoc = await adminDb.collection("users").doc(userId).get()
  const userData = userDoc.exists ? { id: userDoc.id, ...(userDoc.data() as any) } : null

  const keysSnap = await adminDb.collection("apiKeys").where("userId", "==", userId).orderBy("createdAt", "desc").get()
  const apiKeys = keysSnap.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }))

  const imagesSnap = await adminDb.collection("images").where("userId", "==", userId).orderBy("createdAt", "desc").get()
  const images = imagesSnap.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }))

  let totalSizeMb = 0
  images.forEach((img: any) => {
    if (typeof img.fileSizeMb === 'number') {
      totalSizeMb += img.fileSizeMb
    }
  })

  const user = userData ? {
    ...userData,
    apiKeys,
    images: images.slice(0, 8),
    _count: { images: images.length }
  } : null

  return { user, _sum: { fileSizeMb: totalSizeMb } }
}

export const getApiKeysData = async (userId: string) => {
  const keysSnap = await adminDb.collection("apiKeys").where("userId", "==", userId).orderBy("createdAt", "desc").get()
  return keysSnap.docs.map(doc => {
    const data = doc.data() as any
    return {
      id: doc.id,
      key: data.key,
      name: data.name,
      usageCount: data.usageCount,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toString() : String(data.createdAt),
    }
  })
}

export const getImagesData = async (userId: string) => {
  const imagesSnap = await adminDb.collection("images").where("userId", "==", userId).orderBy("createdAt", "desc").get()
  return imagesSnap.docs.map(doc => {
    const img = doc.data() as any
    return {
      id: doc.id,
      slug: img.slug,
      fileName: img.fileName,
      fileSizeMb: img.fileSizeMb,
      mimeType: img.mimeType,
      createdAt: img.createdAt?.toDate ? img.createdAt.toDate().toString() : String(img.createdAt),
      telegramMsgId: img.telegramMsgId != null ? String(img.telegramMsgId) : null,
    }
  })
}

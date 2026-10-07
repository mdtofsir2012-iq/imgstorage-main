import { adminDb } from '@/lib/firebase-admin'

async function getTelegramConfig() {
  try {
    const doc = await adminDb.collection('settings').doc('telegram').get()
    if (doc.exists) {
      const data = doc.data()
      if (data?.botToken && data?.channelId) {
        return {
          botToken: data.botToken,
          channelId: data.channelId,
        }
      }
    }
  } catch (e) {
    // fallback
  }

  return {
    botToken: process.env.TELEGRAM_BOT_TOKEN || '',
    channelId: process.env.TELEGRAM_CHANNEL_ID || process.env.TELEGRAM_MASTER_CHANNEL_ID || '',
  }
}

export async function uploadImageToTelegram(
  file: File
): Promise<{ file_id: string; message_id: number }> {
  const { botToken, channelId } = await getTelegramConfig()
  if (!botToken || !channelId) {
    throw new Error('Telegram Bot Token or Channel ID is not configured. Please set them in Dashboard -> Telegram ID.')
  }

  const BASE = `https://api.telegram.org/bot${botToken}`
  const form = new FormData()
  form.append('chat_id', channelId)
  form.append('document', file, file.name)

  const res = await fetch(`${BASE}/sendDocument`, {
    method: 'POST',
    body: form,
  })

  const data = await res.json()
  if (!data.ok) throw new Error(`Telegram error: ${data.description}`)

  return {
    file_id: data.result.document.file_id,
    message_id: data.result.message_id,
  }
}

export async function getImageUrl(fileId: string): Promise<string> {
  const { botToken } = await getTelegramConfig()
  if (!botToken) throw new Error('Telegram Bot Token is not configured.')

  const BASE = `https://api.telegram.org/bot${botToken}`
  const res = await fetch(`${BASE}/getFile?file_id=${fileId}`)
  const data = await res.json()
  if (!data.ok) throw new Error(`Telegram error: ${data.description}`)
  return `https://api.telegram.org/file/bot${botToken}/${data.result.file_path}`
}

export async function deleteImageFromTelegram(messageId: number): Promise<void> {
  const { botToken, channelId } = await getTelegramConfig()
  if (!botToken || !channelId) return

  const BASE = `https://api.telegram.org/bot${botToken}`
  await fetch(`${BASE}/deleteMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: channelId,
      message_id: messageId,
    }),
  })
}

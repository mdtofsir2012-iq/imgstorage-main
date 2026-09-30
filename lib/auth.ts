import crypto from 'crypto'
import { cookies } from 'next/headers'
import { AUTH_COOKIE_NAME, AUTH_COOKIE_VALUE } from '@/lib/auth-constants'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'

export const OWNER_EMAIL = 'mdtofsir2004@gmail.com'
export const OWNER_NAME = 'ImgStorage Owner'
const OWNER_PASSWORD_SHA256 = '9260f889a03c3de5a806b802afdcca308513328a90c44988955d8dc13dd93504'
export function passwordMatches(password: string) {
  return crypto.createHash('sha256').update(password).digest('hex') === OWNER_PASSWORD_SHA256
}

export async function isAuthenticated() {
  const cookieStore = await cookies()
  return cookieStore.get(AUTH_COOKIE_NAME)?.value === AUTH_COOKIE_VALUE
}

export async function getCurrentUser() {
  if (!(await isAuthenticated())) redirect('/login')

  let user = await prisma.user.findFirst({
    where: { OR: [{ email: OWNER_EMAIL }, { username: 'tofsir' }] },
    select: { id: true, name: true, email: true, image: true, username: true },
  })

  if (!user) {
    user = await prisma.user.create({
      data: { email: OWNER_EMAIL, name: OWNER_NAME, username: 'tofsir' },
      select: { id: true, name: true, email: true, image: true, username: true },
    })
  } else if (user.email !== OWNER_EMAIL || user.name !== OWNER_NAME) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { email: OWNER_EMAIL, name: OWNER_NAME },
      select: { id: true, name: true, email: true, image: true, username: true },
    })
  }

  return user
}

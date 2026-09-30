import crypto from "crypto";
import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { generateApiKey } from "@/lib/generate-key";

const OWNER_EMAIL = "owner@imgstorage.local";
const OWNER_NAME = "ImgStorage Owner";

function passwordMatches(input: string, configured: string) {
  const inputHash = crypto.createHash("sha256").update(input).digest();
  const configuredHash = crypto.createHash("sha256").update(configured).digest();

  return crypto.timingSafeEqual(inputHash, configuredHash);
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Password",
      credentials: {
        password: {
          label: "Password",
          type: "password",
        },
      },

      async authorize(credentials) {
        const configuredPassword = process.env.IMGSTORAGE_LOGIN_PASSWORD;

        if (!configuredPassword || !credentials?.password) {
          return null;
        }

        if (!passwordMatches(credentials.password, configuredPassword)) {
          return null;
        }

        let user = await prisma.user.findUnique({
          where: { email: OWNER_EMAIL },
        });

        if (!user) {
          user = await prisma.user.create({
            data: {
              email: OWNER_EMAIL,
              name: OWNER_NAME,
              username: "tofsir",
              apiKeys: {
                create: {
                  key: generateApiKey(),
                  name: "Default Key",
                },
              },
            },
          });
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          username: user.username,
        };
      },
    }),
  ],

  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET || "",

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.username = user.username;
      }

      if (token.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email },
          select: {
            id: true,
            username: true,
          },
        });

        if (dbUser) {
          token.id = dbUser.id;
          token.username = dbUser.username;
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.username = token.username as string | null | undefined;
      }

      if (session.user?.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: session.user.email },
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            username: true,
          },
        });

        if (dbUser) {
          session.user.id = dbUser.id;
          session.user.name = dbUser.name;
          session.user.email = dbUser.email;
          session.user.image = dbUser.image;
          session.user.username = dbUser.username;
        }
      }

      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };

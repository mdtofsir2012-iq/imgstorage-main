import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { firebaseAdminAuth } from "@/lib/firebase-admin";
import { generateApiKey } from "@/lib/generate-key";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Firebase Google",
      credentials: {
        idToken: {
          label: "Firebase ID Token",
          type: "text",
        },
      },

      async authorize(credentials) {
        if (!credentials?.idToken) return null;

        try {
          const decodedToken = await firebaseAdminAuth.verifyIdToken(
            credentials.idToken
          );

          if (!decodedToken.email) return null;

          const email = decodedToken.email;
          const name = decodedToken.name ?? null;
          const image = decodedToken.picture ?? null;

          let user = await prisma.user.findUnique({
            where: { email },
          });

          if (!user) {
            const base = email
              .split("@")[0]
              .replace(/[^a-z0-9]/gi, "")
              .toLowerCase();

            const suffix = Math.random().toString(36).slice(2, 6);

            user = await prisma.user.create({
              data: {
                email,
                name,
                image,
                username: `${base}_${suffix}`,
                apiKeys: {
                  create: {
                    key: generateApiKey(),
                    name: "Default Key",
                  },
                },
              },
            });
          } else {
            user = await prisma.user.update({
              where: { id: user.id },
              data: {
                name,
                image,
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
        } catch (error) {
          console.error("Firebase authentication failed:", error);
          return null;
        }
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

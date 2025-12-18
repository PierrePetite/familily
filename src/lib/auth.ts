import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email und Passwort erforderlich');
        }

        const member = await prisma.familyMember.findUnique({
          where: { email: credentials.email },
          include: { family: true },
        });

        if (!member || !member.password) {
          throw new Error('Ungültige Anmeldedaten');
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          member.password
        );

        if (!isPasswordValid) {
          throw new Error('Ungültige Anmeldedaten');
        }

        return {
          id: member.id,
          email: member.email,
          name: member.name,
          role: member.role,
          familyId: member.familyId,
          familyName: member.family.name,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 Tage
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.familyId = user.familyId;
        token.familyName = user.familyName;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.memberId = token.id as string; // Alias for id
        session.user.role = token.role as string;
        session.user.familyId = token.familyId as string;
        session.user.familyName = token.familyName as string;
      }
      return session;
    },
  },
};

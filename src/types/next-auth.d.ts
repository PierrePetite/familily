/* eslint-disable @typescript-eslint/no-unused-vars */
import { DefaultSession, DefaultUser } from 'next-auth';
import { DefaultJWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      memberId: string;
      role: string;
      familyId: string;
      familyName: string;
    } & DefaultSession['user'];
  }

  interface User extends DefaultUser {
    role: string;
    familyId: string;
    familyName: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id: string;
    role: string;
    familyId: string;
    familyName: string;
  }
}

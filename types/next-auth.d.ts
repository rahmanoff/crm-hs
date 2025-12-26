import { DefaultSession, DefaultUser } from 'next-auth';
import { JWT as DefaultJWT } from 'next-auth/jwt';
import { AdapterUser as DefaultAdapterUser } from '@auth/core/adapters';

declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: DefaultSession['user'] & {
      id: string;
      roles: string[];
      permissions: string[];
    };
  }

  interface User extends DefaultUser {
    id: string;
    roles: string[];
    permissions: string[];
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    roles: string[];
    permissions: string[];
  }
}

declare module '@auth/core/adapters' {
  interface AdapterUser extends DefaultAdapterUser {
    roles: string[];
    permissions: string[];
  }
}

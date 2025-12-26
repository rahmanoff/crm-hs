import type { Adapter } from 'next-auth/adapters';
import {
  PrismaClient,
  Account as PrismaAccount,
  AccountType,
} from '@prisma/client';
import type {
  AdapterUser as NextAuthAdapterUser,
  AdapterAccount,
  AdapterSession,
  VerificationToken,
} from 'next-auth/adapters';

// Custom AdapterUser type that includes our roles and permissions
// This should align with the augmented types in types/next-auth.d.ts
interface CustomAdapterUser extends NextAuthAdapterUser {
  roles: string[];
  permissions: string[];
}

// Helper function to map Prisma Account to NextAuth AdapterAccount
function mapPrismaAccountToAdapterAccount(
  prismaAccount: PrismaAccount
): AdapterAccount {
  return {
    ...prismaAccount,
    type: prismaAccount.type as AdapterAccount['type'],
    refresh_token: prismaAccount.refresh_token ?? undefined,
    access_token: prismaAccount.access_token ?? undefined,
    expires_at: prismaAccount.expires_at ?? undefined,
    token_type: prismaAccount.token_type ?? undefined,
    scope: prismaAccount.scope ?? undefined,
    id_token: prismaAccount.id_token ?? undefined,
    session_state: prismaAccount.session_state ?? undefined,
  };
}

export function CustomPrismaAdapter(p: PrismaClient): Adapter {
  return {
    async createUser(
      user: Omit<CustomAdapterUser, 'id'>
    ): Promise<CustomAdapterUser> {
      const createdUser = await p.user.create({
        data: {
          email: user.email,
          name: user.name,
          image: user.image,
          emailVerified: user.emailVerified,
          // password field is not handled by the adapter, but by the CredentialsProvider
        },
      });
      // Ensure roles and permissions are always defined, even if empty on creation
      return {
        ...createdUser,
        id: createdUser.id,
        roles: user.roles || [],
        permissions: user.permissions || [],
      };
    },
    async getUser(id: string): Promise<CustomAdapterUser | null> {
      const user = await p.user.findUnique({
        where: { id },
        include: {
          roles: {
            include: {
              role: {
                include: {
                  permissions: { include: { permission: true } },
                },
              },
            },
          },
          permissions: { include: { permission: true } },
        },
      });
      if (!user) return null;
      return {
        ...user,
        roles: user.roles.map((ur) => ur.role.name),
        permissions: [
          ...user.permissions.map((up) => up.permission.name),
          ...user.roles.flatMap((ur) =>
            ur.role.permissions.map(
              (rp: { permission: { name: string } }) =>
                rp.permission.name
            )
          ),
        ],
      };
    },
    async getUserByEmail(
      email: string
    ): Promise<CustomAdapterUser | null> {
      const user = await p.user.findUnique({
        where: { email },
        include: {
          roles: {
            include: {
              role: {
                include: {
                  permissions: { include: { permission: true } },
                },
              },
            },
          },
          permissions: { include: { permission: true } },
        },
      });
      if (!user) return null;
      return {
        ...user,
        roles: user.roles.map((ur) => ur.role.name),
        permissions: [
          ...user.permissions.map((up) => up.permission.name),
          ...user.roles.flatMap((ur) =>
            ur.role.permissions.map(
              (rp: { permission: { name: string } }) =>
                rp.permission.name
            )
          ),
        ],
      };
    },
    async getUserByAccount({
      providerAccountId,
      provider,
    }: {
      providerAccountId: string;
      provider: string;
    }): Promise<CustomAdapterUser | null> {
      const account = await p.account.findUnique({
        where: {
          provider_providerAccountId: { provider, providerAccountId },
        },
        select: {
          user: {
            include: {
              roles: {
                include: {
                  role: {
                    include: {
                      permissions: { include: { permission: true } },
                    },
                  },
                },
              },
              permissions: { include: { permission: true } },
            },
          },
        },
      });
      if (!account?.user) return null;
      const user = account.user;
      return {
        ...user,
        roles: user.roles.map((ur) => ur.role.name),
        permissions: [
          ...user.permissions.map((up) => up.permission.name),
          ...user.roles.flatMap((ur) =>
            ur.role.permissions.map(
              (rp: { permission: { name: string } }) =>
                rp.permission.name
            )
          ),
        ],
      };
    },
    async updateUser(
      user: Partial<CustomAdapterUser> & Pick<CustomAdapterUser, 'id'>
    ): Promise<CustomAdapterUser> {
      const updatedUser = await p.user.update({
        where: { id: user.id },
        data: {
          name: user.name,
          email: user.email,
          image: user.image,
          emailVerified: user.emailVerified,
        },
      });
      return {
        ...updatedUser,
        id: updatedUser.id,
        roles: user.roles || [],
        permissions: user.permissions || [],
      };
    },
    async deleteUser(userId: string) {
      await p.user.delete({
        where: { id: userId },
      });
    },
    async linkAccount(
      account: AdapterAccount
    ): Promise<AdapterAccount> {
      const newAccount = await p.account.create({
        data: {
          userId: account.userId,
          type: account.type as AccountType, // Cast to AccountType enum
          provider: account.provider,
          providerAccountId: account.providerAccountId,
          refresh_token: account.refresh_token,
          access_token: account.access_token,
          expires_at: account.expires_at,
          token_type: account.token_type,
          scope: account.scope,
          id_token: account.id_token,
          session_state: account.session_state,
        },
      });
      return mapPrismaAccountToAdapterAccount(newAccount);
    },
    async unlinkAccount({
      providerAccountId,
      provider,
    }: {
      providerAccountId: string;
      provider: string;
    }) {
      await p.account.delete({
        where: {
          provider_providerAccountId: { provider, providerAccountId },
        },
      });
    },
    async createSession({
      sessionToken,
      userId,
      expires,
    }: AdapterSession): Promise<AdapterSession> {
      const newSession = await p.session.create({
        data: { sessionToken, userId, expires },
      });
      return newSession;
    },
    async getSessionAndUser(sessionToken: string): Promise<{
      session: AdapterSession;
      user: CustomAdapterUser;
    } | null> {
      const userAndSession = await p.session.findUnique({
        where: { sessionToken },
        include: {
          user: {
            include: {
              roles: {
                include: {
                  role: {
                    include: {
                      permissions: { include: { permission: true } },
                    },
                  },
                },
              },
              permissions: { include: { permission: true } },
            },
          },
        },
      });
      if (!userAndSession) return null;
      const user = userAndSession.user;
      return {
        session: userAndSession,
        user: {
          ...user,
          roles: user.roles.map((ur) => ur.role.name),
          permissions: [
            ...user.permissions.map((up) => up.permission.name),
            ...user.roles.flatMap((ur) =>
              ur.role.permissions.map(
                (rp: { permission: { name: string } }) =>
                  rp.permission.name
              )
            ),
          ],
        },
      };
    },
    async updateSession({
      sessionToken,
      userId,
      expires,
    }: Partial<AdapterSession> &
      Pick<AdapterSession, 'sessionToken'>): Promise<AdapterSession> {
      const updatedSession = await p.session.update({
        where: { sessionToken },
        data: { userId, expires },
      });
      return updatedSession;
    },
    async deleteSession(sessionToken: string) {
      await p.session.delete({
        where: { sessionToken },
      });
    },
    async createVerificationToken({
      identifier,
      expires,
      token,
    }: VerificationToken): Promise<VerificationToken> {
      const newVerificationToken = await p.verificationToken.create({
        data: { identifier, expires, token },
      });
      return newVerificationToken;
    },
    async useVerificationToken({
      identifier,
      token,
    }: {
      identifier: string;
      token: string;
    }): Promise<VerificationToken | null> {
      const verificationToken = await p.verificationToken.findUnique({
        where: { identifier_token: { identifier, token } },
      });
      if (!verificationToken) return null;
      await p.verificationToken.delete({
        where: { identifier_token: { identifier, token } },
      });
      return verificationToken;
    },
  };
}

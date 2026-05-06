import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth';

/**
 * Middleware for protecting API routes with authentication
 * Usage: const session = await requireAuth(request);
 */
export async function requireAuth(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized: No session found' },
      { status: 401 },
    );
  }

  return session;
}

/**
 * Middleware for protecting API routes with specific permissions
 * Usage: await requirePermission(request, 'dashboard:read');
 */
export async function requirePermission(
  request: NextRequest,
  permission: string,
) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized: No session found' },
      { status: 401 },
    );
  }

  const userPermissions = (session.user as any).permissions || [];
  if (!userPermissions.includes(permission)) {
    return NextResponse.json(
      {
        error: `Forbidden: Missing required permission "${permission}"`,
      },
      { status: 403 },
    );
  }

  return session;
}

/**
 * Middleware for protecting API routes with specific roles
 * Usage: await requireRole(request, 'admin');
 */
export async function requireRole(request: NextRequest, role: string) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized: No session found' },
      { status: 401 },
    );
  }

  const userRoles = (session.user as any).roles || [];
  if (!userRoles.includes(role)) {
    return NextResponse.json(
      { error: `Forbidden: This action requires the "${role}" role` },
      { status: 403 },
    );
  }

  return session;
}

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create roles
  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: {
      name: 'admin',
      description: 'Full access to all features and user management',
    },
  });

  const managerRole = await prisma.role.upsert({
    where: { name: 'manager' },
    update: {},
    create: {
      name: 'manager',
      description:
        'Access to dashboard and reports, limited user management',
    },
  });

  const viewerRole = await prisma.role.upsert({
    where: { name: 'viewer' },
    update: {},
    create: {
      name: 'viewer',
      description: 'Read-only access to dashboard and reports',
    },
  });

  console.log('✅ Roles created');

  // Create permissions
  const permissions = [
    // Dashboard permissions
    {
      name: 'dashboard:read',
      description: 'View dashboard',
      resource: 'dashboard',
      action: 'read',
    },
    {
      name: 'dashboard:write',
      description: 'Modify dashboard settings',
      resource: 'dashboard',
      action: 'write',
    },

    // Deals permissions
    {
      name: 'deals:read',
      description: 'View deals',
      resource: 'deals',
      action: 'read',
    },
    {
      name: 'deals:write',
      description: 'Create and edit deals',
      resource: 'deals',
      action: 'write',
    },
    {
      name: 'deals:delete',
      description: 'Delete deals',
      resource: 'deals',
      action: 'delete',
    },

    // Contacts permissions
    {
      name: 'contacts:read',
      description: 'View contacts',
      resource: 'contacts',
      action: 'read',
    },
    {
      name: 'contacts:write',
      description: 'Create and edit contacts',
      resource: 'contacts',
      action: 'write',
    },
    {
      name: 'contacts:delete',
      description: 'Delete contacts',
      resource: 'contacts',
      action: 'delete',
    },

    // Companies permissions
    {
      name: 'companies:read',
      description: 'View companies',
      resource: 'companies',
      action: 'read',
    },
    {
      name: 'companies:write',
      description: 'Create and edit companies',
      resource: 'companies',
      action: 'write',
    },
    {
      name: 'companies:delete',
      description: 'Delete companies',
      resource: 'companies',
      action: 'delete',
    },

    // Tasks permissions
    {
      name: 'tasks:read',
      description: 'View tasks',
      resource: 'tasks',
      action: 'read',
    },
    {
      name: 'tasks:write',
      description: 'Create and edit tasks',
      resource: 'tasks',
      action: 'write',
    },
    {
      name: 'tasks:delete',
      description: 'Delete tasks',
      resource: 'tasks',
      action: 'delete',
    },

    // User management permissions
    {
      name: 'users:read',
      description: 'View users',
      resource: 'users',
      action: 'read',
    },
    {
      name: 'users:write',
      description: 'Create and edit users',
      resource: 'users',
      action: 'write',
    },
    {
      name: 'users:delete',
      description: 'Delete users',
      resource: 'users',
      action: 'delete',
    },

    // Settings permissions
    {
      name: 'settings:read',
      description: 'View settings',
      resource: 'settings',
      action: 'read',
    },
    {
      name: 'settings:write',
      description: 'Modify settings',
      resource: 'settings',
      action: 'write',
    },
  ];

  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: { name: perm.name },
      update: {},
      create: perm,
    });
  }

  console.log('✅ Permissions created');

  // Assign permissions to roles
  const rolePermissions = {
    admin: [
      'dashboard:read',
      'dashboard:write',
      'deals:read',
      'deals:write',
      'deals:delete',
      'contacts:read',
      'contacts:write',
      'contacts:delete',
      'companies:read',
      'companies:write',
      'companies:delete',
      'tasks:read',
      'tasks:write',
      'tasks:delete',
      'users:read',
      'users:write',
      'users:delete',
      'settings:read',
      'settings:write',
    ],
    manager: [
      'dashboard:read',
      'deals:read',
      'deals:write',
      'contacts:read',
      'contacts:write',
      'companies:read',
      'companies:write',
      'tasks:read',
      'tasks:write',
      'users:read',
      'settings:read',
    ],
    viewer: [
      'dashboard:read',
      'deals:read',
      'contacts:read',
      'companies:read',
      'tasks:read',
      'settings:read',
    ],
  };

  for (const [roleName, permissionNames] of Object.entries(
    rolePermissions
  )) {
    const role = await prisma.role.findUnique({
      where: { name: roleName },
    });
    if (role) {
      for (const permissionName of permissionNames) {
        const permission = await prisma.permission.findUnique({
          where: { name: permissionName },
        });
        if (permission) {
          await prisma.rolePermission.upsert({
            where: {
              roleId_permissionId: {
                roleId: role.id,
                permissionId: permission.id,
              },
            },
            update: {},
            create: {
              roleId: role.id,
              permissionId: permission.id,
            },
          });
        }
      }
    }
  }

  console.log('✅ Role permissions assigned');

  // Create default admin user
  const hashedPassword = await bcrypt.hash('admin123', 12);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin User',
      password: hashedPassword,
      emailVerified: new Date(),
    },
  });

  // Assign admin role to admin user
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: adminUser.id,
        roleId: adminRole.id,
      },
    },
    update: {},
    create: {
      userId: adminUser.id,
      roleId: adminRole.id,
    },
  });

  console.log('✅ Default admin user created');
  console.log('📧 Email: admin@example.com');
  console.log('🔑 Password: admin123');
  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

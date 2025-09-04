const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createAdminUser() {
  try {
    const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12')

    // Check if admin user already exists
    const existingAdmin = await prisma.user.findFirst({
      where: {
        roles: {
          has: 'admin'
        }
      }
    })

    if (existingAdmin) {
      console.log('Admin user already exists:', existingAdmin.primary_login)
      return
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', BCRYPT_ROUNDS)

    const adminUser = await prisma.user.create({
      data: {
        user_id: 'admin-user-001',
        primary_login: 'admin@pfr.org',
        email: 'admin@pfr.org',
        phone_e164: '+1234567890',
        password_hash: hashedPassword,
        roles: ['admin', 'group_approver'],
        phone_verified_at: new Date(),
        is_active: true,
      }
    })

    console.log('Admin user created successfully!')
    console.log('Login:', adminUser.primary_login)
    console.log('Password: admin123')
    console.log('Please change the password after first login.')

  } catch (error) {
    console.error('Error creating admin user:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createAdminUser()

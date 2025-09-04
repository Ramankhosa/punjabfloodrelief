const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkUsers() {
  try {
    console.log('Checking users in database...\n')

    const users = await prisma.user.findMany({
      select: {
        user_id: true,
        primary_login: true,
        email: true,
        phone_e164: true,
        roles: true,
        phone_verified_at: true,
        created_at: true,
        last_login_at: true,
        is_active: true,
        _count: {
          select: {
            relief_groups: true,
          },
        },
      },
    })

    if (users.length === 0) {
      console.log('❌ No users found in database')
      console.log('\n🔧 Run this to create an admin user:')
      console.log('node scripts/create-admin-user.js')
      return
    }

    console.log(`📊 Found ${users.length} user(s):\n`)

    users.forEach((user, index) => {
      console.log(`${index + 1}. User ID: ${user.user_id}`)
      console.log(`   Login: ${user.primary_login}`)
      console.log(`   Email: ${user.email || 'Not set'}`)
      console.log(`   Phone: ${user.phone_e164 || 'Not set'}`)
      console.log(`   Roles: ${user.roles.length > 0 ? user.roles.join(', ') : 'No roles'}`)
      console.log(`   Active: ${user.is_active ? '✅' : '❌'}`)
      console.log(`   Phone Verified: ${user.phone_verified_at ? '✅' : '❌'}`)
      console.log(`   Groups Created: ${user._count.relief_groups}`)
      console.log(`   Created: ${user.created_at.toLocaleString()}`)
      console.log(`   Last Login: ${user.last_login_at ? user.last_login_at.toLocaleString() : 'Never'}`)
      console.log('   ---')

      // Check if this user has admin rights
      if (user.roles.includes('admin')) {
        console.log('   🎉 ADMIN USER FOUND!')
      } else if (user.roles.includes('group_approver')) {
        console.log('   👤 APPROVER USER FOUND!')
      }
    })

    console.log('\n💡 To create an admin user, run:')
    console.log('node scripts/create-admin-user.js')

  } catch (error) {
    console.error('❌ Error checking users:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkUsers()

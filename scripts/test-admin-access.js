const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function testAdminAccess() {
  try {
    console.log('🧪 Testing Admin Access...\n')

    // 1. Check if admin user exists
    const adminUser = await prisma.user.findFirst({
      where: {
        roles: {
          has: 'admin'
        }
      }
    })

    if (!adminUser) {
      console.log('❌ No admin user found!')
      console.log('🔧 Create one with: node scripts/create-admin-user.js')
      return
    }

    console.log('✅ Admin user found:')
    console.log(`   Login: ${adminUser.primary_login}`)
    console.log(`   Email: ${adminUser.email}`)
    console.log(`   Roles: ${adminUser.roles.join(', ')}`)
    console.log(`   Active: ${adminUser.is_active ? '✅' : '❌'}`)

    // 2. Verify admin user has correct roles
    const hasAdminRole = adminUser.roles.includes('admin')
    const hasApproverRole = adminUser.roles.includes('group_approver')

    console.log('\n🔍 Role Check:')
    console.log(`   Admin role: ${hasAdminRole ? '✅' : '❌'}`)
    console.log(`   Approver role: ${hasApproverRole ? '✅' : '❌'}`)

    if (!hasAdminRole && !hasApproverRole) {
      console.log('\n❌ Admin user missing required roles!')
      console.log('🔧 Fix with: UPDATE users SET roles = ARRAY[\'admin\', \'group_approver\'] WHERE user_id = \'' + adminUser.user_id + '\';')
      return
    }

    // 3. Check database schema
    console.log('\n📊 Database Schema Check:')

    // Check if relief_groups has the new admin fields
    const groupColumns = await prisma.$queryRaw`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'relief_groups'
      AND column_name IN ('reviewed_by_user_id', 'reviewed_at', 'review_notes')
      ORDER BY column_name
    `

    const hasAdminFields = groupColumns.length >= 3
    console.log(`   Admin approval fields: ${hasAdminFields ? '✅' : '❌'}`)

    if (!hasAdminFields) {
      console.log('   Missing fields: reviewed_by_user_id, reviewed_at, review_notes')
    }

    // 4. Test password verification
    const testPassword = 'admin123'
    const isPasswordValid = await bcrypt.compare(testPassword, adminUser.password_hash)
    console.log(`   Default password works: ${isPasswordValid ? '✅' : '❌'}`)

    if (isPasswordValid) {
      console.log('\n⚠️  WARNING: Using default password!')
      console.log('🔐 Please change the password after login.')
    }

    console.log('\n🎉 Admin setup looks good!')
    console.log('\n📋 Next Steps:')
    console.log('1. Start the development server: npm run dev')
    console.log('2. Login with:')
    console.log(`   Email: ${adminUser.primary_login}`)
    console.log(`   Password: admin123`)
    console.log('3. You should see the "Admin Panel" card on the dashboard')
    console.log('4. Click "Access Admin" to enter the admin section')

  } catch (error) {
    console.error('❌ Error testing admin access:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testAdminAccess()

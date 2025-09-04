const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifyImport() {
  try {
    console.log('🔍 Verifying location data import...\n');

    // Check sample villages to verify name cleaning
    const villages = await prisma.village.findMany({
      take: 10,
      select: {
        village_code: true,
        village_name: true,
        tehsil: {
          select: {
            tehsil_name: true,
            district: {
              select: {
                district_name: true,
                state: {
                  select: {
                    state_name: true
                  }
                }
              }
            }
          }
        }
      }
    });

    console.log('📋 Sample cleaned village names:');
    villages.forEach(v => {
      console.log(`  ${v.village_code}: ${v.village_name}`);
      console.log(`    └─ ${v.tehsil.tehsil_name} → ${v.tehsil.district.district_name} → ${v.tehsil.district.state.state_name}`);
    });

    // Check for any villages that still have parentheses (should be none)
    const villagesWithParentheses = await prisma.village.findMany({
      where: {
        village_name: {
          contains: '('
        }
      },
      take: 5,
      select: {
        village_code: true,
        village_name: true
      }
    });

    if (villagesWithParentheses.length > 0) {
      console.log('\n⚠️  Warning: Found villages with parentheses that were not cleaned:');
      villagesWithParentheses.forEach(v => {
        console.log(`  ${v.village_code}: ${v.village_name}`);
      });
    } else {
      console.log('\n✅ All village names successfully cleaned (no parentheses found)');
    }

    // Summary statistics
    const stateCount = await prisma.state.count();
    const districtCount = await prisma.district.count();
    const tehsilCount = await prisma.tehsil.count();
    const villageCount = await prisma.village.count();

    console.log('\n📊 Final Database Summary:');
    console.log(`   States: ${stateCount}`);
    console.log(`   Districts: ${districtCount}`);
    console.log(`   Tehsils: ${tehsilCount}`);
    console.log(`   Villages: ${villageCount}`);

  } catch (error) {
    console.error('❌ Verification failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyImport();

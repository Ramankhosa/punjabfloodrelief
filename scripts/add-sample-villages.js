const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addSampleVillages() {
  try {
    console.log('Adding sample villages for testing...');

    // Create sample data
    const sampleData = [
      {
        state_code: 'PB',
        state_name: 'Punjab',
        district_code: 'LDH',
        district_name: 'Ludhiana',
        tehsil_code: 'LDH001',
        tehsil_name: 'Ludhiana East',
        villages: [
          { code: 'LDH001001', name: 'Ludhiana Village' },
          { code: 'LDH001002', name: 'Model Town' },
          { code: 'LDH001003', name: 'Civil Lines' },
          { code: 'LDH001004', name: 'Sarabha Nagar' },
          { code: 'LDH001005', name: 'BRS Nagar' },
          { code: 'LDH001006', name: 'Dugri' },
          { code: 'LDH001007', name: 'Jagraon' },
          { code: 'LDH001008', name: 'Raikot' },
          { code: 'LDH001009', name: 'Samrala' },
          { code: 'LDH001010', name: 'Khanna' }
        ]
      },
      {
        state_code: 'PB',
        state_name: 'Punjab',
        district_code: 'AMR',
        district_name: 'Amritsar',
        tehsil_code: 'AMR001',
        tehsil_name: 'Amritsar Central',
        villages: [
          { code: 'AMR001001', name: 'Amritsar City' },
          { code: 'AMR001002', name: 'Majitha' },
          { code: 'AMR001003', name: 'Raja Sansi' },
          { code: 'AMR001004', name: 'Ramdas' },
          { code: 'AMR001005', name: 'Ajnala' },
          { code: 'AMR001006', name: 'Baba Bakala' },
          { code: 'AMR001007', name: 'Tarn Taran' },
          { code: 'AMR001008', name: 'Patti' },
          { code: 'AMR001009', name: 'Ferozepur' },
          { code: 'AMR001010', name: 'Zira' }
        ]
      },
      {
        state_code: 'PB',
        state_name: 'Punjab',
        district_code: 'JAL',
        district_name: 'Jalandhar',
        tehsil_code: 'JAL001',
        tehsil_name: 'Jalandhar City',
        villages: [
          { code: 'JAL001001', name: 'Jalandhar City' },
          { code: 'JAL001002', name: 'Nakodar' },
          { code: 'JAL001003', name: 'Shahkot' },
          { code: 'JAL001004', name: 'Phillaur' },
          { code: 'JAL001005', name: 'Goraya' },
          { code: 'JAL001006', name: 'Batala' },
          { code: 'JAL001007', name: 'Sri Hargobindpur' },
          { code: 'JAL001008', name: 'Qadian' },
          { code: 'JAL001009', name: 'Dhariwal' },
          { code: 'JAL001010', name: 'Kapurthala' }
        ]
      }
    ];

    // Insert data
    for (const data of sampleData) {
      // Create state
      await prisma.state.upsert({
        where: { state_code: data.state_code },
        update: { state_name: data.state_name },
        create: { state_code: data.state_code, state_name: data.state_name }
      });

      // Create district
      await prisma.district.upsert({
        where: { district_code: data.district_code },
        update: { district_name: data.district_name, state_code: data.state_code },
        create: {
          district_code: data.district_code,
          district_name: data.district_name,
          state_code: data.state_code
        }
      });

      // Create tehsil
      await prisma.tehsil.upsert({
        where: { tehsil_code: data.tehsil_code },
        update: { tehsil_name: data.tehsil_name, district_code: data.district_code },
        create: {
          tehsil_code: data.tehsil_code,
          tehsil_name: data.tehsil_name,
          district_code: data.district_code
        }
      });

      // Create villages
      for (const village of data.villages) {
        await prisma.village.upsert({
          where: { village_code: village.code },
          update: {
            village_name: village.name,
            tehsil_code: data.tehsil_code,
            district_code: data.district_code
          },
          create: {
            village_code: village.code,
            village_name: village.name,
            tehsil_code: data.tehsil_code,
            district_code: data.district_code
          }
        });
      }
    }

    console.log('✅ Sample villages added successfully!');

    // Count records
    const villageCount = await prisma.village.count();
    const districtCount = await prisma.district.count();
    const tehsilCount = await prisma.tehsil.count();

    console.log(`📊 Database Summary:`);
    console.log(`   Villages: ${villageCount}`);
    console.log(`   Districts: ${districtCount}`);
    console.log(`   Tehsils: ${tehsilCount}`);

  } catch (error) {
    console.error('❌ Error adding sample villages:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
addSampleVillages().catch(console.error);

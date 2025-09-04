const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const prisma = new PrismaClient();

// Function to clean village names by removing parentheses and numbers
function cleanVillageName(villageName) {
  // Remove anything in parentheses including the parentheses
  return villageName.replace(/\s*\([^)]*\)\s*/g, '').trim();
}

// Function to parse CSV and import data
async function importLocations() {
  const csvPath = path.join(__dirname, '..', '..', 'punjab_villages_vlist.csv');

  console.log('Starting location data import...');

  // Check if CSV file exists
  if (!fs.existsSync(csvPath)) {
    console.error(`CSV file not found at: ${csvPath}`);
    return;
  }

  const states = new Map();
  const districts = new Map();
  const tehsils = new Map();
  const villages = new Map();

  // Read and parse CSV
  const rows = [];
  fs.createReadStream(csvPath)
    .pipe(csv())
    .on('data', (row) => {
      rows.push(row);
    })
    .on('end', async () => {
      console.log(`Parsed ${rows.length} rows from CSV`);

      try {
        // Process each row
        for (const row of rows) {
          const {
            state_code,
            state_name,
            district_code,
            district_name,
            tehsil_code,
            tehsil_name,
            village_code,
            village_name
          } = row;

          // Clean village name
          const cleanedVillageName = cleanVillageName(village_name);

          // Collect unique states
          if (!states.has(state_code)) {
            states.set(state_code, {
              state_code,
              state_name
            });
          }

          // Collect unique districts
          const districtKey = `${state_code}-${district_code}`;
          if (!districts.has(districtKey)) {
            districts.set(districtKey, {
              district_code,
              district_name,
              state_code
            });
          }

          // Collect unique tehsils
          const tehsilKey = `${district_code}-${tehsil_code}`;
          if (!tehsils.has(tehsilKey)) {
            tehsils.set(tehsilKey, {
              tehsil_code,
              tehsil_name,
              district_code
            });
          }

          // Collect unique villages
          if (!villages.has(village_code)) {
            villages.set(village_code, {
              village_code,
              village_name: cleanedVillageName,
              tehsil_code,
              district_code
            });
          }
        }

        console.log(`Found ${states.size} states, ${districts.size} districts, ${tehsils.size} tehsils, ${villages.size} villages`);

        // Import data in hierarchical order
        console.log('Importing states...');
        for (const state of states.values()) {
          await prisma.state.upsert({
            where: { state_code: state.state_code },
            update: state,
            create: state
          });
        }

        console.log('Importing districts...');
        for (const district of districts.values()) {
          await prisma.district.upsert({
            where: { district_code: district.district_code },
            update: district,
            create: district
          });
        }

        console.log('Importing tehsils...');
        for (const tehsil of tehsils.values()) {
          await prisma.tehsil.upsert({
            where: { tehsil_code: tehsil.tehsil_code },
            update: tehsil,
            create: tehsil
          });
        }

        console.log('Importing villages...');
        for (const village of villages.values()) {
          await prisma.village.upsert({
            where: { village_code: village.village_code },
            update: village,
            create: village
          });
        }

        console.log('✅ Location data import completed successfully!');

        // Print summary
        const stateCount = await prisma.state.count();
        const districtCount = await prisma.district.count();
        const tehsilCount = await prisma.tehsil.count();
        const villageCount = await prisma.village.count();

        console.log('\n📊 Import Summary:');
        console.log(`   States: ${stateCount}`);
        console.log(`   Districts: ${districtCount}`);
        console.log(`   Tehsils: ${tehsilCount}`);
        console.log(`   Villages: ${villageCount}`);

      } catch (error) {
        console.error('❌ Error during import:', error);
      } finally {
        await prisma.$disconnect();
      }
    })
    .on('error', (error) => {
      console.error('❌ Error reading CSV file:', error);
      prisma.$disconnect();
    });
}

// Run the import
importLocations().catch((error) => {
  console.error('❌ Import failed:', error);
  process.exit(1);
});

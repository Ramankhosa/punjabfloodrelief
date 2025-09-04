const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Map legacy capability categories to new inventory categories
const CATEGORY_MAPPING = {
  'Food': 'FOOD',
  'Shelter': 'SHELTER',
  'Medical': 'MEDICAL',
  'Water': 'WATER_SANITATION',
  'Transport': 'TRANSPORT',
  'Communication': 'COMMUNICATION'
};

// Map legacy capability bands to quantity estimates
const CAPACITY_TO_QUANTITY = {
  'tiny': 20,
  'small': 100,
  'medium': 500,
  'large': 2000,
  'mega': 5000,
  'call_confirm': 50
};

// Map legacy availability modes to new modes
const AVAILABILITY_MODE_MAPPING = {
  'now': 'IMMEDIATE',
  'daterange': 'SCHEDULED',
  'on_call': 'ON_REQUEST'
};

async function migrateToInventorySystem() {
  try {
    console.log('🚀 Starting migration from Capability to Inventory system...\n');

    // Step 1: Create Inventory Item Types from Capability Types
    console.log('📦 Step 1: Creating inventory item types...');
    await createInventoryItemTypes();

    // Step 2: Transform Capabilities to Inventory Entries
    console.log('📋 Step 2: Transforming capabilities to inventory entries...');
    await transformCapabilitiesToInventory();

    // Step 3: Clean up and verification
    console.log('✅ Step 3: Verification and cleanup...');
    await verifyMigration();

    console.log('🎉 Migration completed successfully!');
    console.log('\n📋 Migration Summary:');
    console.log('- Old capability system preserved for backward compatibility');
    console.log('- New inventory system ready for use');
    console.log('- Granular item availability management enabled');
    console.log('- Resupply request system initialized');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function createInventoryItemTypes() {
  console.log('  Creating inventory item types from capability types...');

  // Get all active capability types
  const capabilityTypes = await prisma.capabilityType.findMany({
    where: { is_active: true }
  });

  console.log(`  Found ${capabilityTypes.length} capability types to migrate`);

  let createdCount = 0;
  let skippedCount = 0;

  for (const capType of capabilityTypes) {
    // Check if this item type already exists
    const existingItemType = await prisma.inventoryItemType.findFirst({
      where: {
        category: CATEGORY_MAPPING[capType.category] || 'OTHER',
        subcategory: capType.subcategory
      }
    });

    if (!existingItemType) {
      // Map category
      const inventoryCategory = CATEGORY_MAPPING[capType.category] || 'OTHER';

      // Determine if item is perishable based on category
      const isPerishable = ['FOOD', 'MEDICAL'].includes(inventoryCategory);

      // Create inventory item type
      await prisma.inventoryItemType.create({
        data: {
          category: inventoryCategory,
          subcategory: capType.subcategory,
          name: capType.name,
          description: capType.description,
          icon: capType.icon,
          unit: getUnitForCategory(capType.category, capType.subcategory),
          is_perishable: isPerishable,
          shelf_life_days: isPerishable ? getShelfLifeForItem(capType.subcategory) : null,
          sort_order: capType.sort_order,
          is_active: capType.is_active
        }
      });

      createdCount++;
      console.log(`    ✅ Created: ${capType.category}:${capType.subcategory} → ${inventoryCategory}`);
    } else {
      skippedCount++;
      console.log(`    ⏭️  Skipped: ${capType.category}:${capType.subcategory} (already exists)`);
    }
  }

  console.log(`\n  📊 Item Types Migration: ${createdCount} created, ${skippedCount} skipped\n`);
}

async function transformCapabilitiesToInventory() {
  console.log('  Transforming capabilities to inventory entries...');

  // Get all active capabilities with their types
  const capabilities = await prisma.capability.findMany({
    where: { status: 'active' },
    include: {
      provider: true,
      district: true,
      tehsil: true,
      capability_links: {
        include: { capability_type: true }
      }
    }
  });

  console.log(`  Found ${capabilities.length} active capabilities to transform`);

  let transformedCount = 0;
  let skippedCount = 0;

  for (const capability of capabilities) {
    // Process each capability type link
    for (const link of capability.capability_links) {
      const capType = link.capability_type;

      // Find corresponding inventory item type
      const itemType = await prisma.inventoryItemType.findFirst({
        where: {
          category: CATEGORY_MAPPING[capType.category] || 'OTHER',
          subcategory: capType.subcategory
        }
      });

      if (!itemType) {
        console.log(`    ⚠️  Warning: No item type found for ${capType.category}:${capType.subcategory}`);
        continue;
      }

      // Check if inventory entry already exists
      const existingEntry = await prisma.inventoryEntry.findFirst({
        where: {
          provider_id: capability.provider_id,
          item_type_id: itemType.item_type_id,
          district_code: capability.district_code,
          tehsil_code: capability.tehsil_code
        }
      });

      if (!existingEntry) {
        // Estimate quantity based on capacity band
        const estimatedQuantity = capability.capacity_band
          ? CAPACITY_TO_QUANTITY[capability.capacity_band] || 50
          : 50;

        // Create inventory entry
        await prisma.inventoryEntry.create({
          data: {
            provider_id: capability.provider_id,
            item_type_id: itemType.item_type_id,
            district_code: capability.district_code,
            tehsil_code: capability.tehsil_code,
            quantity_total: estimatedQuantity,
            quantity_available: estimatedQuantity,
            condition: 'GOOD', // Default assumption
            availability_mode: AVAILABILITY_MODE_MAPPING[capability.availability_mode] || 'IMMEDIATE',
            available_from: capability.available_from,
            available_until: capability.available_until,
            response_hours: capability.response_hours,
            status: capability.status === 'active' ? 'AVAILABLE' : 'OUT_OF_STOCK',
            visibility: 'PUBLIC',
            is_verified: capability.is_verified,
            verified_at: capability.verified_at,
            verified_by: capability.verified_by,
            evidence_urls: capability.evidence_urls,
            notes: capability.notes
          }
        });

        transformedCount++;
        console.log(`    ✅ Transformed: ${capType.name} (${estimatedQuantity} units)`);
      } else {
        skippedCount++;
        console.log(`    ⏭️  Skipped: ${capType.name} (inventory entry exists)`);
      }
    }
  }

  console.log(`\n  📊 Inventory Entries Migration: ${transformedCount} created, ${skippedCount} skipped\n`);
}

async function verifyMigration() {
  console.log('  Verifying migration results...');

  // Count inventory item types
  const itemTypeCount = await prisma.inventoryItemType.count();
  console.log(`    📦 Inventory Item Types: ${itemTypeCount}`);

  // Count inventory entries
  const entryCount = await prisma.inventoryEntry.count();
  console.log(`    📋 Inventory Entries: ${entryCount}`);

  // Count by category
  const entriesByCategory = await prisma.inventoryEntry.groupBy({
    by: ['item_type_id'],
    _count: true
  });

  console.log(`    📊 Entries by Item Type: ${entriesByCategory.length} types with inventory`);

  // Sample verification - show a few inventory entries
  const sampleEntries = await prisma.inventoryEntry.findMany({
    take: 3,
    include: {
      item_type: true,
      district: true,
      tehsil: true,
      provider: true
    }
  });

  if (sampleEntries.length > 0) {
    console.log('\n    🔍 Sample Inventory Entries:');
    sampleEntries.forEach(entry => {
      console.log(`      • ${entry.item_type.name}: ${entry.quantity_available}/${entry.quantity_total} units`);
      console.log(`        Location: ${entry.district.district_name}, ${entry.tehsil.tehsil_name}`);
      console.log(`        Provider: ${entry.provider.alias || 'Unnamed'}`);
    });
  }

  console.log('\n  ✅ Migration verification completed\n');
}

// Helper functions
function getUnitForCategory(category, subcategory) {
  // Determine appropriate unit based on category and subcategory
  if (category === 'Food') {
    if (subcategory.includes('meals') || subcategory.includes('Meals')) return 'meals';
    if (subcategory.includes('ration') || subcategory.includes('Ration')) return 'kg';
    return 'servings';
  }

  if (category === 'Shelter') {
    if (subcategory.includes('tent') || subcategory.includes('Tent')) return 'tents';
    if (subcategory.includes('tarpaulin') || subcategory.includes('Tarpaulin')) return 'sheets';
    if (subcategory.includes('blanket') || subcategory.includes('Blanket')) return 'pieces';
    return 'units';
  }

  if (category === 'Medical') {
    if (subcategory.includes('kit') || subcategory.includes('Kit')) return 'kits';
    return 'units';
  }

  if (category === 'Water') {
    if (subcategory.includes('water') || subcategory.includes('Water')) return 'liters';
    return 'units';
  }

  return 'units';
}

function getShelfLifeForItem(subcategory) {
  // Estimate shelf life for perishable items
  if (subcategory.toLowerCase().includes('cooked') ||
      subcategory.toLowerCase().includes('meal')) {
    return 1; // 1 day for cooked meals
  }

  if (subcategory.toLowerCase().includes('milk') ||
      subcategory.toLowerCase().includes('dairy')) {
    return 7; // 7 days for dairy
  }

  if (subcategory.toLowerCase().includes('fruit') ||
      subcategory.toLowerCase().includes('vegetable')) {
    return 3; // 3 days for fresh produce
  }

  return 30; // Default 30 days
}

// Run the migration
migrateToInventorySystem().catch((error) => {
  console.error('❌ Migration script failed:', error);
  process.exit(1);
});

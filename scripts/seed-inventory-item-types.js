const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const inventoryItemTypesData = [
  // Food Items
  {
    category: 'FOOD',
    subcategory: 'Cooked Meals',
    name: 'Cooked Meals',
    description: 'Hot, ready-to-eat meals for affected families',
    icon: '🍽️',
    unit: 'meals',
    is_perishable: true,
    shelf_life_days: 1,
    sort_order: 1
  },
  {
    category: 'FOOD',
    subcategory: 'Ready-to-Eat Food',
    name: 'Ready-to-Eat Food Packs',
    description: 'Packaged food items that are ready to consume',
    icon: '🥫',
    unit: 'packs',
    is_perishable: false,
    shelf_life_days: 365,
    sort_order: 2
  },
  {
    category: 'FOOD',
    subcategory: 'Dry Rations',
    name: 'Dry Rations',
    description: 'Dry food supplies like rice, wheat, pulses',
    icon: '🌾',
    unit: 'kg',
    is_perishable: false,
    shelf_life_days: 730,
    sort_order: 3
  },
  {
    category: 'FOOD',
    subcategory: 'Fresh Produce',
    name: 'Fresh Fruits & Vegetables',
    description: 'Fresh fruits and vegetables',
    icon: '🥕',
    unit: 'kg',
    is_perishable: true,
    shelf_life_days: 7,
    sort_order: 4
  },
  {
    category: 'FOOD',
    subcategory: 'Dairy Products',
    name: 'Milk & Dairy Products',
    description: 'Milk, yogurt, cheese, and other dairy items',
    icon: '🥛',
    unit: 'liters',
    is_perishable: true,
    shelf_life_days: 7,
    sort_order: 5
  },

  // Shelter Items
  {
    category: 'SHELTER',
    subcategory: 'Tarpaulin Sheets',
    name: 'Tarpaulin Sheets',
    description: 'Waterproof tarpaulin sheets for temporary shelter',
    icon: '🏠',
    unit: 'sheets',
    is_perishable: false,
    shelf_life_days: null,
    sort_order: 6
  },
  {
    category: 'SHELTER',
    subcategory: 'Blankets',
    name: 'Blankets',
    description: 'Warm blankets for cold weather relief',
    icon: '🛏️',
    unit: 'pieces',
    is_perishable: false,
    shelf_life_days: null,
    sort_order: 7
  },
  {
    category: 'SHELTER',
    subcategory: 'Tents',
    name: 'Tents',
    description: 'Temporary tents for displaced families',
    icon: '⛺',
    unit: 'tents',
    is_perishable: false,
    shelf_life_days: null,
    sort_order: 8
  },
  {
    category: 'SHELTER',
    subcategory: 'Sleeping Mats',
    name: 'Sleeping Mats',
    description: 'Floor mats for sleeping',
    icon: '🛋️',
    unit: 'pieces',
    is_perishable: false,
    shelf_life_days: null,
    sort_order: 9
  },
  {
    category: 'SHELTER',
    subcategory: 'Plastic Sheeting',
    name: 'Plastic Sheeting',
    description: 'Plastic sheets for various uses',
    icon: '📄',
    unit: 'sheets',
    is_perishable: false,
    shelf_life_days: null,
    sort_order: 10
  },

  // Medical Items
  {
    category: 'MEDICAL',
    subcategory: 'First Aid Kits',
    name: 'First Aid Kits',
    description: 'Basic medical supplies and first aid kits',
    icon: '🩹',
    unit: 'kits',
    is_perishable: false,
    shelf_life_days: 730,
    sort_order: 11
  },
  {
    category: 'MEDICAL',
    subcategory: 'Medicines',
    name: 'Essential Medicines',
    description: 'Basic medicines and pharmaceuticals',
    icon: '💊',
    unit: 'packs',
    is_perishable: true,
    shelf_life_days: 365,
    sort_order: 12
  },
  {
    category: 'MEDICAL',
    subcategory: 'Medical Equipment',
    name: 'Medical Equipment',
    description: 'Medical equipment and supplies',
    icon: '🏥',
    unit: 'units',
    is_perishable: false,
    shelf_life_days: null,
    sort_order: 13
  },
  {
    category: 'MEDICAL',
    subcategory: 'Hygiene Kits',
    name: 'Hygiene & Sanitation Kits',
    description: 'Personal hygiene and sanitation supplies',
    icon: '🧴',
    unit: 'kits',
    is_perishable: false,
    shelf_life_days: 730,
    sort_order: 14
  },
  {
    category: 'MEDICAL',
    subcategory: 'Masks',
    name: 'Face Masks',
    description: 'Protective face masks',
    icon: '😷',
    unit: 'pieces',
    is_perishable: false,
    shelf_life_days: 1095,
    sort_order: 15
  },

  // Water & Sanitation
  {
    category: 'WATER_SANITATION',
    subcategory: 'Drinking Water',
    name: 'Drinking Water',
    description: 'Clean drinking water supply',
    icon: '💧',
    unit: 'liters',
    is_perishable: false,
    shelf_life_days: null,
    sort_order: 16
  },
  {
    category: 'WATER_SANITATION',
    subcategory: 'Water Purification',
    name: 'Water Purification Systems',
    description: 'Water purification tablets and systems',
    icon: '🧪',
    unit: 'units',
    is_perishable: false,
    shelf_life_days: 1095,
    sort_order: 17
  },
  {
    category: 'WATER_SANITATION',
    subcategory: 'Buckets',
    name: 'Buckets & Containers',
    description: 'Water storage containers and buckets',
    icon: '🪣',
    unit: 'pieces',
    is_perishable: false,
    shelf_life_days: null,
    sort_order: 18
  },
  {
    category: 'WATER_SANITATION',
    subcategory: 'Sanitation Supplies',
    name: 'Sanitation Supplies',
    description: 'Toiletries and sanitation materials',
    icon: '🚽',
    unit: 'kits',
    is_perishable: false,
    shelf_life_days: 730,
    sort_order: 19
  },

  // Transportation
  {
    category: 'TRANSPORT',
    subcategory: 'Evacuation Transport',
    name: 'Evacuation Transport',
    description: 'Transportation for evacuation and relocation',
    icon: '🚐',
    unit: 'trips',
    is_perishable: false,
    shelf_life_days: null,
    sort_order: 20
  },
  {
    category: 'TRANSPORT',
    subcategory: 'Relief Distribution',
    name: 'Relief Distribution Transport',
    description: 'Transportation for relief material distribution',
    icon: '🚛',
    unit: 'trips',
    is_perishable: false,
    shelf_life_days: null,
    sort_order: 21
  },

  // Communication
  {
    category: 'COMMUNICATION',
    subcategory: 'Information Center',
    name: 'Information Center Support',
    description: 'Information and coordination center support',
    icon: '📞',
    unit: 'hours',
    is_perishable: false,
    shelf_life_days: null,
    sort_order: 22
  },
  {
    category: 'COMMUNICATION',
    subcategory: 'Communication Devices',
    name: 'Communication Devices',
    description: 'Radios, phones, and communication equipment',
    icon: '📱',
    unit: 'devices',
    is_perishable: false,
    shelf_life_days: null,
    sort_order: 23
  }
];

async function seedInventoryItemTypes() {
  try {
    console.log('🌱 Seeding inventory item types...\n');

    for (const itemTypeData of inventoryItemTypesData) {
      const existingItemType = await prisma.inventoryItemType.findFirst({
        where: {
          category: itemTypeData.category,
          subcategory: itemTypeData.subcategory
        }
      });

      if (!existingItemType) {
        const newItemType = await prisma.inventoryItemType.create({
          data: itemTypeData
        });
        console.log(`✅ Created: ${itemTypeData.category}:${itemTypeData.subcategory} (${itemTypeData.name})`);
      } else {
        console.log(`⏭️  Skipped: ${itemTypeData.category}:${itemTypeData.subcategory} (already exists)`);
      }
    }

    // Verify the seeding
    const totalItemTypes = await prisma.inventoryItemType.count();
    console.log(`\n📊 Total inventory item types: ${totalItemTypes}`);

    if (totalItemTypes > 0) {
      const itemTypesByCategory = await prisma.inventoryItemType.findMany({
        select: {
          category: true,
          subcategory: true,
          name: true,
          unit: true
        },
        orderBy: [
          { category: 'asc' },
          { sort_order: 'asc' }
        ]
      });

      console.log('\n📋 Available inventory item types:');
      const categories = {};
      itemTypesByCategory.forEach(type => {
        if (!categories[type.category]) {
          categories[type.category] = [];
        }
        categories[type.category].push(`${type.subcategory} (${type.name}) - ${type.unit}`);
      });

      Object.keys(categories).forEach(category => {
        console.log(`\n${category}:`);
        categories[category].forEach(type => console.log(`  • ${type}`));
      });
    }

    console.log('\n🎉 Inventory item types seeding completed!');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding
seedInventoryItemTypes().catch((error) => {
  console.error('❌ Seeding script failed:', error);
  process.exit(1);
});

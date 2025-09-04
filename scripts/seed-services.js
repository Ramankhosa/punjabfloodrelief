const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const services = [
  // Food category
  { broad_category: "Food", subcategory: "Cooked meals" },
  { broad_category: "Food", subcategory: "Dry ration kit" },

  // Hygiene (WASH) category
  { broad_category: "Hygiene (WASH)", subcategory: "Hygiene kit" },
  { broad_category: "Hygiene (WASH)", subcategory: "Sanitary pads" },

  // Shelter & NFI category
  { broad_category: "Shelter & NFI", subcategory: "Tarpaulin" },
  { broad_category: "Shelter & NFI", subcategory: "Blankets" },
  { broad_category: "Shelter & NFI", subcategory: "Sleeping mats" },

  // Medical category
  { broad_category: "Medical", subcategory: "First-aid kit" },
  { broad_category: "Medical", subcategory: "Essential medicines (basic)" },

  // Rescue & Evacuation category
  { broad_category: "Rescue & Evacuation", subcategory: "Rescue boats" },
  { broad_category: "Rescue & Evacuation", subcategory: "Life jackets" },
  { broad_category: "Rescue & Evacuation", subcategory: "Rescue ropes" },

  // De-watering & Site Safety category
  { broad_category: "De-watering & Site Safety", subcategory: "Water pumps (de-watering)" },
  { broad_category: "De-watering & Site Safety", subcategory: "Sandbags" },
  { broad_category: "De-watering & Site Safety", subcategory: "Portable lighting (lanterns)" },

  // Transport & Logistics category
  { broad_category: "Transport & Logistics", subcategory: "Delivery trucks/vans" },
  { broad_category: "Transport & Logistics", subcategory: "Fuel support" },

  // Power & Communications category
  { broad_category: "Power & Communications", subcategory: "Generators" },

  // Sanitation & Waste category
  { broad_category: "Sanitation & Waste", subcategory: "Disinfectant (bleach)" },
  { broad_category: "Sanitation & Waste", subcategory: "Waste bags/bins" },

  // Protection & Inclusion category
  { broad_category: "Protection & Inclusion", subcategory: "Help desk / registration" },
  { broad_category: "Protection & Inclusion", subcategory: "Rescue" },

  // Livestock & Animal Welfare category
  { broad_category: "Livestock & Animal Welfare", subcategory: "Animal fodder" },
  { broad_category: "Livestock & Animal Welfare", subcategory: "Veterinary first aid" },

  // Information & Coordination category
  { broad_category: "Information & Coordination", subcategory: "Helpline / IVR" },

  // Infrastructure & Access Restoration category
  { broad_category: "Infrastructure & Access Restoration", subcategory: "Debris clearing tools" }
];

async function main() {
  console.log('Seeding services...');

  for (const service of services) {
    try {
      await prisma.service.upsert({
        where: {
          broad_category_subcategory: {
            broad_category: service.broad_category,
            subcategory: service.subcategory
          }
        },
        update: {},
        create: service
      });
      console.log(`✓ Created/Updated: ${service.broad_category} - ${service.subcategory}`);
    } catch (error) {
      console.error(`✗ Failed to create service ${service.broad_category} - ${service.subcategory}:`, error);
    }
  }

  console.log('Services seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

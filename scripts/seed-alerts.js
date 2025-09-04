const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const alertCategories = [
  {
    name: 'Activation',
    description: 'Current activation status of the response',
    order_index: 1,
    statuses: [
      { name: 'Inactive', value: 'inactive', color: 'gray', order_index: 1 },
      { name: 'Monitoring', value: 'monitoring', color: 'blue', order_index: 2 },
      { name: 'Response-Active', value: 'response_active', color: 'orange', order_index: 3 },
      { name: 'Recovery', value: 'recovery', color: 'yellow', order_index: 4 },
      { name: 'Closed', value: 'closed', color: 'green', order_index: 5 }
    ]
  },
  {
    name: 'Impact Severity',
    description: 'Severity level of the impact',
    order_index: 2,
    statuses: [
      { name: 'None', value: 'none', color: 'green', order_index: 1 },
      { name: 'Minor', value: 'minor', color: 'blue', order_index: 2 },
      { name: 'Moderate', value: 'moderate', color: 'yellow', order_index: 3 },
      { name: 'Severe', value: 'severe', color: 'orange', order_index: 4 },
      { name: 'Critical', value: 'critical', color: 'red', order_index: 5 }
    ]
  },
  {
    name: 'Flood Stage',
    description: 'Current flood water level status',
    order_index: 3,
    statuses: [
      { name: 'Dry', value: 'dry', color: 'green', order_index: 1 },
      { name: 'Waterlogged', value: 'waterlogged', color: 'blue', order_index: 2 },
      { name: 'Inundated', value: 'inundated', color: 'red', order_index: 3 },
      { name: 'Receding', value: 'receding', color: 'yellow', order_index: 4 }
    ]
  },
  {
    name: 'Access/Roads',
    description: 'Road access conditions',
    order_index: 4,
    statuses: [
      { name: 'Open', value: 'open', color: 'green', order_index: 1 },
      { name: 'Limited', value: 'limited', color: 'yellow', order_index: 2 },
      { name: 'Closed', value: 'closed', color: 'red', order_index: 3 }
    ]
  },
  {
    name: 'Power',
    description: 'Electricity supply status',
    order_index: 5,
    statuses: [
      { name: 'Normal', value: 'normal', color: 'green', order_index: 1 },
      { name: 'Intermittent', value: 'intermittent', color: 'yellow', order_index: 2 },
      { name: 'Outage', value: 'outage', color: 'red', order_index: 3 }
    ]
  },
  {
    name: 'Comms (Mobile/Internet)',
    description: 'Communication network status',
    order_index: 6,
    statuses: [
      { name: 'Good', value: 'good', color: 'green', order_index: 1 },
      { name: 'Spotty', value: 'spotty', color: 'yellow', order_index: 2 },
      { name: 'No service', value: 'no_service', color: 'red', order_index: 3 }
    ]
  },
  {
    name: 'Water (Drinking)',
    description: 'Drinking water availability',
    order_index: 7,
    statuses: [
      { name: 'Adequate', value: 'adequate', color: 'green', order_index: 1 },
      { name: 'Low', value: 'low', color: 'yellow', order_index: 2 },
      { name: 'None', value: 'none', color: 'red', order_index: 3 }
    ]
  },
  {
    name: 'Food',
    description: 'Food availability and distribution',
    order_index: 8,
    statuses: [
      { name: 'Adequate', value: 'adequate', color: 'green', order_index: 1 },
      { name: 'Low', value: 'low', color: 'yellow', order_index: 2 },
      { name: 'None', value: 'none', color: 'red', order_index: 3 }
    ]
  },
  {
    name: 'Shelter/NFI',
    description: 'Shelter and non-food items availability',
    order_index: 9,
    statuses: [
      { name: 'Adequate', value: 'adequate', color: 'green', order_index: 1 },
      { name: 'Low', value: 'low', color: 'yellow', order_index: 2 },
      { name: 'None', value: 'none', color: 'red', order_index: 3 }
    ]
  },
  {
    name: 'Medical',
    description: 'Medical services and facilities status',
    order_index: 10,
    statuses: [
      { name: 'Routine', value: 'routine', color: 'green', order_index: 1 },
      { name: 'Strained', value: 'strained', color: 'yellow', order_index: 2 },
      { name: 'Acute', value: 'acute', color: 'red', order_index: 3 }
    ]
  },
  {
    name: 'Rescue Need',
    description: 'Rescue operations requirement',
    order_index: 11,
    statuses: [
      { name: 'None', value: 'none', color: 'green', order_index: 1 },
      { name: 'Standby', value: 'standby', color: 'yellow', order_index: 2 },
      { name: 'Active rescue', value: 'active_rescue', color: 'red', order_index: 3 }
    ]
  },
  {
    name: 'WASH/Sanitation',
    description: 'Water, sanitation and hygiene conditions',
    order_index: 12,
    statuses: [
      { name: 'Acceptable', value: 'acceptable', color: 'green', order_index: 1 },
      { name: 'Degraded', value: 'degraded', color: 'yellow', order_index: 2 },
      { name: 'Public health risk', value: 'public_health_risk', color: 'red', order_index: 3 }
    ]
  },
  {
    name: 'Livestock',
    description: 'Livestock welfare and conditions',
    order_index: 13,
    statuses: [
      { name: 'Stable', value: 'stable', color: 'green', order_index: 1 },
      { name: 'At risk', value: 'at_risk', color: 'yellow', order_index: 2 },
      { name: 'Critical', value: 'critical', color: 'red', order_index: 3 }
    ]
  },
  {
    name: 'Security/Safety',
    description: 'Security and safety conditions',
    order_index: 14,
    statuses: [
      { name: 'Normal', value: 'normal', color: 'green', order_index: 1 },
      { name: 'Incidents', value: 'incidents', color: 'yellow', order_index: 2 },
      { name: 'Unsafe', value: 'unsafe', color: 'red', order_index: 3 }
    ]
  },
  {
    name: 'Evacuation Status',
    description: 'Evacuation requirements and status',
    order_index: 15,
    statuses: [
      { name: 'Not required', value: 'not_required', color: 'green', order_index: 1 },
      { name: 'Advised', value: 'advised', color: 'yellow', order_index: 2 },
      { name: 'Ongoing', value: 'ongoing', color: 'orange', order_index: 3 }
    ]
  },
  {
    name: 'Relief Gap (auto-computed)',
    description: 'Auto-computed relief gap status based on other categories',
    order_index: 16,
    statuses: [
      { name: 'Green', value: 'green', color: 'green', order_index: 1 },
      { name: 'Amber', value: 'amber', color: 'yellow', order_index: 2 },
      { name: 'Red', value: 'red', color: 'red', order_index: 3 }
    ]
  },
  {
    name: 'Resource Posture (admin-set)',
    description: 'Resource allocation and posture setting',
    order_index: 17,
    statuses: [
      { name: 'Standby', value: 'standby', color: 'blue', order_index: 1 },
      { name: 'Send', value: 'send', color: 'green', order_index: 2 },
      { name: 'Surge', value: 'surge', color: 'orange', order_index: 3 },
      { name: 'Divert', value: 'divert', color: 'red', order_index: 4 }
    ]
  }
];

async function seedAlerts() {
  console.log('🚀 Starting alert system seeding...');

  try {
    for (const categoryData of alertCategories) {
      console.log(`📂 Creating category: ${categoryData.name}`);

      // Create category
      const category = await prisma.alertCategory.upsert({
        where: { name: categoryData.name },
        update: {
          description: categoryData.description,
          order_index: categoryData.order_index,
          is_active: true
        },
        create: {
          name: categoryData.name,
          description: categoryData.description,
          order_index: categoryData.order_index,
          is_active: true
        }
      });

      // Create statuses for this category
      for (const statusData of categoryData.statuses) {
        await prisma.alertStatus.upsert({
          where: {
            category_id_name: {
              category_id: category.category_id,
              name: statusData.name
            }
          },
          update: {
            value: statusData.value,
            color: statusData.color,
            order_index: statusData.order_index,
            is_active: true
          },
          create: {
            category_id: category.category_id,
            name: statusData.name,
            value: statusData.value,
            color: statusData.color,
            order_index: statusData.order_index,
            is_active: true
          }
        });

        console.log(`  ✅ Created status: ${statusData.name} (${statusData.color})`);
      }
    }

    console.log('🎉 Alert system seeding completed successfully!');

    // Print summary
    const categoryCount = await prisma.alertCategory.count();
    const statusCount = await prisma.alertStatus.count();

    console.log('\n📊 Seeding Summary:');
    console.log(`   Categories: ${categoryCount}`);
    console.log(`   Statuses: ${statusCount}`);

  } catch (error) {
    console.error('❌ Error during alert seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding
seedAlerts().catch((error) => {
  console.error('❌ Alert seeding failed:', error);
  process.exit(1);
});

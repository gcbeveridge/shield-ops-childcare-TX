require('dotenv').config();
const seedDayOne = require('./seedDayOne');
const seedWeekOne = require('./seedWeekOne');

async function seedOnboarding() {
  console.log('\n🚀 Starting Texas Childcare Onboarding Content Seeding...\n');
  
  try {
    // Seed Day One content (7 sections)
    await seedDayOne();
    
    console.log('\n' + '='.repeat(60) + '\n');
    
    // Seed Week One content (6 days)
    await seedWeekOne();
    
    console.log('\n' + '='.repeat(60));
    console.log('\n✅ ONBOARDING CONTENT SEEDING COMPLETE!\n');
    console.log('📊 Summary:');
    console.log('   • Day One Orientation: 7 sections');
    console.log('   • Week One Check-ins: 6 days (Days 2-7)');
    console.log('\n🎉 Your Texas childcare onboarding database is ready!\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Onboarding seeding failed:', error);
    process.exit(1);
  }
}

seedOnboarding();

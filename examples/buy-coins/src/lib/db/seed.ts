import { UserOperations } from './operations';

export async function seedDatabase() {
  try {
    // Create demo user if it doesn't exist
    console.log('🌱 Seeding database...');
    
    const demoUser = await UserOperations.getOrCreateDemoUser();
    console.log('✅ Demo user created/found:', demoUser.email);
    
    console.log('🎉 Database seeding completed!');
    return demoUser;
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

seedDatabase().then(() => process.exit(0)).catch(() => process.exit(1));

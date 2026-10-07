require('dotenv').config();
const mongoose = require('mongoose');
const SubscriptionTierConfig = require('../models/SubscriptionTierConfig');
const connectDB = require('../config/db');

const seedTiers = async () => {
  try {
    await connectDB();
    console.log('[Seed] Seeding subscription tiers...');

    for (const [tierKey, tierData] of Object.entries(SubscriptionTierConfig.DEFAULT_TIERS)) {
      await SubscriptionTierConfig.findOneAndUpdate(
        { tierName: tierKey },
        { $set: tierData },
        { upsert: true, new: true }
      );
      console.log(`[Seed] Seeded tier: ${tierKey}`);
    }

    console.log('[Seed] All subscription tiers seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error(`[Seed Error] ${error.message}`);
    process.exit(1);
  }
};

if (require.main === module) {
  seedTiers();
}

module.exports = seedTiers;

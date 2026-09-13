import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/user.model.js';
import Transaction from './src/models/transaction.model.js';
import { dashboardService } from './src/services/dashboard.service.js';
dotenv.config();

async function listUsers() {
  await mongoose.connect(process.env.MONGODB_URI);
  const users = await User.find({});
  console.log(`Found ${users.length} users:`);
  for (const u of users) {
    const count = await Transaction.countDocuments({ user: u._id, isDeleted: false });
    console.log(`User: ${u._id} | Email: ${u.email} | Name: ${u.name} | Active Tx Count: ${count}`);
    if (count > 20) {
      const overview = await dashboardService.getOverview(u._id.toString());
      console.log(`\nOverview for ${u.email} (${u._id}):`, JSON.stringify(overview, null, 2));
    }
  }
  await mongoose.disconnect();
}

listUsers().catch(console.error);

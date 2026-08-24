const mongoose = require('mongoose');
const dotenv = require('dotenv');
const dns = require('dns');

if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  console.warn('Could not set custom DNS servers:', e.message);
}

dotenv.config();

const auditDb = async (uri, label) => {
  console.log(`\n========================================`);
  console.log(`--- TRYING ${label} CONNECTION ---`);
  console.log(`URI: ${uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`);
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 12000 });
    console.log(`[SUCCESS] Connected to ${label}`);

    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log('Collections in DB:', collections.map((c) => c.name));

    const users = await db.collection('users').find({}).toArray();
    console.log('\n=== USERS COLLECTION (' + users.length + ' documents) ===');
    users.forEach((u, i) => {
      console.log(`[${i}] ID: ${u._id}, Email: ${u.email}, Name: ${u.name}, PlayerRef: ${u.player}`);
    });

    const players = await db.collection('players').find({}).toArray();
    console.log('\n=== PLAYERS COLLECTION (' + players.length + ' documents) ===');
    players.forEach((p, i) => {
      console.log(`[${i}] ID: ${p._id}, Name: ${p.name}, Level: ${p.level}, Exp: ${p.exp}, Gold: ${p.goldCoins}, Weight: ${p.currentWeight}/${p.targetWeight}, UserId: ${p.userId}, ClearedGates: ${p.clearedGates?.length || 0}, isSetupComplete: ${p.isSetupComplete}, isOnboarded: ${p.isOnboarded}`);
    });

    const dailyquests = await db.collection('dailyquests').find({}).toArray();
    console.log('\n=== DAILYQUESTS COLLECTION (' + dailyquests.length + ' documents) ===');
    dailyquests.slice(-5).forEach((q, i) => {
      console.log(`[${i}] ID: ${q._id}, Date: ${q.date}, Weight: ${q.nutrition?.currentWeight}, Cal: ${q.nutrition?.caloriesConsumed}, Prot: ${q.nutrition?.proteinGrams}, CustomTasks: ${q.customTasks?.length || 0}`);
    });

    await mongoose.disconnect();
    return true;
  } catch (err) {
    console.log(`[FAILED] Could not connect to ${label}:`, err.message);
    try { await mongoose.disconnect(); } catch {}
    return false;
  }
};

const run = async () => {
  const envUri = process.env.MONGO_URI;
  const localUri = 'mongodb://127.0.0.1:27017/solo-system-tracker';

  if (envUri) {
    let success = await auditDb(envUri, 'ENV MONGODB ATLAS');
    if (!success) {
      await auditDb(localUri, 'LOCAL MONGODB');
    }
  } else {
    await auditDb(localUri, 'LOCAL MONGODB');
  }
};

run();

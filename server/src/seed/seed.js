// npm run seed — creates/updates the 6 services and the first admin account. Safe to run again.
import { connectDB, disconnectDB } from '../config/db.js';
import { Service, User } from '../models/index.js';
import { normalizePhone } from '../utils/format.js';

const SERVICES = [
  { name: 'AC Repair', slug: 'ac-repair', shortDescription: 'Cooling Problem, Gas Charging', issues: ['Not cooling', 'Gas charging', 'Water leakage', 'Noise', 'PCB fault'], startingPrice: 299, sortOrder: 1 },
  { name: 'Fridge Repair', slug: 'fridge-repair', shortDescription: 'Cooling, Leakage, Compressor', issues: ['Not cooling', 'Water leakage', 'Compressor issue', 'Thermostat'], startingPrice: 249, sortOrder: 2 },
  { name: 'Geyser Repair', slug: 'geyser-repair', shortDescription: 'Heating, Thermostat, Water Leakage', issues: ['No hot water', 'Thermostat', 'Leakage', 'Tripping'], startingPrice: 199, sortOrder: 3 },
  { name: 'Washing Machine', slug: 'washing-machine-repair', shortDescription: 'Drainage, Spinning, Motor Issue', issues: ['Not draining', 'Not spinning', 'Motor issue', 'Door lock'], startingPrice: 249, sortOrder: 4 },
  { name: 'Mixer Grinder', slug: 'mixer-grinder-repair', shortDescription: 'Motor, Jar, Blade Replacement', issues: ['Motor not running', 'Jar leakage', 'Blade replacement'], startingPrice: 149, sortOrder: 5 },
  { name: 'Microwave Oven', slug: 'microwave-oven-repair', shortDescription: 'Heating, Control Panel Issue', issues: ['Not heating', 'Control panel', 'Sparking', 'Turntable'], startingPrice: 199, sortOrder: 6 },
];

async function run() {
  await connectDB();
  for (const s of SERVICES) {
    // $setOnInsert for price so re-running the seed never overwrites prices edited by the admin.
    const { startingPrice, ...rest } = s;
    await Service.updateOne({ slug: s.slug }, { $set: rest, $setOnInsert: { startingPrice, isActive: true } }, { upsert: true });
  }
  console.log(`[seed] ${SERVICES.length} services ready`);

  const { SEED_ADMIN_EMAIL: email, SEED_ADMIN_PHONE: phone, SEED_ADMIN_PASSWORD: password, SEED_ADMIN_NAME: name } = process.env;
  if (email && phone && password) {
    if (password.length < 10) throw new Error('SEED_ADMIN_PASSWORD must be at least 10 characters.');
    const exists = await User.findOne({ $or: [{ email: email.toLowerCase() }, { phone: normalizePhone(phone) }] });
    if (exists) {
      console.log('[seed] admin (or a user with that email/phone) already exists — skipped');
    } else {
      await User.create({ fullName: name || 'QuickFix Admin', email, phone: normalizePhone(phone), password, role: 'admin', isVerified: true });
      console.log(`[seed] admin created: ${email}`);
    }
  } else {
    console.log('[seed] SEED_ADMIN_* not set — no admin created');
  }

  await Promise.all([User.syncIndexes(), Service.syncIndexes()]);
  await disconnectDB();
}

run().catch(async (e) => {
  console.error('[seed] failed:', e.message);
  await disconnectDB().catch(() => {});
  process.exit(1);
});

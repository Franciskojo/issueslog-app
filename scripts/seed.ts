import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import dns from 'dns';

dns.setServers(['8.8.8.8', '1.1.1.1']);

// Read .env.local directly
try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx !== -1) {
          const key = trimmed.slice(0, eqIdx).trim();
          const val = trimmed.slice(eqIdx + 1).trim();
          if (!process.env[key]) process.env[key] = val;
        }
      }
    }
  }
} catch (e) {
  console.warn('Could not read .env.local:', e);
}

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in .env.local');
  process.exit(1);
}

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['non-tech', 'tech', 'admin'], default: 'non-tech' },
  department: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
});

const IssueSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  department: { type: String, required: true },
  priority: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' },
  status: { type: String, enum: ['Open', 'In Progress', 'Resolved', 'Closed'], default: 'Open' },
  category: { type: String, default: 'General' },
  reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  dueDate: { type: Date, default: null },
  attachments: [{ filename: String, url: String, originalName: String, size: Number, mimeType: String }],
  comments: [{
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    message: String,
    isInternal: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  }],
  statusHistory: [{
    status: String,
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    changedAt: { type: Date, default: Date.now },
    notes: String,
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Issue = mongoose.models.Issue || mongoose.model('Issue', IssueSchema);

async function seed() {
  console.log('Connecting to MongoDB Atlas...');
  await mongoose.connect(MONGODB_URI as string, {
    serverSelectionTimeoutMS: 10000,
  });
  console.log('✅ Connected to MongoDB');

  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash('admin123', salt);
  const techPasswordHash = await bcrypt.hash('tech123', salt);
  const userPasswordHash = await bcrypt.hash('user123', salt);

  // Upsert Admin user
  let admin = await User.findOne({ email: 'admin@tech.com' });
  if (!admin) {
    admin = await User.create({
      name: 'Alex Rivera (Tech Lead)',
      email: 'admin@tech.com',
      password: passwordHash,
      role: 'admin',
      department: 'IT / Tech',
    });
    console.log('✅ Created Admin user: admin@tech.com / admin123');
  } else {
    console.log('ℹ️ Admin user already exists');
  }

  // Upsert Tech member
  let dev = await User.findOne({ email: 'dev@tech.com' });
  if (!dev) {
    dev = await User.create({
      name: 'Jordan Lee (Dev Team)',
      email: 'dev@tech.com',
      password: techPasswordHash,
      role: 'tech',
      department: 'IT / Tech',
    });
    console.log('✅ Created Tech user: dev@tech.com / tech123');
  } else {
    console.log('ℹ️ Tech user already exists');
  }

  // Upsert Non-Tech user (Marketing)
  let user1 = await User.findOne({ email: 'sarah@marketing.com' });
  if (!user1) {
    user1 = await User.create({
      name: 'Sarah Connor',
      email: 'sarah@marketing.com',
      password: userPasswordHash,
      role: 'non-tech',
      department: 'Marketing',
    });
    console.log('✅ Created Non-Tech user: sarah@marketing.com / user123');
  } else {
    console.log('ℹ️ Sarah user already exists');
  }

  // Upsert Non-Tech user (Finance)
  let user2 = await User.findOne({ email: 'michael@finance.com' });
  if (!user2) {
    user2 = await User.create({
      name: 'Michael Scott',
      email: 'michael@finance.com',
      password: userPasswordHash,
      role: 'non-tech',
      department: 'Finance',
    });
    console.log('✅ Created Non-Tech user: michael@finance.com / user123');
  } else {
    console.log('ℹ️ Michael user already exists');
  }

  // Check if demo issues exist
  const count = await Issue.countDocuments();
  if (count === 0) {
    console.log('Creating sample issues...');

    await Issue.create([
      {
        title: 'ERP Invoice export failing with 500 error',
        description: 'Whenever we try to export the monthly invoice reconciliation report to PDF or CSV, the system hangs and displays a 500 server error. This is blocking month-end close for Finance.',
        department: 'Finance',
        priority: 'Critical',
        status: 'In Progress',
        category: 'Software Bug',
        reportedBy: user2._id,
        assignedTo: dev._id,
        dueDate: new Date(Date.now() + 86400000 * 2), // 2 days from now (Upcoming)
        statusHistory: [
          { status: 'Open', changedBy: user2._id, changedAt: new Date(Date.now() - 86400000), notes: 'Issue submitted' },
          { status: 'In Progress', changedBy: admin._id, changedAt: new Date(Date.now() - 43200000), notes: 'Assigned to Jordan for investigation' },
        ],
        comments: [
          {
            author: dev._id,
            message: 'Looking into memory limits on the PDF generator microservice. Reproduction confirmed.',
            isInternal: false,
            createdAt: new Date(Date.now() - 36000000),
          },
          {
            author: admin._id,
            message: 'Internal note: check node memory heap flags on worker #3',
            isInternal: true,
            createdAt: new Date(Date.now() - 30000000),
          },
        ],
      },
      {
        title: 'Marketing landing page form submission not capturing leads in CRM',
        description: 'New leads filling out the demo request form on the summer campaign page are not syncing over to Salesforce. Discovered 12 missed contacts this morning.',
        department: 'Marketing',
        priority: 'High',
        status: 'Open',
        category: 'Integration',
        reportedBy: user1._id,
        assignedTo: null,
        dueDate: new Date(Date.now() - 86400000), // 1 day ago (Overdue)
        statusHistory: [
          { status: 'Open', changedBy: user1._id, changedAt: new Date(Date.now() - 172800000), notes: 'Issue submitted' },
        ],
      },
      {
        title: 'Request dual monitors and docking station for new hire setup',
        description: 'We have a new marketing specialist joining next Monday and need two external HDMI monitors and a USB-C dock configured at desk 4B.',
        department: 'Marketing',
        priority: 'Low',
        status: 'Resolved',
        category: 'Hardware',
        reportedBy: user1._id,
        assignedTo: admin._id,
        dueDate: new Date(Date.now()), // Today
        statusHistory: [
          { status: 'Open', changedBy: user1._id, changedAt: new Date(Date.now() - 259200000), notes: 'Issue submitted' },
          { status: 'In Progress', changedBy: admin._id, changedAt: new Date(Date.now() - 172800000), notes: 'Hardware pulled from inventory' },
          { status: 'Resolved', changedBy: admin._id, changedAt: new Date(Date.now() - 86400000), notes: 'Monitors tested and installed at desk 4B' },
        ],
        comments: [
          {
            author: admin._id,
            message: 'All set! Monitored and verified working with MacBook Air and Dell XPS laptops.',
            isInternal: false,
            createdAt: new Date(Date.now() - 86400000),
          }
        ]
      }
    ]);
    console.log('✅ Created 3 demo issues');
  }

  console.log('\n🎉 Seed complete! Demo credentials:');
  console.log('----------------------------------------------------');
  console.log('👑 Admin / Tech Lead: admin@tech.com     / admin123');
  console.log('⚙️ Tech Member:       dev@tech.com       / tech123');
  console.log('🙋 Non-Tech User:     sarah@marketing.com / user123');
  console.log('🙋 Non-Tech User:     michael@finance.com / user123');
  console.log('----------------------------------------------------');

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('❌ Error during seeding:', err);
  process.exit(1);
});

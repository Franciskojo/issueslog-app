import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getSession, unauthorized } from '@/lib/session';

export async function GET(req: NextRequest) {
  const user = await getSession();
  if (!user) return unauthorized();

  await connectDB();

  const techUsers = await User.find({ role: { $in: ['tech', 'admin'] } })
    .select('name email department role')
    .lean();

  return NextResponse.json({ users: techUsers });
}

export async function PATCH(req: NextRequest) {
  const user = await getSession();
  if (!user || user.role !== 'admin') return unauthorized();

  const { userId, role } = await req.json();
  await connectDB();

  const updated = await User.findByIdAndUpdate(userId, { role }, { new: true }).select('-password');
  if (!updated) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  return NextResponse.json({ user: updated });
}

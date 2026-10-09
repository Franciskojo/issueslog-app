import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getSession, unauthorized } from '@/lib/session';

export async function GET(req: NextRequest) {
  const user = await getSession();
  if (!user) return unauthorized();

  await connectDB();

  // Admin sees all users; tech sees only tech members (for assignment)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const query: Record<string, any> = (user.role === 'admin')
    ? {}
    : { role: { $in: ['tech', 'admin'] } };

  const users = await User.find(query)
    .select('name email department role createdAt')
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json({ users });
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

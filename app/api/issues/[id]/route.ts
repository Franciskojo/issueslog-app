import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Issue from '@/models/Issue';
import { getSession, unauthorized, forbidden } from '@/lib/session';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSession();
  if (!user) return unauthorized();

  await connectDB();

  const issue = await Issue.findById(params.id).lean();
  if (!issue) return NextResponse.json({ error: 'Issue not found' }, { status: 404 });

  // Non-tech can only view their own
  if (user.role === 'non-tech' && issue.submittedBy.toString() !== user.id) {
    return forbidden();
  }

  return NextResponse.json({ issue });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSession();
  if (!user) return unauthorized();
  if (user.role === 'non-tech') return forbidden();

  try {
    const body = await req.json();
    const { status, assignedTo, assignedToName } = body;

    await connectDB();

    const issue = await Issue.findById(params.id);
    if (!issue) return NextResponse.json({ error: 'Issue not found' }, { status: 404 });

    if (status && status !== issue.status) {
      issue.status = status;
      issue.statusHistory.push({ status, changedBy: user.name, changedAt: new Date() });
    }

    if (assignedTo !== undefined) {
      issue.assignedTo = assignedTo || undefined;
      issue.assignedToName = assignedToName || undefined;
    }

    await issue.save();

    return NextResponse.json({ issue });
  } catch (error) {
    console.error('Patch issue error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSession();
  if (!user) return unauthorized();
  if (user.role !== 'tech' && user.role !== 'admin') return forbidden();

  await connectDB();

  const issue = await Issue.findByIdAndDelete(params.id);
  if (!issue) return NextResponse.json({ error: 'Issue not found' }, { status: 404 });

  return NextResponse.json({ message: 'Issue deleted' });
}

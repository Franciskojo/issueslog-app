import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';
import Issue from '@/models/Issue';
import { getSession, unauthorized, forbidden } from '@/lib/session';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession();
  if (!user) return unauthorized();

  const { id } = await params;
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: 'Invalid issue ID' }, { status: 400 });
  }

  await connectDB();

  const issue = await Issue.findById(id).lean();
  if (!issue) return NextResponse.json({ error: 'Issue not found' }, { status: 404 });

  // Non-tech can only view their own
  if (user.role === 'non-tech' && issue.submittedBy.toString() !== user.id) {
    return forbidden();
  }

  return NextResponse.json({ issue });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession();
  if (!user) return unauthorized();
  if (user.role === 'non-tech') return forbidden();

  try {
    const { id } = await params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid issue ID' }, { status: 400 });
    }

    const body = await req.json();
    const { status, assignedTo, assignedToName, priority, dueDate } = body;

    if (status && !['open', 'in-progress', 'resolved', 'closed'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }
    if (priority && !['low', 'medium', 'high', 'critical'].includes(priority)) {
      return NextResponse.json({ error: 'Invalid priority' }, { status: 400 });
    }
    if (dueDate && Number.isNaN(new Date(dueDate).getTime())) {
      return NextResponse.json({ error: 'Invalid due date' }, { status: 400 });
    }

    await connectDB();

    const issue = await Issue.findById(id);
    if (!issue) return NextResponse.json({ error: 'Issue not found' }, { status: 404 });

    if (status && status !== issue.status) {
      issue.status = status;
      issue.statusHistory.push({ status, changedBy: user.name, changedAt: new Date() });
    }

    if (assignedTo !== undefined) {
      issue.assignedTo = assignedTo || undefined;
      issue.assignedToName = assignedToName || undefined;
    }

    if (priority) issue.priority = priority;

    if (dueDate !== undefined) {
      issue.dueDate = dueDate ? new Date(dueDate) : undefined;
    }

    await issue.save();

    return NextResponse.json({ issue });
  } catch (error) {
    console.error('Patch issue error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession();
  if (!user) return unauthorized();
  if (user.role !== 'tech' && user.role !== 'admin') return forbidden();

  const { id } = await params;
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: 'Invalid issue ID' }, { status: 400 });
  }

  await connectDB();

  const issue = await Issue.findByIdAndDelete(id);
  if (!issue) return NextResponse.json({ error: 'Issue not found' }, { status: 404 });

  return NextResponse.json({ message: 'Issue deleted' });
}

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Issue from '@/models/Issue';
import { getSession, unauthorized } from '@/lib/session';

export async function GET(req: NextRequest) {
  const user = await getSession();
  if (!user) return unauthorized();

  await connectDB();

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const priority = searchParams.get('priority');
  const assignedTo = searchParams.get('assignedTo');
  const search = searchParams.get('search');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const query: Record<string, any> = {};

  // Non-tech users only see their own issues
  if (user.role === 'non-tech') {
    query.submittedBy = user.id;
  }

  if (status && status !== 'all') query.status = status;
  if (priority && priority !== 'all') query.priority = priority;
  if (assignedTo) query.assignedTo = assignedTo === 'me' ? user.id : assignedTo;
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  const total = await Issue.countDocuments(query);
  const issues = await Issue.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  return NextResponse.json({ issues, total, page, pages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user) return unauthorized();

  try {
    const body = await req.json();
    const { title, description, priority, category, attachments, dueDate } = body;

    if (!title || !description || !priority || !category) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await connectDB();

    const issue = await Issue.create({
      title,
      description,
      priority,
      category,
      submittedBy: user.id,
      submittedByName: user.name,
      submittedByDepartment: user.department,
      attachments: attachments || [],
      dueDate: dueDate ? new Date(dueDate) : undefined,
      statusHistory: [{ status: 'open', changedBy: user.name, changedAt: new Date() }],
    });

    return NextResponse.json({ issue }, { status: 201 });
  } catch (error) {
    console.error('Create issue error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Issue from '@/models/Issue';
import { getSession, unauthorized } from '@/lib/session';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSession();
  if (!user) return unauthorized();

  try {
    const { message } = await req.json();
    if (!message?.trim()) {
      return NextResponse.json({ error: 'Comment message is required' }, { status: 400 });
    }

    await connectDB();

    const issue = await Issue.findById(params.id);
    if (!issue) return NextResponse.json({ error: 'Issue not found' }, { status: 404 });

    issue.comments.push({
      author: user.id as unknown as import('mongoose').Types.ObjectId,
      authorName: user.name,
      authorRole: user.role,
      message: message.trim(),
      createdAt: new Date(),
    });

    await issue.save();

    const newComment = issue.comments[issue.comments.length - 1];
    return NextResponse.json({ comment: newComment }, { status: 201 });
  } catch (error) {
    console.error('Comment error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

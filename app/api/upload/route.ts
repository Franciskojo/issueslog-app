import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { getSession, unauthorized } from '@/lib/session';

export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user) return unauthorized();

  try {
    const formData = await req.formData();
    const files = formData.getAll('files') as File[];

    if (!files.length) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadDir, { recursive: true });

    const attachments = [];

    for (const file of files) {
      // Validate file type
      const allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf', 'text/plain',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ];
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          { error: `File type ${file.type} not allowed` },
          { status: 400 }
        );
      }

      // 10 MB max
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json({ error: 'File size exceeds 10MB limit' }, { status: 400 });
      }

      const timestamp = Date.now();
      const ext = path.extname(file.name);
      const safeName = `${timestamp}-${Math.random().toString(36).slice(2)}${ext}`;
      const filePath = path.join(uploadDir, safeName);

      const buffer = Buffer.from(await file.arrayBuffer());
      await writeFile(filePath, buffer);

      attachments.push({
        filename: safeName,
        originalName: file.name,
        mimetype: file.type,
        size: file.size,
        url: `/uploads/${safeName}`,
        uploadedAt: new Date(),
      });
    }

    return NextResponse.json({ attachments }, { status: 201 });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}

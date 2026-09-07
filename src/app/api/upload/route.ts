import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';

const proctoringCapturesTable = process.env.SUPABASE_CAPTURES_TABLE || 'proctoring_captures';
const proctoringBucket = process.env.SUPABASE_PROCTORING_BUCKET || 'exam-proctoring';

const getJwtRole = (jwt: string): string | null => {
  const parts = jwt.split('.');
  if (parts.length < 2) return null;

  try {
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf-8')) as { role?: string };
    return payload.role ?? null;
  } catch {
    return null;
  }
};

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: 'Supabase environment variables are missing' },
        { status: 500 }
      );
    }

    const keyRole = getJwtRole(serviceRoleKey);
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const formData = await request.formData();
    const imageFile = formData.get('image') as File;
    const questionNumber = formData.get('questionNumber') as string;
    const timestamp = formData.get('timestamp') as string;
    const userAgent = formData.get('userAgent') as string;

    if (!imageFile) {
      return NextResponse.json({ error: 'No image file' }, { status: 400 });
    }

    // Convert File to Buffer
    const arrayBuffer = await imageFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Compress and resize with sharp
    const processedBuffer = await sharp(buffer)
      .resize(640, 480, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 75, progressive: true })
      .toBuffer();

    // Generate unique filename
    const fileName = `captures/${uuidv4()}.jpg`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase
      .storage
      .from(proctoringBucket)
      .upload(fileName, processedBuffer, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json(
        {
          error: 'Storage upload failed',
          details: uploadError.message,
          bucket: proctoringBucket,
          table: proctoringCapturesTable,
          keyRole
        },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: publicUrlData } = supabase
      .storage
      .from(proctoringBucket)
      .getPublicUrl(fileName);

    const imageUrl = publicUrlData.publicUrl;

    const parsedQuestionNumber = Number.parseInt(questionNumber, 10);

    // Insert metadata
    const { data: insertData, error: insertError } = await supabase
      .from(proctoringCapturesTable)
      .insert({
        image_url: imageUrl,
        storage_path: fileName,
        user_agent: userAgent || 'unknown',
        question_number: Number.isNaN(parsedQuestionNumber) ? null : parsedQuestionNumber,
        captured_at: timestamp || new Date().toISOString()
      })
      .select();

    if (insertError) {
      console.error('DB insert error:', insertError);
      return NextResponse.json(
        {
          error: 'DB insert failed',
          details: insertError.message,
          table: proctoringCapturesTable,
          bucket: proctoringBucket,
          keyRole
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      imageUrl,
      captureId: insertData?.[0]?.id || 'unknown',
      table: proctoringCapturesTable,
      bucket: proctoringBucket,
      keyRole
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// App Router route handlers natively support FormData — no config needed.
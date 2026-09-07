import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import questionsData from '@/lib/uat-questions.json';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { answers, timeTaken, totalQuestions } = body;

    // Calculate score server-side
    let score = 0;
    questionsData.forEach((q) => {
      if (answers[q.id] === q.correctAnswer) {
        score += 1;
      }
    });

    if (supabase) {
      const { data, error } = await supabase
        .from('exam_results')
        .insert({
          score,
          total_questions: totalQuestions,
          time_taken: timeTaken,
          answers: answers
        })
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, resultId: data.id });
    }

    // Mock response
    console.log(`[Mock DB] Saved Result. Score: ${score}/${totalQuestions}`);
    return NextResponse.json({ success: true, resultId: 'mock-id' });

  } catch (error: any) {
    console.error('Submit error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


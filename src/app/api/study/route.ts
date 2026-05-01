import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { openingId, openingName, completed, hintsUsed, movesCorrect, totalMoves, durationMs } = body;

  const { error } = await supabase.from("study_sessions").insert({
    user_id: user.id,
    opening_id: openingId,
    opening_name: openingName,
    completed,
    hints_used: hintsUsed ?? 0,
    moves_correct: movesCorrect ?? 0,
    total_moves: totalMoves ?? 0,
    duration_ms: durationMs,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const openingId = searchParams.get("openingId");

  let query = supabase
    .from("study_sessions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (openingId) query = query.eq("opening_id", openingId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ sessions: data });
}

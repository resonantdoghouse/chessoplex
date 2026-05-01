import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { pgn, result, resultReason, difficulty, playerColor, durationMs, moveCount, openingName, annotations } = body;

  const { error } = await supabase.from("games").insert({
    user_id: user.id,
    pgn,
    result,
    result_reason: resultReason,
    difficulty,
    player_color: playerColor,
    duration_ms: durationMs,
    move_count: moveCount,
    opening_name: openingName,
    annotations,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Increment profile counters
  const winCol = result === "white" && playerColor === "w" ? "wins"
    : result === "black" && playerColor === "b" ? "wins"
    : result === "draw" ? "draws" : "losses";

  await supabase.rpc("increment_profile_stats", {
    p_user_id: user.id,
    p_win_col: winCol,
    p_duration_ms: durationMs ?? 0,
  });

  // Bump global game count
  await supabase.rpc("increment_global_games", { p_duration_ms: durationMs ?? 0 });

  return NextResponse.json({ ok: true });
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") ?? "1");
  const pageSize = 20;
  const from = (page - 1) * pageSize;

  const { data, error, count } = await supabase
    .from("games")
    .select("*", { count: "exact" })
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .range(from, from + pageSize - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ games: data, total: count, page, pageSize });
}

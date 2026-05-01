import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const body = await req.json();
  const { action, sessionId, anonymousId, durationMs, deviceType, platform } = body;

  if (action === "start") {
    const { data, error } = await supabase
      .from("play_sessions")
      .insert({
        user_id: user?.id ?? null,
        anonymous_id: user ? null : anonymousId,
        device_type: deviceType,
        platform,
      })
      .select("id")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Count unique players for global stats
    await supabase.rpc("increment_global_players_if_new", {
      p_user_id: user?.id ?? null,
      p_anonymous_id: user ? null : anonymousId,
    });

    return NextResponse.json({ sessionId: data.id });
  }

  if (action === "end" && sessionId) {
    const { error } = await supabase
      .from("play_sessions")
      .update({ ended_at: new Date().toISOString(), duration_ms: durationMs })
      .eq("id", sessionId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

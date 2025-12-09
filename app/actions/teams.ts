"use server";

import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from '@/lib/supabase-admin';
import { revalidatePath } from "next/cache";

export async function createTeam(name: string) {
    const { userId } = await auth();

    if (!userId) {
        return { error: "Not authenticated" };
    }

    // Generate a random 6-character alphanumeric code
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();

    const { data: team, error: teamError } = await supabaseAdmin
        .from("teams")
        .insert({
            name,
            code,
            created_by: userId,
        } as any)
        .select()
        .single();

    if (teamError) {
        return { error: teamError.message };
    }

    // Add creator to the team
    const { error: memberError } = await supabaseAdmin
        .from("team_members")
        .insert({
            team_id: (team as any).id,
            user_id: userId,
        } as any);

    if (memberError) {
        return { error: memberError.message };
    }

    revalidatePath("/dashboard");
    return { success: true, team };
}

export async function joinTeam(code: string) {
    const { userId } = await auth();

    if (!userId) {
        return { error: "Not authenticated" };
    }

    // Find the team by code
    const { data: team, error: teamError } = await supabaseAdmin
        .from("teams")
        .select("id")
        .eq("code", code)
        .single();

    if (teamError || !team) {
        return { error: "Invalid team code" };
    }

    // Check if already a member
    const { data: existingMember } = await supabaseAdmin
        .from("team_members")
        .select("team_id")
        .eq("team_id", (team as any).id)
        .eq("user_id", userId)
        .single();

    if (existingMember) {
        return { error: "You are already a member of this team" };
    }

    // Add user to the team
    const { error: memberError } = await supabaseAdmin
        .from("team_members")
        .insert({
            team_id: (team as any).id,
            user_id: userId,
        } as any);

    if (memberError) {
        return { error: memberError.message };
    }

    revalidatePath("/dashboard");
    return { success: true };
}

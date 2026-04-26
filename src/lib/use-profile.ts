"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-client";

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: "admin" | "manager" | "seller" | "viewer";
}

export function useProfile() {
  const supabase = createClient();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const { data } = await supabase
        .from("profiles")
        .select("id, email, full_name, role")
        .eq("id", user.id)
        .single();
      if (data) setProfile(data as UserProfile);
      setLoading(false);
    }
    load();
  }, [supabase]);

  return { profile, loading };
}

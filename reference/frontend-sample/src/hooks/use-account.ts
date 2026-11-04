import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); });
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);
  return { session, user: session?.user ?? null, ready };
}

export function useAccount() {
  const { user, ready } = useSession();
  const uid = user?.id;
  const wallet = useQuery({
    queryKey: ["wallet", uid],
    enabled: !!uid,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_my_wallet");
      if (error) throw error;
      return data as { tokens: number; plan: string | null; plan_month: string | null };
    },
  });
  const admin = useQuery({
    queryKey: ["is-admin", uid],
    enabled: !!uid,
    queryFn: async () => {
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", uid!).eq("role", "admin");
      return (data?.length ?? 0) > 0;
    },
  });
  return { user, ready, wallet: wallet.data, refetchWallet: wallet.refetch, isAdmin: !!admin.data };
}

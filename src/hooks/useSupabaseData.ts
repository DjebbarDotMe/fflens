import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useNetworks() {
  return useQuery({
    queryKey: ["networks"],
    queryFn: async () => {
      const { data, error } = await supabase.from("networks").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });
}

export function useBrands() {
  return useQuery({
    queryKey: ["brands"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("brands")
        .select("*, networks(name, slug, auth_type, url_template)")
        .order("name");
      if (error) throw error;
      return data;
    },
  });
}

export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, brands(name), networks(name, slug)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useAffiliateLinks() {
  return useQuery({
    queryKey: ["affiliate_links"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("affiliate_links")
        .select("*, products(title, brands(name)), channels(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useUserCredentials() {
  return useQuery({
    queryKey: ["user_credentials"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_credentials")
        .select("*, networks(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useChannels() {
  return useQuery({
    queryKey: ["channels"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("channels")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });
}

export function useClicksOverTime(days = 30) {
  return useQuery({
    queryKey: ["clicks_over_time", days],
    queryFn: async () => {
      const since = new Date();
      since.setDate(since.getDate() - days);

      const { data, error } = await supabase
        .from("link_clicks")
        .select("clicked_at")
        .gte("clicked_at", since.toISOString())
        .order("clicked_at", { ascending: true });
      if (error) throw error;

      // Group by date
      const counts: Record<string, number> = {};
      // Pre-fill all days with 0
      for (let i = 0; i < days; i++) {
        const d = new Date();
        d.setDate(d.getDate() - (days - 1 - i));
        const key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        counts[key] = 0;
      }
      for (const row of data || []) {
        const key = new Date(row.clicked_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
        if (key in counts) counts[key] = (counts[key] || 0) + 1;
      }

      return Object.entries(counts).map(([date, clicks]) => ({ date, clicks }));
    },
  });
}

export function useProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ["profile", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId!)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

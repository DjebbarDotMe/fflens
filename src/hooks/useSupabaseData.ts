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
        .select("*, products(title, brands(name))")
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

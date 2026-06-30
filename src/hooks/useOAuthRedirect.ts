import { useEffect } from "react";
import { App as CapacitorApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

export const useOAuthRedirect = () => {
  const navigate = useNavigate();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const authListener = CapacitorApp.addListener("appUrlOpen", async (data) => {
      // Verifica se a URL retornada é a do nosso deep link
      if (data.url.includes("br.com.foconameta.app://")) {
        const url = new URL(data.url);
        const params = new URLSearchParams(url.hash.substring(1));
        const access_token = params.get("access_token");
        const refresh_token = params.get("refresh_token");

        if (access_token && refresh_token) {
          // Define a sessão no Supabase localmente para o app nativo
          const { error } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });

          if (!error) {
            const { data: subData } = await supabase.functions.invoke("check-subscription", {
              headers: { Authorization: `Bearer ${access_token}` },
            });

            if (subData?.hasActiveSubscription) {
              navigate("/dashboard");
            } else {
              navigate("/planos");
            }
          }
        }
      }
    });

    return () => {
      authListener.then((listener) => listener.remove());
    };
  }, [navigate]);
};

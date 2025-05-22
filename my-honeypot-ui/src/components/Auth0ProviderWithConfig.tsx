"use client";
import { Auth0Provider } from "@auth0/auth0-react";
import { useRouter } from "next/navigation";
import React from "react";

export function Auth0ProviderWithConfig({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  // Use environment variables for production
  const domain = process.env.NEXT_PUBLIC_AUTH0_DOMAIN!;
  const clientId = process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID!;
  const audience = process.env.NEXT_PUBLIC_AUTH0_AUDIENCE!;

  if (!(domain && clientId && audience)) {
    throw new Error("Missing Auth0 environment variables");
  }

  return (
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: typeof window !== "undefined" ? window.location.origin : "",
        audience,
      }}
      onRedirectCallback={(appState) => {
        router.push(appState?.returnTo || "/");
      }}
      useRefreshTokens={true}
      cacheLocation="localstorage"
    >
      {children}
    </Auth0Provider>
  );
}

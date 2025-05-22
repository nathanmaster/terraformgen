"use client";
import { useAuth0 } from "@auth0/auth0-react";

export function LoginButton() {
  const { loginWithRedirect, logout, isAuthenticated, isLoading, user } = useAuth0();

  if (isLoading) return <span>Loading...</span>;

  if (!isAuthenticated) {
    return (
      <button
        className="px-4 py-2 rounded bg-primary text-white"
        onClick={() => loginWithRedirect()}
      >
        Log In
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm">Hello, {user?.name || user?.email}</span>
      <button
        className="px-3 py-1 rounded bg-secondary text-black"
        onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
      >
        Log Out
      </button>
    </div>
  );
}

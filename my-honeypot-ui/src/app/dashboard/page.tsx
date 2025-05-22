"use client";
import React, { useEffect, useState } from "react";
import { useApi } from "@/utils/api";
import { useAuth0 } from "@auth0/auth0-react";

type Honeypot = {
  id: number;
  region: string;
  instance_type: string;
  cowrie_config: string;
  outputs: any;
  status: string;
};

export default function DashboardPage() {
  const { get } = useApi();
  const { isAuthenticated, isLoading } = useAuth0();
  const [honeypots, setHoneypots] = useState<Honeypot[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    get("/honeypots")
      .then(setHoneypots)
      .catch((err) => setError(err.message || "Failed to load honeypots"));
    // eslint-disable-next-line
  }, [isAuthenticated]);

  if (isLoading) return <div>Loading...</div>;
  if (!isAuthenticated) return <div>Please log in to view your dashboard.</div>;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Your Honeypots</h1>
      {error && <div className="text-red-500 mb-2">{error}</div>}
      {honeypots.length === 0 ? (
        <div>No honeypots found.</div>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="border-b p-2 text-left">Region</th>
              <th className="border-b p-2 text-left">Instance Type</th>
              <th className="border-b p-2 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {honeypots.map((h) => (
              <tr key={h.id}>
                <td className="border-b p-2">{h.region}</td>
                <td className="border-b p-2">{h.instance_type}</td>
                <td className="border-b p-2">{h.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

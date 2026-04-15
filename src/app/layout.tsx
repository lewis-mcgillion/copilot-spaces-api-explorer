import type { Metadata } from "next";
import "./globals.css";
import { ClientLayout } from "./client-layout";

export const metadata: Metadata = {
  title: "Copilot Spaces Explorer",
  description: "Test and explore the Copilot Spaces REST API",
};

const TOKEN = process.env.NEXT_PUBLIC_GITHUB_TOKEN ?? "";
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://api.github.com";

async function fetchInitData() {
  if (!TOKEN) return { user: null, orgs: [] };
  const headers = {
    Authorization: `Bearer ${TOKEN}`,
    Accept: "application/json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  try {
    const [userRes, orgsRes] = await Promise.all([
      fetch(`${BASE_URL}/user`, { headers, cache: "no-store" }),
      fetch(`${BASE_URL}/user/orgs`, { headers, cache: "no-store" }),
    ]);
    if (!userRes.ok) return { user: null, orgs: [], error: `Token failed: ${userRes.status}` };
    const user = await userRes.json();
    const orgs = orgsRes.ok ? await orgsRes.json() : [];
    return { user, orgs };
  } catch (e) {
    return { user: null, orgs: [], error: String(e) };
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const initData = await fetchInitData();

  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif' }}>
        <ClientLayout initUser={initData.user} initOrgs={initData.orgs} initError={initData.error}>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}

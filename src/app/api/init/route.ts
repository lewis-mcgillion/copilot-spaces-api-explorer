import { NextResponse } from "next/server";

const TOKEN = process.env.NEXT_PUBLIC_GITHUB_TOKEN ?? "";
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://api.github.com";

export async function GET() {
  if (!TOKEN) {
    return NextResponse.json({ error: "No token configured" }, { status: 401 });
  }

  const headers = {
    Authorization: `Bearer ${TOKEN}`,
    Accept: "application/json",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  try {
    const [userRes, orgsRes] = await Promise.all([
      fetch(`${BASE_URL}/user`, { headers }),
      fetch(`${BASE_URL}/user/orgs`, { headers }),
    ]);

    if (!userRes.ok) {
      return NextResponse.json(
        { error: `Token verification failed: ${userRes.status}` },
        { status: userRes.status }
      );
    }

    const user = await userRes.json();
    const orgs = orgsRes.ok ? await orgsRes.json() : [];

    return NextResponse.json({ user, orgs });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Verification failed" },
      { status: 500 }
    );
  }
}

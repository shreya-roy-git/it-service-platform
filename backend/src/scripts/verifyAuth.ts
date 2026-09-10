import type { Server } from "http";
import { app } from "../app.js";
import { prisma } from "../config/prisma.js";

async function runVerification() {
  console.log("--- Starting End-to-End Auth Verification ---");

  const server: Server = await new Promise((resolve) => {
    const s = app.listen(4001, () => resolve(s));
  });

  const baseUrl = "http://localhost:4001";

  try {
    // 1. Health check (Public)
    console.log("\n1. Testing GET /api/health (Public)");
    const resHealth = await fetch(`${baseUrl}/api/health`);
    console.log(`Status: ${resHealth.status}`);
    const healthJson = await resHealth.json();
    console.log("Response:", healthJson);
    if (resHealth.status !== 200) throw new Error("Health check failed");

    // 2. Unauthenticated GET /api/tickets (Should be 401)
    console.log("\n2. Testing unauthenticated GET /api/tickets (Should return 401)");
    const resUnauthTickets = await fetch(`${baseUrl}/api/tickets`);
    console.log(`Status: ${resUnauthTickets.status}`);
    const unauthJson = await resUnauthTickets.json();
    console.log("Response:", unauthJson);
    if (resUnauthTickets.status !== 401) throw new Error("Unauthenticated tickets check failed");

    // 3. Login with Invalid Credentials (Should be 401)
    console.log("\n3. Testing POST /api/auth/login with invalid credentials (Should return 401)");
    const resBadLogin = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "manager@example.test", password: "WrongPassword" }),
    });
    console.log(`Status: ${resBadLogin.status}`);
    const badLoginJson = await resBadLogin.json();
    console.log("Response:", badLoginJson);
    if (resBadLogin.status !== 401) throw new Error("Invalid credentials check failed");

    interface AuthResponse {
      success: boolean;
      data?: {
        token?: string;
        user?: {
          id: string;
          email: string;
          passwordHash?: string;
          role?: { name: string };
        };
      };
    }

    interface MeResponse {
      success: boolean;
      data?: {
        id: string;
        email: string;
      };
    }

    interface TicketsResponse {
      success: boolean;
      data?: unknown[];
    }

    // 4. Login with Valid Credentials (Manager)
    console.log("\n4. Testing POST /api/auth/login with valid Manager credentials (Should return 200)");
    const resManagerLogin = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "manager@example.test", password: "Manager@123" }),
    });
    console.log(`Status: ${resManagerLogin.status}`);
    const managerLoginJson = (await resManagerLogin.json()) as AuthResponse;
    console.log("Response user:", managerLoginJson.data?.user);
    if (resManagerLogin.status !== 200 || !managerLoginJson.data?.token) throw new Error("Manager login failed");
    if (managerLoginJson.data?.user?.passwordHash) throw new Error("Security leak: passwordHash exposed!");

    const managerToken = managerLoginJson.data.token;

    // 5. GET /api/auth/me (Authenticated)
    console.log("\n5. Testing GET /api/auth/me with Bearer token (Should return 200)");
    const resMe = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${managerToken}` },
    });
    console.log(`Status: ${resMe.status}`);
    const meJson = (await resMe.json()) as MeResponse;
    console.log("Response data:", meJson.data);
    if (resMe.status !== 200 || meJson.data?.email !== "manager@example.test") throw new Error("GET /api/auth/me failed");

    // 6. Authenticated GET /api/tickets
    console.log("\n6. Testing authenticated GET /api/tickets (Should return 200)");
    const resAuthTickets = await fetch(`${baseUrl}/api/tickets`, {
      headers: { Authorization: `Bearer ${managerToken}` },
    });
    console.log(`Status: ${resAuthTickets.status}`);
    const ticketsJson = (await resAuthTickets.json()) as TicketsResponse;
    console.log(`Tickets count: ${ticketsJson.data?.length}`);
    if (resAuthTickets.status !== 200 || !Array.isArray(ticketsJson.data)) throw new Error("Authenticated tickets failed");

    // 7. Test Analyst Login & role check
    console.log("\n7. Testing POST /api/auth/login with valid Analyst credentials");
    const resAnalystLogin = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "analyst@example.test", password: "Analyst@123" }),
    });
    console.log(`Status: ${resAnalystLogin.status}`);
    const analystLoginJson = (await resAnalystLogin.json()) as AuthResponse;
    console.log("Response user role:", analystLoginJson.data?.user?.role?.name);
    if (resAnalystLogin.status !== 200) throw new Error("Analyst login failed");

    // 8. Logout Endpoint
    console.log("\n8. Testing POST /api/auth/logout");
    const resLogout = await fetch(`${baseUrl}/api/auth/logout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${managerToken}` },
    });
    console.log(`Status: ${resLogout.status}`);
    const logoutJson = await resLogout.json();
    console.log("Response:", logoutJson);
    if (resLogout.status !== 200) throw new Error("Logout endpoint failed");

    console.log("\n✅ ALL VERIFICATION TESTS PASSED SUCCESSFULLY!");
  } finally {
    server.close();
    await prisma.$disconnect();
  }
}

runVerification().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});

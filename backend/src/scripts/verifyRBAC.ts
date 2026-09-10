import { prisma } from "../config/prisma.js";

interface LoginResponse {
  data?: { token?: string };
}

interface FormOptionsResponse {
  data?: {
    projects?: Array<{ id: string }>;
    users?: Array<{ id: string }>;
  };
}

interface TicketMutationResponse {
  data?: {
    id: string;
    status: string;
  };
}

interface GenericApiResponse {
  success: boolean;
  message?: string;
}

async function runVerification() {
  console.log("--- Starting Backend RBAC Verification ---");

  const baseUrl = "http://localhost:4000";

  // 1. GET /api/health (Public access without authentication)
  console.log("\n1. Testing GET /api/health (Public access without authentication)");
  const resHealth = await fetch(`${baseUrl}/api/health`);
  console.log(`Status: ${resHealth.status}`);
  if (resHealth.status !== 200) throw new Error("GET /api/health failed");

  // 2. Unauthenticated GET /api/tickets (Should return 401 Unauthorized)
  console.log("\n2. Testing unauthenticated GET /api/tickets (Should return 401)");
  const resUnauth = await fetch(`${baseUrl}/api/tickets`);
  console.log(`Status: ${resUnauth.status}`);
  const unauthJson = (await resUnauth.json()) as GenericApiResponse;
  console.log("Response:", unauthJson);
  if (resUnauth.status !== 401) throw new Error("Unauthenticated check failed");

  // 3. Log in as Administrator (manager@example.test / Manager@123)
  console.log("\n3. Testing Administrator login & permissions");
  const resAdminLogin = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "manager@example.test", password: "Manager@123" }),
  });
  const adminLoginData = (await resAdminLogin.json()) as LoginResponse;
  const adminToken = adminLoginData.data?.token;
  if (!adminToken) throw new Error("Administrator login failed");

  const adminHeaders = { Authorization: `Bearer ${adminToken}` };
  const resAdminMe = await fetch(`${baseUrl}/api/auth/me`, { headers: adminHeaders });
  console.log(`GET /api/auth/me (Admin) status: ${resAdminMe.status}`);
  if (resAdminMe.status !== 200) throw new Error("Admin /me failed");

  const resAdminTickets = await fetch(`${baseUrl}/api/tickets`, { headers: adminHeaders });
  console.log(`GET /api/tickets (Admin) status: ${resAdminTickets.status}`);
  if (resAdminTickets.status !== 200) throw new Error("Admin /tickets failed");

  // 4. Log in as Service Desk Analyst (analyst@example.test / Analyst@123)
  console.log("\n4. Testing Service Desk Analyst login & permissions");
  const resAnalystLogin = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "analyst@example.test", password: "Analyst@123" }),
  });
  const analystLoginData = (await resAnalystLogin.json()) as LoginResponse;
  const analystToken = analystLoginData.data?.token;
  if (!analystToken) throw new Error("Analyst login failed");

  const analystHeaders = { Authorization: `Bearer ${analystToken}` };
  const resAnalystMe = await fetch(`${baseUrl}/api/auth/me`, { headers: analystHeaders });
  console.log(`GET /api/auth/me (Analyst) status: ${resAnalystMe.status}`);
  if (resAnalystMe.status !== 200) throw new Error("Analyst /me failed");

  const resAnalystTickets = await fetch(`${baseUrl}/api/tickets`, { headers: analystHeaders });
  console.log(`GET /api/tickets (Analyst) status: ${resAnalystTickets.status}`);
  if (resAnalystTickets.status !== 200) throw new Error("Analyst /tickets failed");

  // 5. Test Analyst creating and updating a ticket
  console.log("\n5. Testing Analyst creating (POST) and updating (PATCH) tickets");
  const formOptRes = await fetch(`${baseUrl}/api/tickets/form-options`, { headers: analystHeaders });
  const formOptData = (await formOptRes.json()) as FormOptionsResponse;
  const projectId = formOptData.data?.projects?.[0]?.id;
  const creatorId = formOptData.data?.users?.[0]?.id;

  const createRes = await fetch(`${baseUrl}/api/tickets`, {
    method: "POST",
    headers: { ...analystHeaders, "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "Analyst RBAC ticket test",
      description: "Testing Analyst ticket creation",
      projectId,
      creatorId,
      priority: "MEDIUM",
      status: "OPEN",
    }),
  });
  const createData = (await createRes.json()) as TicketMutationResponse;
  console.log(`POST /api/tickets (Analyst) status: ${createRes.status}, Ticket ID: ${createData.data?.id}`);
  if (createRes.status !== 201 || !createData.data?.id) throw new Error("Analyst ticket creation failed");

  const ticketId = createData.data.id;
  const patchRes = await fetch(`${baseUrl}/api/tickets/${ticketId}`, {
    method: "PATCH",
    headers: { ...analystHeaders, "Content-Type": "application/json" },
    body: JSON.stringify({ status: "IN_PROGRESS" }),
  });
  const patchData = (await patchRes.json()) as TicketMutationResponse;
  console.log(`PATCH /api/tickets/:id (Analyst) status: ${patchRes.status}, Updated status: ${patchData.data?.status}`);
  if (patchRes.status !== 200 || patchData.data?.status !== "IN_PROGRESS") throw new Error("Analyst ticket update failed");

  // 6. Test 403 Forbidden handling with admin-only route
  console.log("\n6. Testing HTTP 403 Forbidden for restricted roles");
  const resForbidden = await fetch(`${baseUrl}/api/admin-only`, { headers: analystHeaders });
  console.log(`Analyst calling /api/admin-only status: ${resForbidden.status}`);
  const forbiddenJson = (await resForbidden.json()) as GenericApiResponse;
  console.log("Response:", forbiddenJson);
  if (resForbidden.status !== 403 || forbiddenJson.success !== false) {
    throw new Error("403 Forbidden check failed");
  }

  const resAllowedAdmin = await fetch(`${baseUrl}/api/admin-only`, { headers: adminHeaders });
  console.log(`Admin calling /api/admin-only status: ${resAllowedAdmin.status}`);
  if (resAllowedAdmin.status !== 200) {
    throw new Error("Admin route access failed");
  }

  console.log("\n✅ ALL BACKEND RBAC VERIFICATION TESTS PASSED SUCCESSFULLY!");
  await prisma.$disconnect();
}

runVerification().catch((err) => {
  console.error("RBAC Verification Error:", err);
  process.exit(1);
});

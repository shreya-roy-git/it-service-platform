import { prisma } from "../config/prisma.js";

interface LoginResponse {
  data?: { token?: string };
}

interface TicketsQueryResponse {
  success: boolean;
  data?: Array<{ id: string; status: string }>;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
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

async function runVerification() {
  console.log("--- Starting Tickets Query & Filtering Verification ---");

  // First, obtain auth token by logging in as manager
  const loginRes = await fetch("http://localhost:4000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "manager@example.test", password: "Manager@123" }),
  });
  const loginData = (await loginRes.json()) as LoginResponse;
  const token = loginData.data?.token;
  if (!token) throw new Error("Failed to authenticate test script");

  const headers = { Authorization: `Bearer ${token}` };

  // 1. GET /api/tickets (default)
  console.log("\n1. Testing GET /api/tickets (default pagination & sorting)");
  const res1 = await fetch("http://localhost:4000/api/tickets", { headers });
  const data1 = (await res1.json()) as TicketsQueryResponse;
  console.log(`Status: ${res1.status}, Returned ${data1.data?.length} items.`);
  console.log("Pagination metadata:", data1.pagination);
  if (res1.status !== 200 || !data1.pagination || data1.pagination.page !== 1 || data1.pagination.limit !== 10) {
    throw new Error("Default GET /api/tickets failed");
  }

  // 2. GET /api/tickets?search=VPN
  console.log("\n2. Testing GET /api/tickets?search=VPN");
  const res2 = await fetch("http://localhost:4000/api/tickets?search=VPN", { headers });
  const data2 = (await res2.json()) as TicketsQueryResponse;
  console.log(`Status: ${res2.status}, Returned ${data2.data?.length} items matching 'VPN'.`);
  console.log("Pagination:", data2.pagination);
  if (res2.status !== 200 || !Array.isArray(data2.data)) {
    throw new Error("Search GET /api/tickets?search=VPN failed");
  }

  // 3. GET /api/tickets?status=OPEN
  console.log("\n3. Testing GET /api/tickets?status=OPEN");
  const res3 = await fetch("http://localhost:4000/api/tickets?status=OPEN", { headers });
  const data3 = (await res3.json()) as TicketsQueryResponse;
  console.log(`Status: ${res3.status}, Returned ${data3.data?.length} items with status OPEN.`);
  if (res3.status !== 200) throw new Error("Status filter failed");

  // 4. GET /api/tickets?priority=HIGH
  console.log("\n4. Testing GET /api/tickets?priority=HIGH");
  const res4 = await fetch("http://localhost:4000/api/tickets?priority=HIGH", { headers });
  const data4 = (await res4.json()) as TicketsQueryResponse;
  console.log(`Status: ${res4.status}, Returned ${data4.data?.length} items with priority HIGH.`);
  if (res4.status !== 200) throw new Error("Priority filter failed");

  // 5. GET /api/tickets?page=1&limit=10
  console.log("\n5. Testing GET /api/tickets?page=1&limit=10");
  const res5 = await fetch("http://localhost:4000/api/tickets?page=1&limit=10", { headers });
  const data5 = (await res5.json()) as TicketsQueryResponse;
  console.log(`Status: ${res5.status}, Limit: ${data5.pagination?.limit}, Page: ${data5.pagination?.page}`);
  if (res5.status !== 200 || data5.pagination?.limit !== 10) throw new Error("Pagination failed");

  // 6. GET /api/tickets?sortBy=createdAt&sortOrder=desc
  console.log("\n6. Testing GET /api/tickets?sortBy=createdAt&sortOrder=desc");
  const res6 = await fetch("http://localhost:4000/api/tickets?sortBy=createdAt&sortOrder=desc", { headers });
  const data6 = (await res6.json()) as TicketsQueryResponse;
  console.log(`Status: ${res6.status}, Returned ${data6.data?.length} items sorted by createdAt desc.`);
  if (res6.status !== 200) throw new Error("Sorting failed");

  // 7. GET /api/tickets?search=VPN&status=IN_PROGRESS&page=1&limit=10
  console.log("\n7. Testing GET /api/tickets?search=VPN&status=IN_PROGRESS&page=1&limit=10");
  const res7 = await fetch("http://localhost:4000/api/tickets?search=VPN&status=IN_PROGRESS&page=1&limit=10", { headers });
  const data7 = (await res7.json()) as TicketsQueryResponse;
  console.log(`Status: ${res7.status}, Combined filter returned ${data7.data?.length} items.`);
  if (res7.status !== 200) throw new Error("Combined query failed");

  // 8. Testing Validation of invalid parameters (Should return 400)
  console.log("\n8. Testing invalid query parameters (Should return 400 Bad Request)");
  const resBad1 = await fetch("http://localhost:4000/api/tickets?status=INVALID_STATUS", { headers });
  console.log(`Invalid status status code: ${resBad1.status}`);
  if (resBad1.status !== 400) throw new Error("Invalid status validation failed");

  const resBad2 = await fetch("http://localhost:4000/api/tickets?sortBy=invalidField", { headers });
  console.log(`Invalid sortBy status code: ${resBad2.status}`);
  if (resBad2.status !== 400) throw new Error("Invalid sortBy validation failed");

  // 9. Verify ticket creation (POST /api/tickets) & update (PATCH /api/tickets/:id) still work
  console.log("\n9. Verifying POST /api/tickets and PATCH /api/tickets/:id still work");
  const formOptRes = await fetch("http://localhost:4000/api/tickets/form-options", { headers });
  const formOptData = (await formOptRes.json()) as FormOptionsResponse;
  const projectId = formOptData.data?.projects?.[0]?.id;
  const creatorId = formOptData.data?.users?.[0]?.id;

  const createRes = await fetch("http://localhost:4000/api/tickets", {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "Test query validation ticket",
      description: "Testing API compatibility",
      projectId,
      creatorId,
      priority: "MEDIUM",
      status: "OPEN",
    }),
  });
  const createData = (await createRes.json()) as TicketMutationResponse;
  console.log(`POST /api/tickets status: ${createRes.status}, Ticket ID: ${createData.data?.id}`);
  if (createRes.status !== 201 || !createData.data?.id) throw new Error("POST /api/tickets failed");

  const createdId = createData.data.id;
  const patchRes = await fetch(`http://localhost:4000/api/tickets/${createdId}`, {
    method: "PATCH",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ status: "IN_PROGRESS" }),
  });
  const patchData = (await patchRes.json()) as TicketMutationResponse;
  console.log(`PATCH /api/tickets/:id status: ${patchRes.status}, Updated status: ${patchData.data?.status}`);
  if (patchRes.status !== 200 || patchData.data?.status !== "IN_PROGRESS") throw new Error("PATCH /api/tickets/:id failed");

  console.log("\n✅ ALL TICKETS QUERY & FILTERING TESTS PASSED!");
  await prisma.$disconnect();
}

runVerification().catch((err) => {
  console.error("Verification error:", err);
  process.exit(1);
});

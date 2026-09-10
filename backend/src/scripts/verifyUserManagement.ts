import { prisma } from "../config/prisma.js";

const BASE_URL = "http://localhost:4000/api";

interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}

async function runVerification() {
  console.log("=== Starting User Management API Verification ===");

  // 1. Health check
  const healthRes = await fetch(`${BASE_URL}/health`);
  console.log(`1. GET /api/health: ${healthRes.status} (Expected 200)`);
  if (healthRes.status !== 200) throw new Error("Health check failed");

  // 2. Login as Analyst
  const analystLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "analyst@example.test", password: "Analyst@123" }),
  });
  const analystLoginData = (await analystLoginRes.json()) as ApiResponse<{ token: string }>;
  const analystToken = analystLoginData.data?.token;
  if (!analystToken) throw new Error("Analyst login failed");
  console.log("2. Analyst login successful");

  // 3. Login as Administrator
  const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "manager@example.test", password: "Manager@123" }),
  });
  const adminLoginData = (await adminLoginRes.json()) as ApiResponse<{ token: string; user: { id: string } }>;
  const adminToken = adminLoginData.data?.token;
  const adminUserId = adminLoginData.data?.user.id;
  if (!adminToken || !adminUserId) throw new Error("Administrator login failed");
  console.log("3. Administrator login successful");

  // 4. Unauthenticated GET /api/users -> 401
  const unauthRes = await fetch(`${BASE_URL}/users`);
  console.log(`4. Unauthenticated GET /api/users: ${unauthRes.status} (Expected 401)`);
  if (unauthRes.status !== 401) throw new Error("Unauthenticated check failed");

  // 5. Analyst GET /api/users -> 403
  const analystGetRes = await fetch(`${BASE_URL}/users`, {
    headers: { Authorization: `Bearer ${analystToken}` },
  });
  console.log(`5. Analyst GET /api/users: ${analystGetRes.status} (Expected 403)`);
  if (analystGetRes.status !== 403) throw new Error("Analyst RBAC check failed on GET");

  // 6. Analyst POST /api/users -> 403
  const analystPostRes = await fetch(`${BASE_URL}/users`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${analystToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      firstName: "Unauthorized",
      lastName: "User",
      email: "unauth@example.test",
      password: "Test@123",
      role: "Service Desk Analyst",
    }),
  });
  console.log(`6. Analyst POST /api/users: ${analystPostRes.status} (Expected 403)`);
  if (analystPostRes.status !== 403) throw new Error("Analyst RBAC check failed on POST");

  // 7. Administrator GET /api/users -> 200
  const adminGetRes = await fetch(`${BASE_URL}/users`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const usersData = (await adminGetRes.json()) as ApiResponse<Array<Record<string, unknown>>>;
  console.log(`7. Administrator GET /api/users: ${adminGetRes.status} (Expected 200, count=${usersData.data?.length})`);
  if (adminGetRes.status !== 200 || !Array.isArray(usersData.data)) throw new Error("Admin list users failed");
  
  // Verify no password/passwordHash fields exist
  for (const u of usersData.data) {
    if ("password" in u || "passwordHash" in u) {
      throw new Error(`Security breach: passwordHash exposed in user object ${u.id}`);
    }
  }
  console.log("   - Security verification passed: passwordHash is not exposed");

  // 8. Administrator GET /api/users/:id -> 200
  const adminGetUserRes = await fetch(`${BASE_URL}/users/${adminUserId}`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const singleUserData = (await adminGetUserRes.json()) as ApiResponse<Record<string, unknown>>;
  console.log(`8. Administrator GET /api/users/${adminUserId}: ${adminGetUserRes.status} (Expected 200)`);
  if (adminGetUserRes.status !== 200 || "passwordHash" in (singleUserData.data ?? {})) {
    throw new Error("Get user by ID failed or exposed passwordHash");
  }

  // 9. Administrator GET /api/users/non-existent-id -> 404
  const notFoundRes = await fetch(`${BASE_URL}/users/invalid-cuid-12345`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  console.log(`9. GET /api/users/invalid-cuid-12345: ${notFoundRes.status} (Expected 404)`);
  if (notFoundRes.status !== 404) throw new Error("Non-existent user check failed");

  // 10. POST /api/users invalid role -> 400
  const invalidRoleRes = await fetch(`${BASE_URL}/users`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${adminToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      firstName: "Bad",
      lastName: "Role",
      email: "badrole@example.test",
      password: "Test@123",
      role: "SuperUser",
    }),
  });
  console.log(`10. POST /api/users with invalid role: ${invalidRoleRes.status} (Expected 400)`);
  if (invalidRoleRes.status !== 400) throw new Error("Invalid role validation failed");

  // 11. POST /api/users create valid user -> 201
  const testEmail = `newuser_${Date.now()}@example.test`;
  const createUserRes = await fetch(`${BASE_URL}/users`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${adminToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      firstName: "Taylor",
      lastName: "Swift",
      email: testEmail,
      password: "Test@123",
      role: "Service Desk Analyst",
    }),
  });
  const createdUserData = (await createUserRes.json()) as ApiResponse<{ id: string; email: string; role: string }>;
  console.log(`11. POST /api/users create user: ${createUserRes.status} (Expected 201)`);
  if (createUserRes.status !== 201 || !createdUserData.data?.id) throw new Error("Create user failed");
  const createdUserId = createdUserData.data.id;

  // 12. POST /api/users duplicate email -> 400
  const duplicateEmailRes = await fetch(`${BASE_URL}/users`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${adminToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      firstName: "Duplicate",
      lastName: "Email",
      email: testEmail,
      password: "Test@123",
      role: "Service Desk Analyst",
    }),
  });
  console.log(`12. POST /api/users duplicate email: ${duplicateEmailRes.status} (Expected 400)`);
  if (duplicateEmailRes.status !== 400) throw new Error("Duplicate email validation failed");

  // 13. PATCH /api/users/:id update user -> 200
  const patchUserRes = await fetch(`${BASE_URL}/users/${createdUserId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${adminToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      firstName: "TaylorUpdated",
      role: "Administrator",
    }),
  });
  const patchedUserData = (await patchUserRes.json()) as ApiResponse<{ firstName: string; role: string }>;
  console.log(`13. PATCH /api/users/${createdUserId}: ${patchUserRes.status} (Expected 200, role=${patchedUserData.data?.role})`);
  if (patchUserRes.status !== 200 || patchedUserData.data?.firstName !== "TaylorUpdated" || patchedUserData.data?.role !== "Administrator") {
    throw new Error("Patch user failed");
  }

  // 14. Self-role demotion protection check -> 400
  const selfDemoteRes = await fetch(`${BASE_URL}/users/${adminUserId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${adminToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      role: "Service Desk Analyst",
    }),
  });
  console.log(`14. Administrator self-demotion attempt: ${selfDemoteRes.status} (Expected 400)`);
  if (selfDemoteRes.status !== 400) throw new Error("Self-demotion protection failed");

  // Cleanup test user
  await prisma.user.delete({ where: { id: createdUserId } });
  console.log("15. Cleaned up test user from database");

  console.log("=== All User Management Verification Tests Passed Successfully ===");
}

runVerification()
  .catch((err) => {
    console.error("Verification failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

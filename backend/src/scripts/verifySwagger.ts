const BASE_URL = "http://localhost:4000";

interface SwaggerSpec {
  openapi: string;
  info: { title: string; version: string; description: string };
  components?: {
    securitySchemes?: {
      bearerAuth?: {
        type: string;
        scheme: string;
        bearerFormat: string;
      };
    };
  };
  paths: Record<string, Record<string, unknown>>;
}

async function verifySwagger() {
  console.log("=== Starting Swagger / OpenAPI Verification ===");

  // 1. Verify Swagger UI Endpoint (HTML)
  const docsRes = await fetch(`${BASE_URL}/api-docs/`);
  console.log(`1. GET /api-docs/: ${docsRes.status} (Expected 200)`);
  if (docsRes.status !== 200) throw new Error("Swagger UI endpoint failed");
  const docsHtml = await docsRes.text();
  if (!docsHtml.includes("swagger-ui") && !docsHtml.includes("SwaggerUIBundle")) {
    throw new Error("Swagger UI HTML missing expected elements");
  }
  console.log("   - Swagger UI HTML served successfully");

  // 2. Verify Raw OpenAPI Spec JSON Endpoint
  const specRes = await fetch(`${BASE_URL}/api-docs/swagger.json`);
  console.log(`2. GET /api-docs/swagger.json: ${specRes.status} (Expected 200)`);
  if (specRes.status !== 200) throw new Error("Swagger JSON spec endpoint failed");
  const spec = (await specRes.json()) as SwaggerSpec;

  if (spec.openapi !== "3.0.0") throw new Error(`Unexpected OpenAPI version: ${spec.openapi}`);
  if (spec.info.title !== "IT Service Platform API") throw new Error(`Unexpected title: ${spec.info.title}`);
  if (spec.info.version !== "1.0.0") throw new Error(`Unexpected version: ${spec.info.version}`);

  console.log("   - OpenAPI 3.0.0 Metadata validated");

  // 3. Verify Bearer JWT Security Scheme
  const bearerScheme = spec.components?.securitySchemes?.bearerAuth;
  if (!bearerScheme || bearerScheme.type !== "http" || bearerScheme.scheme !== "bearer") {
    throw new Error("bearerAuth security scheme invalid or missing");
  }
  console.log("   - Bearer JWT security scheme validated");

  // 4. Verify Documented Paths
  const expectedPaths = [
    "/api/health",
    "/api/admin-only",
    "/api/auth/login",
    "/api/auth/me",
    "/api/auth/logout",
    "/api/tickets",
    "/api/tickets/summary",
    "/api/tickets/form-options",
    "/api/tickets/{id}",
    "/api/users",
    "/api/users/{id}",
  ];

  const pathKeys = Object.keys(spec.paths);
  console.log(`3. Validating documented paths (found ${pathKeys.length} paths):`);

  for (const expected of expectedPaths) {
    if (!spec.paths[expected]) {
      throw new Error(`Missing expected path in Swagger spec: ${expected}`);
    }
    console.log(`   - Verified path: ${expected}`);
  }

  console.log("=== All Swagger / OpenAPI Verification Tests Passed Successfully ===");
}

verifySwagger().catch((err) => {
  console.error("Swagger verification failed:", err);
  process.exit(1);
});

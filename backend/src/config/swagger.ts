import swaggerJSDoc from "swagger-jsdoc";

export const swaggerSpec = swaggerJSDoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "IT Service Platform API",
      version: "1.0.0",
      description: "REST API for the IT Service Platform",
    },
    servers: [
      {
        url: "http://localhost:4000",
        description: "Development server",
      },
    ],
    tags: [
      { name: "Health", description: "System health and status endpoints" },
      { name: "Authentication", description: "User authentication endpoints" },
      { name: "Tickets", description: "Ticket management endpoints" },
      { name: "Users", description: "User management endpoints (Administrator only)" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter your JWT Bearer token obtained from POST /api/auth/login",
        },
      },
      schemas: {
        ErrorResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            message: { type: "string", example: "Authentication required." },
          },
        },
        UserRef: {
          type: "object",
          properties: {
            id: { type: "string" },
            firstName: { type: "string" },
            lastName: { type: "string" },
          },
        },
        ProjectRef: {
          type: "object",
          properties: {
            id: { type: "string" },
            key: { type: "string" },
            name: { type: "string" },
          },
        },
        User: {
          type: "object",
          properties: {
            id: { type: "string", example: "cmttsmde30003q9saa1h3xtat" },
            firstName: { type: "string", example: "Morgan" },
            lastName: { type: "string", example: "Reed" },
            email: { type: "string", example: "manager@example.test" },
            role: { type: "string", example: "Administrator" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        Ticket: {
          type: "object",
          properties: {
            id: { type: "string", example: "cmttsmde70005q9sae5r2e811" },
            ticketNumber: { type: "string", example: "ITOPS-1001" },
            title: { type: "string", example: "VPN access unavailable" },
            description: { type: "string", nullable: true, example: "Remote users cannot connect to corporate VPN." },
            status: { type: "string", enum: ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"], example: "IN_PROGRESS" },
            priority: { type: "string", enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"], example: "HIGH" },
            projectId: { type: "string" },
            project: { $ref: "#/components/schemas/ProjectRef" },
            creatorId: { type: "string" },
            creator: { $ref: "#/components/schemas/UserRef" },
            assigneeId: { type: "string", nullable: true },
            assignee: { $ref: "#/components/schemas/UserRef", nullable: true },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        TicketSummary: {
          type: "object",
          properties: {
            total: { type: "integer", example: 2 },
            open: { type: "integer", example: 1 },
            inProgress: { type: "integer", example: 1 },
            resolved: { type: "integer", example: 0 },
            closed: { type: "integer", example: 0 },
            critical: { type: "integer", example: 0 },
            recentTickets: {
              type: "array",
              items: { $ref: "#/components/schemas/Ticket" },
            },
          },
        },
        FormOptions: {
          type: "object",
          properties: {
            projects: {
              type: "array",
              items: { $ref: "#/components/schemas/ProjectRef" },
            },
            users: {
              type: "array",
              items: { $ref: "#/components/schemas/UserRef" },
            },
          },
        },
        LoginRequest: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", example: "manager@example.test" },
            password: { type: "string", example: "Manager@123" },
          },
        },
        LoginResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            data: {
              type: "object",
              properties: {
                token: { type: "string" },
                user: { $ref: "#/components/schemas/User" },
              },
            },
          },
        },
        CreateTicketRequest: {
          type: "object",
          required: ["title", "projectId", "creatorId"],
          properties: {
            title: { type: "string", example: "Printer offline in APAC office" },
            description: { type: "string", example: "Network printer is not responding to ping." },
            status: { type: "string", enum: ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"], default: "OPEN" },
            priority: { type: "string", enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"], default: "MEDIUM" },
            projectId: { type: "string" },
            creatorId: { type: "string" },
            assigneeId: { type: "string", nullable: true },
          },
        },
        UpdateTicketRequest: {
          type: "object",
          properties: {
            title: { type: "string" },
            description: { type: "string", nullable: true },
            status: { type: "string", enum: ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"] },
            priority: { type: "string", enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"] },
            assigneeId: { type: "string", nullable: true },
          },
        },
        CreateUserRequest: {
          type: "object",
          required: ["firstName", "lastName", "email", "password", "role"],
          properties: {
            firstName: { type: "string", example: "John" },
            lastName: { type: "string", example: "Doe" },
            email: { type: "string", example: "john@example.test" },
            password: { type: "string", example: "Test@123" },
            role: { type: "string", enum: ["Administrator", "Service Desk Analyst"], example: "Service Desk Analyst" },
          },
        },
        UpdateUserRequest: {
          type: "object",
          properties: {
            firstName: { type: "string" },
            lastName: { type: "string" },
            email: { type: "string" },
            role: { type: "string", enum: ["Administrator", "Service Desk Analyst"] },
          },
        },
      },
    },
    paths: {
      "/api/health": {
        get: {
          tags: ["Health"],
          summary: "Check API health status",
          description: "Public endpoint returning database connectivity and server status.",
          responses: {
            "200": {
              description: "Server is healthy",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      status: { type: "string", example: "ok" },
                      database: { type: "string", example: "connected" },
                    },
                  },
                },
              },
            },
            "500": {
              description: "Database disconnected or internal server error",
              content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
            },
          },
        },
      },
      "/api/admin-only": {
        get: {
          tags: ["Health"],
          summary: "Test Administrator role access",
          description: "Administrator only endpoint returning access confirmation.",
          security: [{ bearerAuth: [] }],
          responses: {
            "200": {
              description: "Admin access granted",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean", example: true },
                      message: { type: "string", example: "Admin access granted." },
                    },
                  },
                },
              },
            },
            "401": { description: "Unauthenticated", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
            "403": { description: "Forbidden - Insufficient permissions", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          },
        },
      },
      "/api/auth/login": {
        post: {
          tags: ["Authentication"],
          summary: "Authenticate user and issue JWT",
          description: "Authenticates email and password, returning JWT bearer token and safe user details.",
          requestBody: {
            required: true,
            content: { "application/json": { schema: { $ref: "#/components/schemas/LoginRequest" } } },
          },
          responses: {
            "200": { description: "Login successful", content: { "application/json": { schema: { $ref: "#/components/schemas/LoginResponse" } } } },
            "400": { description: "Missing email or password", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
            "401": { description: "Invalid credentials", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          },
        },
      },
      "/api/auth/me": {
        get: {
          tags: ["Authentication"],
          summary: "Get current authenticated user profile",
          description: "Returns currently authenticated user profile based on Bearer token.",
          security: [{ bearerAuth: [] }],
          responses: {
            "200": {
              description: "Current user profile",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean", example: true },
                      data: { $ref: "#/components/schemas/User" },
                    },
                  },
                },
              },
            },
            "401": { description: "Unauthenticated", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          },
        },
      },
      "/api/auth/logout": {
        post: {
          tags: ["Authentication"],
          summary: "Logout user",
          description: "Stateless JWT logout requiring client token removal.",
          security: [{ bearerAuth: [] }],
          responses: {
            "200": {
              description: "Logged out successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean", example: true },
                      message: { type: "string", example: "Logged out successfully. Please remove the token client-side." },
                    },
                  },
                },
              },
            },
            "401": { description: "Unauthenticated", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          },
        },
      },
      "/api/tickets": {
        get: {
          tags: ["Tickets"],
          summary: "List tickets with filtering, search, sorting, and pagination",
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "search", in: "query", description: "Search text in ticketNumber, title, or description", schema: { type: "string" } },
            { name: "status", in: "query", description: "Filter by status", schema: { type: "string", enum: ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"] } },
            { name: "priority", in: "query", description: "Filter by priority", schema: { type: "string", enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"] } },
            { name: "assigneeId", in: "query", description: "Filter by assignee user ID", schema: { type: "string" } },
            { name: "projectId", in: "query", description: "Filter by project ID", schema: { type: "string" } },
            { name: "page", in: "query", description: "Page number (1-indexed)", schema: { type: "integer", default: 1 } },
            { name: "limit", in: "query", description: "Items per page (max 100)", schema: { type: "integer", default: 10 } },
            { name: "sortBy", in: "query", description: "Sort field", schema: { type: "string", enum: ["createdAt", "updatedAt", "priority", "status", "ticketNumber"], default: "createdAt" } },
            { name: "sortOrder", in: "query", description: "Sort order direction", schema: { type: "string", enum: ["asc", "desc"], default: "desc" } },
          ],
          responses: {
            "200": {
              description: "Paginated list of tickets",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean", example: true },
                      data: { type: "array", items: { $ref: "#/components/schemas/Ticket" } },
                      pagination: {
                        type: "object",
                        properties: {
                          total: { type: "integer", example: 10 },
                          page: { type: "integer", example: 1 },
                          limit: { type: "integer", example: 10 },
                          totalPages: { type: "integer", example: 1 },
                        },
                      },
                    },
                  },
                },
              },
            },
            "400": { description: "Invalid query parameters", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
            "401": { description: "Unauthenticated", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          },
        },
        post: {
          tags: ["Tickets"],
          summary: "Create a new ticket",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: { "application/json": { schema: { $ref: "#/components/schemas/CreateTicketRequest" } } },
          },
          responses: {
            "201": {
              description: "Ticket created successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean", example: true },
                      data: { $ref: "#/components/schemas/Ticket" },
                    },
                  },
                },
              },
            },
            "400": { description: "Validation error or missing fields", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
            "401": { description: "Unauthenticated", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          },
        },
      },
      "/api/tickets/summary": {
        get: {
          tags: ["Tickets"],
          summary: "Get ticket summary statistics",
          security: [{ bearerAuth: [] }],
          responses: {
            "200": {
              description: "Ticket summary metrics and recent tickets",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean", example: true },
                      data: { $ref: "#/components/schemas/TicketSummary" },
                    },
                  },
                },
              },
            },
            "401": { description: "Unauthenticated", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          },
        },
      },
      "/api/tickets/form-options": {
        get: {
          tags: ["Tickets"],
          summary: "Get projects and users dropdown options for ticket creation",
          security: [{ bearerAuth: [] }],
          responses: {
            "200": {
              description: "Form options list",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean", example: true },
                      data: { $ref: "#/components/schemas/FormOptions" },
                    },
                  },
                },
              },
            },
            "401": { description: "Unauthenticated", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          },
        },
      },
      "/api/tickets/{id}": {
        get: {
          tags: ["Tickets"],
          summary: "Get single ticket details by ID",
          security: [{ bearerAuth: [] }],
          parameters: [{ name: "id", in: "path", required: true, description: "Ticket CUID ID", schema: { type: "string" } }],
          responses: {
            "200": {
              description: "Ticket details",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean", example: true },
                      data: { $ref: "#/components/schemas/Ticket" },
                    },
                  },
                },
              },
            },
            "401": { description: "Unauthenticated", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
            "404": { description: "Ticket not found", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          },
        },
        patch: {
          tags: ["Tickets"],
          summary: "Update existing ticket details",
          security: [{ bearerAuth: [] }],
          parameters: [{ name: "id", in: "path", required: true, description: "Ticket CUID ID", schema: { type: "string" } }],
          requestBody: {
            required: true,
            content: { "application/json": { schema: { $ref: "#/components/schemas/UpdateTicketRequest" } } },
          },
          responses: {
            "200": {
              description: "Updated ticket details",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean", example: true },
                      data: { $ref: "#/components/schemas/Ticket" },
                    },
                  },
                },
              },
            },
            "400": { description: "Validation error", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
            "401": { description: "Unauthenticated", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
            "404": { description: "Ticket not found", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          },
        },
      },
      "/api/users": {
        get: {
          tags: ["Users"],
          summary: "List all users (Administrator only)",
          security: [{ bearerAuth: [] }],
          responses: {
            "200": {
              description: "List of users",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean", example: true },
                      data: { type: "array", items: { $ref: "#/components/schemas/User" } },
                    },
                  },
                },
              },
            },
            "401": { description: "Unauthenticated", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
            "403": { description: "Forbidden - Insufficient permissions", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          },
        },
        post: {
          tags: ["Users"],
          summary: "Create a new user (Administrator only)",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: { "application/json": { schema: { $ref: "#/components/schemas/CreateUserRequest" } } },
          },
          responses: {
            "201": {
              description: "User created successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean", example: true },
                      data: { $ref: "#/components/schemas/User" },
                    },
                  },
                },
              },
            },
            "400": { description: "Validation error or duplicate email", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
            "401": { description: "Unauthenticated", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
            "403": { description: "Forbidden - Insufficient permissions", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          },
        },
      },
      "/api/users/{id}": {
        get: {
          tags: ["Users"],
          summary: "Get user details by ID (Administrator only)",
          security: [{ bearerAuth: [] }],
          parameters: [{ name: "id", in: "path", required: true, description: "User CUID ID", schema: { type: "string" } }],
          responses: {
            "200": {
              description: "User details",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean", example: true },
                      data: { $ref: "#/components/schemas/User" },
                    },
                  },
                },
              },
            },
            "401": { description: "Unauthenticated", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
            "403": { description: "Forbidden - Insufficient permissions", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
            "404": { description: "User not found", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          },
        },
        patch: {
          tags: ["Users"],
          summary: "Update user details (Administrator only)",
          security: [{ bearerAuth: [] }],
          parameters: [{ name: "id", in: "path", required: true, description: "User CUID ID", schema: { type: "string" } }],
          requestBody: {
            required: true,
            content: { "application/json": { schema: { $ref: "#/components/schemas/UpdateUserRequest" } } },
          },
          responses: {
            "200": {
              description: "Updated user details",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean", example: true },
                      data: { $ref: "#/components/schemas/User" },
                    },
                  },
                },
              },
            },
            "400": { description: "Validation error or self-role demotion attempt", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
            "401": { description: "Unauthenticated", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
            "403": { description: "Forbidden - Insufficient permissions", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
            "404": { description: "User not found", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          },
        },
      },
    },
  },
  apis: [],
});

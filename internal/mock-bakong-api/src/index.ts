import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";

// Types for API responses
interface BaseResponse {
  responseCode: number;
  responseMessage: string;
  errorCode: number | null;
  data: any;
}

interface TransactionData {
  hash: string;
  fromAccountId: string;
  toAccountId: string;
  currency: string;
  amount: number;
  description: string;
  createdDateMs: number;
  acknowledgedDateMs: number;
  trackingStatus?: string;
  receiverBank?: string;
  receiverBankAccount?: string;
}

interface TokenData {
  token: string;
}

interface DeeplinkData {
  shortLink: string;
}

// Mock data
const mockTransactions: Record<string, TransactionData> = {
  d60f3db96913029a2af979a1662c1e72: {
    hash: "e40a1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab",
    fromAccountId: "developer@cmcb",
    toAccountId: "developer@devb",
    currency: "USD",
    amount: 1.0,
    description: "Test transaction",
    createdDateMs: 1605774370608.0,
    acknowledgedDateMs: 1605774422421.0,
    trackingStatus: "RECEIVE_AT_RECEIVER_BANK",
    receiverBank: "Dev Bank",
    receiverBankAccount: "8*******123",
  },
  dcd53430d3b3005d9cda36f1fe8dedc3714ccf18f886cf5d090d36fee67ef956: {
    hash: "dcd53430d3b3005d9cda36f1fe8dedc3714ccf18f886cf5d090d36fee67ef956",
    fromAccountId: "rieu_dhqj_1984@devb",
    toAccountId: "bridge_account@devb",
    currency: "USD",
    amount: 1.0,
    description: "testing bakong generator",
    createdDateMs: 1636709121073.0,
    acknowledgedDateMs: 1636709123467.2,
    trackingStatus: "RECEIVE_AT_RECEIVER_BANK",
    receiverBank: "Dev Bank",
    receiverBankAccount: "8*******123",
  },
};

const validEmails = ["test@example.com", "developer@bakong.com"];
const validAccounts = ["user@bank", "developer@cmcb", "developer@devb"];
const mockToken =
  "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.TCYt5XsITJX1CxPCT8kABxVN2fDUFHXvuKOFLGCHSfU";

const app = new Hono();

app.use(logger());

// Enable CORS
app.use("/*", cors());

// Helper function to create error response
const createErrorResponse = (
  errorCode: number,
  responseCode: number,
  message: string,
): BaseResponse => ({
  responseCode,
  responseMessage: message,
  errorCode,
  data: null,
});

// Helper function to create success response
const createSuccessResponse = (data: any, message: string): BaseResponse => ({
  responseCode: 0,
  responseMessage: message,
  errorCode: null,
  data,
});

// Authentication middleware
const authMiddleware = async (c: any, next: any) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json(createErrorResponse(6, 1, "Unauthorized."), 401);
  }

  const token = authHeader.substring(7);
  // Simple token validation - accept the mock token or any token for testing
  if (!token || token.length < 10) {
    return c.json(createErrorResponse(6, 1, "Unauthorized."), 401);
  }

  await next();
};

// 1. Renew Token
app.post("/v1/renew_token", async (c) => {
  try {
    const body = await c.req.json();
    const { email } = body;

    if (!email) {
      return c.json(createErrorResponse(5, 1, "Missing required fields."), 400);
    }

    if (!validEmails.includes(email)) {
      return c.json(createErrorResponse(10, 1, "Not registered yet."), 400);
    }

    const tokenData: TokenData = { token: mockToken };
    return c.json(createSuccessResponse(tokenData, "Token has been issued"));
  } catch (error) {
    return c.json(
      createErrorResponse(
        9,
        1,
        "Cannot connect to server. Please try again later.",
      ),
      500,
    );
  }
});

// 2. Generate Deeplink
app.post("/v1/generate_deeplink_by_qr", async (c) => {
  try {
    const body = await c.req.json();
    const { qr, sourceInfo } = body;

    if (!qr) {
      return c.json(createErrorResponse(5, 1, "Missing required fields."), 400);
    }

    if (qr.includes("static")) {
      return c.json(
        createErrorResponse(
          2,
          1,
          "Sorry, the system does not support static QR code.",
        ),
        400,
      );
    }

    const deeplinkData: DeeplinkData = {
      shortLink: `https://bakongsit.page.link/${Math.random().toString(36).substring(2, 15)}`,
    };

    return c.json(
      createSuccessResponse(deeplinkData, "Getting deep link successfully"),
    );
  } catch (error) {
    return c.json(
      createErrorResponse(
        4,
        1,
        "Error occurred on requesting deeplink from provider.",
      ),
      500,
    );
  }
});

// 3. Check Transaction Status by MD5
app.post("/v1/check_transaction_by_md5", authMiddleware, async (c) => {
  try {
    const body = await c.req.json();
    const { md5 } = body;

    if (!md5) {
      return c.json(createErrorResponse(5, 1, "Missing required fields."), 400);
    }

    const transaction = mockTransactions[md5];
    if (!transaction) {
      return c.json(
        createErrorResponse(
          1,
          1,
          "Transaction could not be found. Please check and try again.",
        ),
        404,
      );
    }

    return c.json(
      createSuccessResponse(transaction, "Getting transaction successfully."),
    );
  } catch (error) {
    console.error("Error:", error);
    return c.json(
      createErrorResponse(
        9,
        1,
        "Cannot connect to server. Please try again later.",
      ),
      500,
    );
  }
});

// 4. Check Transaction Status by Full Hash
app.post("/v1/check_transaction_by_hash", authMiddleware, async (c) => {
  try {
    const body = await c.req.json();
    const { hash } = body;

    if (!hash) {
      return c.json(createErrorResponse(5, 1, "Missing required fields."), 400);
    }

    const transaction = mockTransactions[hash];
    if (!transaction) {
      return c.json(
        createErrorResponse(
          1,
          1,
          "Transaction could not be found. Please check and try again.",
        ),
        404,
      );
    }

    return c.json(
      createSuccessResponse(transaction, "Getting transaction successfully."),
    );
  } catch (error) {
    return c.json(
      createErrorResponse(
        9,
        1,
        "Cannot connect to server. Please try again later.",
      ),
      500,
    );
  }
});

// 5. Check Transaction Status by Short Hash
app.post("/v1/check_transaction_by_short_hash", authMiddleware, async (c) => {
  try {
    const body = await c.req.json();
    const { hash, amount, currency } = body;

    if (!hash || !amount || !currency) {
      return c.json(createErrorResponse(5, 1, "Missing required fields."), 400);
    }

    if (hash.length !== 8) {
      return c.json(
        createErrorResponse(5, 1, "Hash must be 8 characters long."),
        400,
      );
    }

    if (!["USD", "KHR"].includes(currency)) {
      return c.json(
        createErrorResponse(5, 1, "Currency must be USD or KHR."),
        400,
      );
    }

    // Mock: find transaction by short hash
    const fullHash = Object.keys(mockTransactions).find((key) =>
      key.startsWith(hash),
    );
    if (!fullHash) {
      return c.json(
        createErrorResponse(
          1,
          1,
          "Transaction could not be found. Please check and try again.",
        ),
        404,
      );
    }

    const transaction = mockTransactions[fullHash];
    if (transaction.amount !== amount || transaction.currency !== currency) {
      return c.json(
        createErrorResponse(
          1,
          1,
          "Transaction could not be found. Please check and try again.",
        ),
        404,
      );
    }

    return c.json(
      createSuccessResponse(transaction, "Getting transaction successfully."),
    );
  } catch (error) {
    return c.json(
      createErrorResponse(
        9,
        1,
        "Cannot connect to server. Please try again later.",
      ),
      500,
    );
  }
});

// 6. Check Bakong Account
app.post("/v1/check_bakong_account", authMiddleware, async (c) => {
  try {
    const body = await c.req.json();
    const { accountId } = body;

    if (!accountId) {
      return c.json(createErrorResponse(5, 1, "Missing required fields."), 400);
    }

    if (!validAccounts.includes(accountId)) {
      return c.json(createErrorResponse(11, 1, "Account ID not found"), 404);
    }

    return c.json(createSuccessResponse(null, "Account ID exists"));
  } catch (error) {
    return c.json(
      createErrorResponse(
        9,
        1,
        "Cannot connect to server. Please try again later.",
      ),
      500,
    );
  }
});

// 7. Check Transaction Status by Instruction Reference
app.post(
  "/v1/check_transaction_by_instruction_ref",
  authMiddleware,
  async (c) => {
    try {
      const body = await c.req.json();
      const { instructionRef } = body;

      if (!instructionRef) {
        return c.json(
          createErrorResponse(5, 1, "Missing required fields."),
          400,
        );
      }

      // Mock: Use first transaction for demo
      const transaction = Object.values(mockTransactions)[0];
      return c.json(
        createSuccessResponse(transaction, "Getting transaction successfully."),
      );
    } catch (error) {
      return c.json(
        createErrorResponse(
          9,
          1,
          "Cannot connect to server. Please try again later.",
        ),
        500,
      );
    }
  },
);

// 8. Check Transaction Status by External Reference
app.post("/v1/check_transaction_by_external_ref", authMiddleware, async (c) => {
  try {
    const body = await c.req.json();
    const { externalRef } = body;

    if (!externalRef) {
      return c.json(createErrorResponse(5, 1, "Missing required fields."), 400);
    }

    // Mock: Use first transaction for demo
    const transaction = Object.values(mockTransactions)[0];
    return c.json(
      createSuccessResponse(transaction, "Getting transaction successfully."),
    );
  } catch (error) {
    return c.json(
      createErrorResponse(
        9,
        1,
        "Cannot connect to server. Please try again later.",
      ),
      500,
    );
  }
});

// 9. Check Transaction Status by MD5 List
app.post("/v1/check_transaction_by_md5_list", authMiddleware, async (c) => {
  try {
    const md5List = await c.req.json();

    if (!Array.isArray(md5List) || md5List.length === 0) {
      return c.json(createErrorResponse(5, 1, "Missing required fields."), 400);
    }

    if (md5List.length > 50) {
      return c.json(
        createErrorResponse(5, 1, "Maximum 50 items allowed."),
        400,
      );
    }

    const results = md5List.map((md5) => {
      const transaction = mockTransactions[md5];
      if (!transaction) {
        return {
          md5,
          status: "NOT_FOUND",
          message: "Transaction could not be found. Please check and try again",
          data: null,
        };
      }

      return {
        md5,
        status: "SUCCESS",
        message: "Transaction success",
        data: transaction,
      };
    });

    return c.json(
      createSuccessResponse(results, "Getting transaction data successfully."),
    );
  } catch (error) {
    return c.json(
      createErrorResponse(
        9,
        1,
        "Cannot connect to server. Please try again later.",
      ),
      500,
    );
  }
});

// 10. Check Transaction Status by Full Hash List
app.post("/v1/check_transaction_by_hash_list", authMiddleware, async (c) => {
  try {
    const hashList = await c.req.json();

    if (!Array.isArray(hashList) || hashList.length === 0) {
      return c.json(createErrorResponse(5, 1, "Missing required fields."), 400);
    }

    if (hashList.length > 50) {
      return c.json(
        createErrorResponse(5, 1, "Maximum 50 items allowed."),
        400,
      );
    }

    const results = hashList.map((hash) => {
      const transaction = mockTransactions[hash];
      if (!transaction) {
        return {
          hash,
          status: "NOT_FOUND",
          message: "Transaction could not be found. Please check and try again",
          data: null,
        };
      }

      return {
        hash,
        status: "SUCCESS",
        message: "Transaction success",
        data: transaction,
      };
    });

    return c.json(
      createSuccessResponse(results, "Getting transaction data successfully."),
    );
  } catch (error) {
    return c.json(
      createErrorResponse(
        9,
        1,
        "Cannot connect to server. Please try again later.",
      ),
      500,
    );
  }
});

// Health check endpoint
app.get("/", (c) => {
  return c.json({
    message: "Bakong API Mock Server",
    version: "1.0.0",
    endpoints: [
      "POST /v1/renew_token",
      "POST /v1/generate_deeplink_by_qr",
      "POST /v1/check_transaction_by_md5",
      "POST /v1/check_transaction_by_hash",
      "POST /v1/check_transaction_by_short_hash",
      "POST /v1/check_bakong_account",
      "POST /v1/check_transaction_by_instruction_ref",
      "POST /v1/check_transaction_by_external_ref",
      "POST /v1/check_transaction_by_md5_list",
      "POST /v1/check_transaction_by_hash_list",
    ],
  });
});

// Error handling middleware
app.onError((err, c) => {
  console.error("Error:", err);

  if (err instanceof HTTPException) {
    return c.json(createErrorResponse(6, 1, "Unauthorized."), err.status);
  }

  return c.json(createErrorResponse(9, 1, "Internal server error."), 500);
});

export default {
  port: 9000,
  fetch: app.fetch,
};

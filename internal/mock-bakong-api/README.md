# Bakong API Mock Server

A mock implementation of the Bakong Open API built with Hono, providing all the endpoints specified in the official Bakong API documentation.

## Getting Started

### Prerequisites
- Bun runtime installed

### Installation
```bash
bun install
```

### Running the Server
```bash
bun run dev
```

The server will start on `http://localhost:9000`

## API Endpoints

### Health Check
- **GET** `/` - Returns server status and available endpoints

### 1. Renew Token
- **POST** `/v1/renew_token`
- **Body**: `{ "email": "string" }`
- **Valid emails**: `test@example.com`, `developer@bakong.com`

**Example:**
```bash
curl -X POST http://localhost:9000/v1/renew_token \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

### 2. Generate Deeplink
- **POST** `/v1/generate_deeplink_by_qr`
- **Body**: `{ "qr": "string", "sourceInfo": { "appIconUrl": "string", "appName": "string", "appDeepLinkCallback": "string" } }`

**Example:**
```bash
curl -X POST http://localhost:9000/v1/generate_deeplink_by_qr \
  -H "Content-Type: application/json" \
  -d '{"qr": "0002010....", "sourceInfo": {"appIconUrl": "https://bakong.nbc.gov.kh/images/logo.svg", "appName": "Bakong", "appDeepLinkCallback": "https://bakong.nbc.gov.kh/"}}'
```

### 3. Check Transaction Status by MD5
- **POST** `/v1/check_transaction_by_md5`
- **Headers**: `Authorization: Bearer [token]`
- **Body**: `{ "md5": "string" }`
- **Valid MD5s**: `d60f3db96913029a2af979a1662c1e72`

**Example:**
```bash
curl -X POST http://localhost:9000/v1/check_transaction_by_md5 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..." \
  -d '{"md5": "d60f3db96913029a2af979a1662c1e72"}'
```

### 4. Check Transaction Status by Full Hash
- **POST** `/v1/check_transaction_by_hash`
- **Headers**: `Authorization: Bearer [token]`
- **Body**: `{ "hash": "string" }`
- **Valid hashes**: `dcd53430d3b3005d9cda36f1fe8dedc3714ccf18f886cf5d090d36fee67ef956`

### 5. Check Transaction Status by Short Hash
- **POST** `/v1/check_transaction_by_short_hash`
- **Headers**: `Authorization: Bearer [token]`
- **Body**: `{ "hash": "string", "amount": number, "currency": "USD|KHR" }`

### 6. Check Bakong Account
- **POST** `/v1/check_bakong_account`
- **Headers**: `Authorization: Bearer [token]`
- **Body**: `{ "accountId": "string" }`
- **Valid accounts**: `user@bank`, `developer@cmcb`, `developer@devb`

### 7. Check Transaction Status by Instruction Reference
- **POST** `/v1/check_transaction_by_instruction_ref`
- **Headers**: `Authorization: Bearer [token]`
- **Body**: `{ "instructionRef": "string" }`

### 8. Check Transaction Status by External Reference
- **POST** `/v1/check_transaction_by_external_ref`
- **Headers**: `Authorization: Bearer [token]`
- **Body**: `{ "externalRef": "string" }`

### 9. Check Transaction Status by MD5 List
- **POST** `/v1/check_transaction_by_md5_list`
- **Headers**: `Authorization: Bearer [token]`
- **Body**: `["md5_1", "md5_2", ...]` (max 50 items)

### 10. Check Transaction Status by Full Hash List
- **POST** `/v1/check_transaction_by_hash_list`
- **Headers**: `Authorization: Bearer [token]`
- **Body**: `["hash_1", "hash_2", ...]` (max 50 items)

## Authentication

For endpoints requiring authentication, use the token obtained from `/v1/renew_token`:

```bash
Authorization: Bearer [your_token_here]
```

## Response Format

All responses follow the standard format:
```json
{
  "responseCode": 0,
  "responseMessage": "Success message",
  "errorCode": null,
  "data": { /* response data */ }
}
```

## Error Codes

- `0`: Success
- `1`: Fail
- `1`: Transaction could not be found
- `2`: System does not support static QR code
- `3`: Transaction failed
- `4`: Error occurred on requesting deeplink from provider
- `5`: Missing required fields
- `6`: Unauthorized
- `9`: Cannot connect to server
- `10`: Not registered yet
- `11`: Account ID not found
- `12`: Account ID is invalid

## Mock Data

The server includes mock transaction data for testing purposes. Valid test data includes:
- MD5: `d60f3db96913029a2af979a1662c1e72`
- Hash: `dcd53430d3b3005d9cda36f1fe8dedc3714ccf18f886cf5d090d36fee67ef956`
- Emails: `test@example.com`, `developer@bakong.com`
- Accounts: `user@bank`, `developer@cmcb`, `developer@devb`

## Development

The server is built with:
- [Hono](https://hono.dev/) - Web framework
- [Bun](https://bun.sh/) - JavaScript runtime
- TypeScript for type safety

## License

This is a mock server for testing purposes only.

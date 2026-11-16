# MORX — Authentication & Key Management Guide

## 1. Overview

Morx uses cryptographically generated, SHA-256 hashed API Keys for client application authentication. Client applications do not have direct access to downstream provider keys (YouTube, OpenWeather, Google Maps, etc.).

## 2. API Key Structure
Every key issued by Morx follows standard formatting:
```text
morx_{environment}_{prefix}_{secret}
```
* **Production Live Key:** `morx_live_grad_...`
* **Test / Staging Key:** `morx_test_...`

## 3. How to Authenticate
Pass your key in the standard `Authorization` header:
```http
Authorization: Bearer morx_live_grad_project_2026_demo_key
```
Alternatively, pass it in the `x-api-key` header:
```http
x-api-key: morx_live_grad_project_2026_demo_key
```

## 4. Key Storage Security
* Plaintext keys are shown **once** upon generation.
* The database only stores the SHA-256 hash (`key_hash`) and the safe prefix (`key_prefix`).
* Constant-time string comparison (`crypto.timingSafeEqual`) is used to prevent timing attacks.

## 5. Master Gateway Key
To manage clients or bypass per-client restrictions in internal administrative services, set `MORX_GATEWAY_MASTER_KEY` in your `.env.local`.


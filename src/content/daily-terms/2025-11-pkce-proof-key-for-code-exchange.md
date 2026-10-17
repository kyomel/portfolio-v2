---
title: "PKCE(Proof Key for Code Exchange)"
termSlug: "pkce-proof-key-for-code-exchange"
year: 2025
month: 11
monthName: "November"
day: 10
order: 6
source: "2025/nov-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2025/nov-term.md"
excerpt: "PKCE (Proof Key for Code Exchange) is a security extension to OAuth 2.0 designed to make the authorization code flow secure for public clients (like mobile apps and SPAs) that cannot securely store..."
---
### Definition:

PKCE (Proof Key for Code Exchange) is a security extension to OAuth 2.0 designed to make the authorization code flow secure for public clients (like mobile apps and SPAs) that cannot securely store client secrets. Instead of using a static client secret, PKCE dynamically generates a cryptographic challenge and verifier pair for each authorization request, preventing authorization code interception attacks.

**Key Properties:**

- Dynamic security: Each authorization request uses unique cryptographic values
- No client secret required: Suitable for public clients (mobile apps, SPAs)
- Prevents code interception: Even if auth code is stolen, it's useless without the verifier
- Cryptographically secure: Uses SHA256 hashing with random code verifiers
- Backward compatible: Works with existing OAuth 2.0 infrastructure

**Core Concepts:**

- Code Verifier: Random cryptographic string (43-128 characters)
- Code Challenge: SHA256 hash of the code verifier (Base64 URL-encoded)
- Challenge Method: How the challenge is derived (S256 for SHA256)
- Authorization code: Still used, but protected by PKCE
- Proof of possession: Client must prove it initiated the flow

### Example:

Mobile app needs to authenticate users securely without storing secrets

```
// ✅ PKCE-PROTECTED OAUTH 2.0 FLOW
class SecurePKCEFlow {
  constructor() {
    this.crypto = require('crypto'); // In browser, use Web Crypto API
  }

  async demonstrateSecureFlow() {
    console.log('\n🔒 SECURE OAUTH 2.0 WITH PKCE');
    console.log('=============================');
    console.log('Solution: Cryptographic proof that client initiated the flow\n');

    // Step 1: Generate PKCE values
    console.log('1️⃣ Mobile app generates PKCE values:');
    const pkcePair = this.generatePKCEPair();

    console.log(`   Code Verifier: ${pkcePair.codeVerifier.substring(0, 20)}... (${pkcePair.codeVerifier.length} chars)`);
    console.log(`   Code Challenge: ${pkcePair.codeChallenge}`);
    console.log(`   Challenge Method: ${pkcePair.challengeMethod}`);
    console.log('   ✅ Verifier stored securely in app memory');

    // Step 2: Authorization request with code challenge
    const authUrl = this.buildPKCEAuthorizationUrl(pkcePair.codeChallenge, pkcePair.challengeMethod);
    console.log('\n2️⃣ Mobile app redirects user with PKCE challenge:');
    console.log(`   ${authUrl}`);
    console.log('   ✅ Code challenge sent, verifier stays in app');

    // Step 3: User authorizes, gets code
    const authorizationCode = 'auth_code_67890';
    console.log('\n3️⃣ User authorizes, gets redirected back:');
    console.log(`   myapp://callback?code=${authorizationCode}`);
    console.log('   ⚠️  Code can still be intercepted...');

    // Step 4: Legitimate app exchanges code with verifier
    console.log('\n4️⃣ Legitimate app exchanges code with PKCE verifier:');
    const tokenResponse = await this.exchangeCodeForToken(authorizationCode, pkcePair.codeVerifier);
    console.log('   POST /token');
    console.log('   {');
    console.log('     "grant_type": "authorization_code",');
    console.log(`     "code": "${authorizationCode}",`);
    console.log('     "client_id": "mobile_app_123",');
    console.log(`     "code_verifier": "${pkcePair.codeVerifier.substring(0, 20)}..."`);
    console.log('   }');

    if (tokenResponse.success) {
      console.log('\n✅ SUCCESS: Token exchange successful!');
      console.log(`   Access Token: ${tokenResponse.accessToken.substring(0, 20)}...`);
    }

    // Step 5: Attack scenario with PKCE protection
    console.log('\n💀 ATTACK ATTEMPT: Attacker tries to use intercepted code:');
    console.log('   Attacker has: authorization code');
    console.log('   Attacker missing: code verifier (only in legitimate app memory)');

    const attackResponse = await this.attemptAttack(authorizationCode);
    console.log('\n❌ ATTACK FAILED:');
    console.log(`   Error: ${attackResponse.error}`);
    console.log('   🛡️ PKCE protection worked!');
  }

  generatePKCEPair() {
    // Generate random code verifier (43-128 characters)
    const codeVerifier = this.generateCodeVerifier();

    // Generate code challenge (SHA256 hash of verifier)
    const codeChallenge = this.generateCodeChallenge(codeVerifier);

    return {
      codeVerifier,
      codeChallenge,
      challengeMethod: 'S256'
    };
  }

  generateCodeVerifier() {
    // Generate cryptographically random string (43-128 chars, URL-safe)
    const buffer = this.crypto.randomBytes(32); // 32 bytes = 43 chars when base64url encoded
    return this.base64URLEncode(buffer);
  }

  generateCodeChallenge(codeVerifier) {
    // SHA256 hash of code verifier, then base64url encode
    const hash = this.crypto.createHash('sha256').update(codeVerifier).digest();
    return this.base64URLEncode(hash);
  }

  base64URLEncode(buffer) {
    return buffer.toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, ''); // Remove padding
  }

  buildPKCEAuthorizationUrl(codeChallenge, challengeMethod) {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: 'mobile_app_123',
      redirect_uri: 'myapp://callback',
      scope: 'read_profile read_emails',
      state: 'random_state_value',
      code_challenge: codeChallenge,
      code_challenge_method: challengeMethod
    });

    return `https://auth.example.com/oauth/authorize?${params}`;
  }

  async exchangeCodeForToken(authCode, codeVerifier) {
    // Simulate token exchange request
    console.log('   🔍 Authorization server validates:');
    console.log('     1. Code is valid and not expired');
    console.log('     2. SHA256(code_verifier) === stored code_challenge');
    console.log('     3. Client_id matches original request');

    // Simulate server-side PKCE verification
    const isValidPKCE = this.verifyPKCE(codeVerifier, 'stored_code_challenge_from_auth_request');

    if (isValidPKCE) {
      return {
        success: true,
        accessToken: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...',
        tokenType: 'Bearer',
        expiresIn: 3600,
        refreshToken: 'refresh_token_abc123',
        scope: 'read_profile read_emails'
      };
    } else {
      return {
        success: false,
        error: 'invalid_grant',
        errorDescription: 'PKCE verification failed'
      };
    }
  }

  async attemptAttack(authCode) {
    console.log('   POST /token (attacker without code_verifier):');
    console.log('   {');
    console.log('     "grant_type": "authorization_code",');
    console.log(`     "code": "${authCode}",`);
    console.log('     "client_id": "mobile_app_123"');
    console.log('     // Missing code_verifier!');
    console.log('   }');

    // Attacker doesn't have the code verifier
    return {
      error: 'invalid_request',
      errorDescription: 'Code verifier required for PKCE'
    };
  }

  verifyPKCE(codeVerifier, storedCodeChallenge) {
    // In real implementation, server would compare like this:
    const computedChallenge = this.generateCodeChallenge(codeVerifier);
    return computedChallenge === storedCodeChallenge;
  }
}
```

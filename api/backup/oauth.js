const crypto = require('crypto');
const { google } = require('googleapis');
const { getConfig, assertGoogleConfigured } = require('./config');
const { BackupError, safeErrorMessage } = require('./errors');

function createOAuthClient(config = assertGoogleConfigured(getConfig())) {
  return new google.auth.OAuth2(config.clientId, config.clientSecret, config.redirectUri);
}

function createAuthorizationUrl({ state, config = assertGoogleConfigured(getConfig()) }) {
  if (!state) throw new BackupError('OAuth state is required.', { code: 'OAUTH_STATE_REQUIRED' });
  const client = createOAuthClient(config);
  return client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: true,
    scope: config.scopes,
    state,
    response_type: 'code'
  });
}

async function exchangeCode(code, config = assertGoogleConfigured(getConfig())) {
  if (!code) throw new BackupError('Missing Google authorization code.', { status: 400, code: 'OAUTH_CODE_MISSING' });
  const client = createOAuthClient(config);
  try {
    const { tokens } = await client.getToken(code);
    if (!tokens || (!tokens.refresh_token && !tokens.access_token)) {
      throw new BackupError('Google did not return an authorization token.', {
        status: 502,
        code: 'OAUTH_TOKEN_MISSING'
      });
    }
    return tokens;
  } catch (err) {
    if (err instanceof BackupError) throw err;
    throw new BackupError(`Google authorization exchange failed: ${safeErrorMessage(err)}`, {
      status: 502,
      code: 'OAUTH_EXCHANGE_FAILED'
    });
  }
}

async function revokeRefreshToken(refreshToken) {
  if (!refreshToken) return false;
  const client = createOAuthClient();
  try {
    await client.revokeToken(refreshToken);
    return true;
  } catch (_) {
    return false;
  }
}

function generateOAuthState() {
  return crypto.randomBytes(32).toString('base64url');
}

function hashOAuthState(state) {
  return crypto.createHash('sha256').update(String(state), 'utf8').digest('hex');
}

function isValidStateFormat(state) {
  return typeof state === 'string' && /^[A-Za-z0-9_-]{40,128}$/.test(state);
}

module.exports = {
  createOAuthClient,
  createAuthorizationUrl,
  exchangeCode,
  revokeRefreshToken,
  generateOAuthState,
  hashOAuthState,
  isValidStateFormat
};

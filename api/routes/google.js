const express = require('express');
const { google } = require('googleapis');
const pool = require('../db');
const store = require('../backup/store');
const { ensureBackupSchema } = require('../backup/schema');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const {
  assertGoogleConfigured,
  assertEncryptionConfigured,
  getConfig
} = require('../backup/config');
const { encryptSecret } = require('../backup/crypto');
const {
  createOAuthClient,
  createAuthorizationUrl,
  exchangeCode,
  generateOAuthState,
  hashOAuthState,
  isValidStateFormat
} = require('../backup/oauth');
const { ensureBackupFolder } = require('../backup/drive');
const { BackupError, safeErrorMessage, toPublicError } = require('../backup/errors');
const { sanitizeRedirectPath } = require('../backup/validation');

const router = express.Router();

function noStore(res) {
  res.set('Cache-Control', 'no-store, max-age=0');
  res.set('Pragma', 'no-cache');
}

function redirectToApp(res, path, params) {
  const config = getConfig();
  const base = `${config.appUrl}${sanitizeRedirectPath(path)}`;
  const query = new URLSearchParams(params).toString();
  res.redirect(303, query ? `${base}?${query}` : base);
}

router.get('/start', authenticateToken, requireAdmin, async (req, res) => {
  noStore(res);
  try {
    await ensureBackupSchema();
    const config = assertGoogleConfigured(getConfig());
    assertEncryptionConfigured(config);
    const state = generateOAuthState();
    const redirectAfter = sanitizeRedirectPath(req.query.redirect);
    await store.saveOAuthState({
      stateHash: hashOAuthState(state),
      adminId: req.user.id,
      redirectAfter,
      ttlMinutes: 10
    });
    const authUrl = createAuthorizationUrl({ state, config });
    await store.logAudit({
      adminId: req.user.id,
      action: 'drive.connect.started',
      targetType: 'google_drive',
      targetId: null,
      req,
      details: { scopes: config.scopes }
    });
    res.json({ authUrl, expires_in_minutes: 10 });
  } catch (err) {
    const publicError = toPublicError(err);
    res.status(publicError.status).json(publicError.body);
  }
});

router.get('/callback', async (req, res) => {
  noStore(res);
  let stateRow = null;
  let adminId = null;

  try {
    await ensureBackupSchema();
    const config = assertGoogleConfigured(getConfig());
    assertEncryptionConfigured(config);

    if (req.query.error) {
      throw new BackupError(`Google authorization was cancelled or denied (${String(req.query.error).slice(0, 80)}).`, {
        status: 400,
        code: 'OAUTH_DENIED'
      });
    }

    const state = String(req.query.state || '');
    const code = String(req.query.code || '');
    if (!isValidStateFormat(state)) {
      throw new BackupError('Invalid OAuth state. Start the Google Drive connection again.', {
        status: 400,
        code: 'OAUTH_STATE_INVALID'
      });
    }

    stateRow = await store.consumeOAuthState(hashOAuthState(state));
    if (!stateRow) {
      throw new BackupError('OAuth state is invalid, expired, or was already used. Start again.', {
        status: 400,
        code: 'OAUTH_STATE_EXPIRED'
      });
    }
    adminId = stateRow.admin_id;

    const admin = await pool.query('SELECT id, username, role FROM users WHERE id = $1', [adminId]);
    if (!admin.rows[0] || admin.rows[0].role !== 'admin') {
      throw new BackupError('Only an authenticated administrator can connect Google Drive.', {
        status: 403,
        code: 'ADMIN_REQUIRED'
      });
    }

    const tokens = await exchangeCode(code, config);
    if (!tokens.refresh_token) {
      throw new BackupError(
        'Google did not return a refresh token. Remove ResearchHub access at https://myaccount.google.com/permissions and connect again.',
        { status: 400, code: 'REFRESH_TOKEN_MISSING' }
      );
    }

    const encryptedToken = encryptSecret(tokens.refresh_token);
    await store.saveConnection({
      adminId,
      token: encryptedToken,
      scope: tokens.scope || config.scopes.join(' '),
      folderId: null,
      folderName: config.folderName,
      accountEmail: null
    });

    let folderWarning = null;
    try {
      const oauth = createOAuthClient(config);
      oauth.setCredentials(tokens);
      const drive = google.drive({ version: 'v3', auth: oauth });
      const folder = await ensureBackupFolder({
        drive,
        oauth,
        config,
        connection: { folder_id: null, folder_name: config.folderName }
      });
      await store.updateConnectionFolder(folder.id, folder.name);
    } catch (err) {
      folderWarning = 'Google Drive connected, but the backup folder could not be created. A backup attempt will retry.';
      await store.recordConnectionWarning(`${folderWarning} ${safeErrorMessage(err)}`);
    }

    await store.logAudit({
      adminId,
      action: folderWarning ? 'drive.connect.warning' : 'drive.connected',
      targetType: 'google_drive',
      targetId: null,
      req,
      details: {
        scopes: config.scopes,
        folder_warning: Boolean(folderWarning)
      }
    });

    redirectToApp(res, stateRow.redirect_after, {
      google: folderWarning ? 'warning' : 'connected',
      ...(folderWarning ? { message: folderWarning } : {})
    });
  } catch (err) {
    await store.logAudit({
      adminId,
      action: 'drive.connect.failed',
      targetType: 'google_drive',
      targetId: null,
      req,
      details: { error_code: err instanceof BackupError ? err.code : 'INTERNAL_ERROR' }
    });
    redirectToApp(res, stateRow ? stateRow.redirect_after : '/admin/backups', {
      google: 'error',
      message: safeErrorMessage(err)
    });
  }
});

module.exports = router;

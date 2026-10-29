const fs = require('fs');
const fsp = require('fs/promises');
const { pipeline } = require('stream/promises');
const { google } = require('googleapis');
const store = require('./store');
const { createOAuthClient } = require('./oauth');
const { decryptSecret, sha256File } = require('./crypto');
const { assertGoogleConfigured, assertEncryptionConfigured, getConfig } = require('./config');
const { BackupError, safeErrorMessage } = require('./errors');

const FOLDER_MIME = 'application/vnd.google-apps.folder';
const FILE_FIELDS = 'id,name,size,md5Checksum,mimeType,trashed,createdTime,modifiedTime,parents,appProperties';
const RESUMABLE_THRESHOLD_BYTES = 4 * 1024 * 1024;

function driveErrorStatus(err) {
  return err && (err.response?.status || err.code || err.status);
}

function driveErrorReason(err) {
  return err?.errors?.[0]?.reason ||
    err?.response?.data?.error?.errors?.[0]?.reason ||
    err?.response?.data?.error ||
    null;
}

function isRetryableDriveError(err) {
  if (!err) return false;
  const status = Number(driveErrorStatus(err));
  const reason = String(driveErrorReason(err) || '');
  const code = String(err.code || '');
  if ([429, 500, 502, 503, 504].includes(status)) return true;
  if (['rateLimitExceeded', 'userRateLimitExceeded', 'backendError', 'internalError'].includes(reason)) return true;
  if (['ECONNRESET', 'ECONNREFUSED', 'ETIMEDOUT', 'EAI_AGAIN', 'ENOTFOUND', 'EPIPE'].includes(code)) return true;
  return false;
}

function retryDelayMs(err, attempt) {
  const retryAfter = Number(err?.response?.headers?.['retry-after'] || err?.headers?.['retry-after']);
  if (Number.isFinite(retryAfter) && retryAfter > 0) return Math.min(60000, retryAfter * 1000);
  return Math.min(30000, 1000 * Math.pow(2, attempt)) + Math.floor(Math.random() * 250);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withDriveRetry(fn, { attempts = 5, context = 'Google Drive request' } = {}) {
  let lastError;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await fn(attempt);
    } catch (err) {
      lastError = err;
      if (!isRetryableDriveError(err) || attempt === attempts - 1) break;
      await sleep(retryDelayMs(err, attempt));
    }
  }
  throw normalizeDriveError(lastError, context);
}

function normalizeDriveError(err, context = 'Google Drive request') {
  if (err instanceof BackupError) return err;
  const status = Number(driveErrorStatus(err));
  const reason = driveErrorReason(err);
  if (status === 401) {
    return new BackupError('Google Drive authorization expired. Reconnect Google Drive.', {
      status: 409,
      code: 'DRIVE_RECONNECT_REQUIRED',
      details: { reason: typeof reason === 'string' ? reason : undefined }
    });
  }
  if (status === 403 && ['insufficientPermissions', 'forbidden'].includes(String(reason))) {
    return new BackupError('Google Drive permission was denied. Reconnect Google Drive and grant drive.file access.', {
      status: 409,
      code: 'DRIVE_PERMISSION_DENIED'
    });
  }
  if (status === 404) {
    return new BackupError('Google Drive file or folder was not found.', {
      status: 404,
      code: 'DRIVE_NOT_FOUND'
    });
  }
  if (status === 429) {
    return new BackupError('Google Drive rate limit reached. The operation will be retried.', {
      status: 429,
      code: 'DRIVE_RATE_LIMITED',
      retryable: true
    });
  }
  return new BackupError(`${context} failed: ${safeErrorMessage(err)}`, {
    status: status >= 400 && status < 600 ? 502 : 500,
    code: 'DRIVE_REQUEST_FAILED',
    retryable: isRetryableDriveError(err)
  });
}

function isInvalidGrant(err) {
  const message = String(err && err.message ? err.message : '');
  return /invalid_grant/i.test(message) ||
    /Token has been expired or revoked/i.test(message) ||
    driveErrorReason(err) === 'invalid_grant';
}

async function getDriveContext() {
  const config = assertGoogleConfigured(getConfig());
  assertEncryptionConfigured(config);
  const connection = await store.getConnection();
  if (!connection) {
    throw new BackupError('Google Drive is not connected. Connect it from the backup dashboard.', {
      status: 409,
      code: 'DRIVE_NOT_CONNECTED'
    });
  }
  if (connection.status === 'needs_reconnect') {
    throw new BackupError(
      connection.last_error || 'Google Drive authorization is no longer valid. Reconnect Google Drive.',
      { status: 409, code: 'DRIVE_RECONNECT_REQUIRED' }
    );
  }

  const refreshToken = decryptSecret({
    ciphertext: connection.refresh_token_ciphertext,
    iv: connection.refresh_token_iv,
    tag: connection.refresh_token_tag
  });

  const oauth = createOAuthClient(config);
  oauth.setCredentials({ refresh_token: refreshToken, scope: connection.scope });
  try {
    await oauth.getAccessToken();
  } catch (err) {
    if (isInvalidGrant(err)) {
      await store.markConnectionError(
        'Google authorization expired or was revoked. Reconnect Google Drive. Testing-mode OAuth apps expire refresh tokens after 7 days.'
      );
      throw new BackupError(
        'Google authorization expired or was revoked. Reconnect Google Drive.',
        { status: 409, code: 'DRIVE_RECONNECT_REQUIRED' }
      );
    }
    throw normalizeDriveError(err, 'Google token refresh');
  }

  return {
    connection,
    config,
    oauth,
    drive: google.drive({ version: 'v3', auth: oauth })
  };
}

function escapeQueryValue(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

async function findBackupFolder(ctx) {
  const { drive, connection } = ctx;
  const folderName = connection.folder_name || ctx.config.folderName;
  const q = [
    `mimeType = '${FOLDER_MIME}'`,
    `name = '${escapeQueryValue(folderName)}'`,
    'trashed = false',
    "appProperties has { key = 'researchhubBackupFolder' and value = '1' }"
  ].join(' and ');

  const response = await withDriveRetry(
    () => drive.files.list({
      q,
      spaces: 'drive',
      pageSize: 10,
      fields: `files(${FILE_FIELDS})`
    }),
    { context: 'Google Drive folder lookup' }
  );

  return response.data.files && response.data.files[0] ? response.data.files[0] : null;
}

async function ensureBackupFolder(ctx) {
  const { drive, connection } = ctx;
  const folderName = ctx.config.folderName;

  if (connection.folder_id) {
    try {
      const existing = await withDriveRetry(
        () => drive.files.get({
          fileId: connection.folder_id,
          fields: FILE_FIELDS
        }),
        { context: 'Google Drive folder verification', attempts: 3 }
      );
      if (existing.data && existing.data.mimeType === FOLDER_MIME && !existing.data.trashed) {
        return { id: existing.data.id, name: existing.data.name, reused: true };
      }
    } catch (err) {
      if (err.code !== 'DRIVE_NOT_FOUND' && err.status !== 404) throw err;
    }
  }

  const existing = await findBackupFolder(ctx);
  if (existing) {
    await store.updateConnectionFolder(existing.id, existing.name);
    return { id: existing.id, name: existing.name, reused: true };
  }

  const created = await withDriveRetry(
    () => drive.files.create({
      requestBody: {
        name: folderName,
        mimeType: FOLDER_MIME,
        appProperties: {
          researchhubBackupFolder: '1',
          researchhubApp: 'researchhub'
        }
      },
      fields: FILE_FIELDS
    }),
    { context: 'Google Drive folder creation' }
  );

  const folder = created.data;
  if (!folder || !folder.id) {
    throw new BackupError('Google Drive did not return a folder id.', { status: 502, code: 'DRIVE_FOLDER_CREATE_FAILED' });
  }
  await store.updateConnectionFolder(folder.id, folder.name || folderName);
  return { id: folder.id, name: folder.name || folderName, reused: false };
}

async function findFileByJob({ ctx, folderId, jobId, artifact }) {
  const { drive } = ctx;
  const q = [
    `'${escapeQueryValue(folderId)}' in parents`,
    'trashed = false',
    `appProperties has { key = 'researchhubJobId' and value = '${escapeQueryValue(jobId)}' }`,
    `appProperties has { key = 'researchhubArtifact' and value = '${escapeQueryValue(artifact)}' }`
  ].join(' and ');

  const response = await withDriveRetry(
    () => drive.files.list({
      q,
      spaces: 'drive',
      pageSize: 10,
      fields: `files(${FILE_FIELDS})`
    }),
    { context: 'Google Drive duplicate upload check' }
  );
  return response.data.files || [];
}

function buildAppProperties({ jobId, artifact, kind, extraAppProperties = {} }) {
  return {
    researchhubApp: 'researchhub',
    researchhubJobId: String(jobId),
    researchhubArtifact: artifact,
    researchhubKind: kind,
    ...Object.fromEntries(
      Object.entries(extraAppProperties || {}).map(([key, value]) => [key, String(value)])
    )
  };
}

function driveHttpError(response, context) {
  const err = new Error(`${context} failed with HTTP ${response.status}.`);
  err.response = {
    status: response.status,
    headers: Object.fromEntries(response.headers.entries()),
    data: { error: { message: `${context} failed with HTTP ${response.status}.` } }
  };
  return err;
}

async function uploadResumable({
  ctx,
  folderId,
  filePath,
  fileName,
  mimeType,
  jobId,
  artifact,
  kind,
  appProperties
}) {
  const stat = await fsp.stat(filePath);
  const tokenResponse = await ctx.oauth.getAccessToken();
  const token = tokenResponse && (tokenResponse.token || (tokenResponse.credentials && tokenResponse.credentials.access_token));
  if (!token) {
    throw new BackupError('Google did not return an access token for the upload.', {
      status: 409,
      code: 'DRIVE_RECONNECT_REQUIRED'
    });
  }
  const metadata = {
    name: fileName,
    parents: [folderId],
    mimeType,
    appProperties
  };
  const initUrl = `https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=${encodeURIComponent(FILE_FIELDS)}`;
  const initResponse = await fetch(initUrl, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json; charset=UTF-8',
      'x-upload-content-type': mimeType,
      'x-upload-content-length': String(stat.size)
    },
    body: JSON.stringify(metadata)
  });
  if (!initResponse.ok) throw driveHttpError(initResponse, `Google Drive ${artifact} upload session`);
  const location = initResponse.headers.get('location');
  if (!location) {
    throw new BackupError('Google Drive did not return a resumable upload URL.', {
      status: 502,
      code: 'DRIVE_UPLOAD_SESSION_FAILED'
    });
  }

  const uploadResponse = await fetch(location, {
    method: 'PUT',
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': mimeType,
      'content-length': String(stat.size),
      'content-range': `bytes 0-${Math.max(0, stat.size - 1)}/${stat.size}`
    },
    body: fs.createReadStream(filePath),
    duplex: 'half'
  });
  if (!uploadResponse.ok) throw driveHttpError(uploadResponse, `Google Drive ${artifact} upload`);
  const uploaded = await uploadResponse.json().catch(() => null);
  if (!uploaded || !uploaded.id) {
    throw new BackupError('Google Drive did not return an uploaded file id.', {
      status: 502,
      code: 'DRIVE_UPLOAD_FAILED'
    });
  }
  return { file: uploaded, reused: false };
}

async function verifyUploadedFile({ ctx, fileId, expectedSize, expectedMd5 }) {
  const { drive } = ctx;
  const response = await withDriveRetry(
    () => drive.files.get({
      fileId,
      fields: FILE_FIELDS
    }),
    { context: 'Google Drive upload verification' }
  );
  const file = response.data;
  if (!file || file.trashed) {
    throw new BackupError('Uploaded Google Drive file could not be verified.', { code: 'DRIVE_VERIFY_FAILED' });
  }
  if (expectedSize != null && Number(file.size) !== Number(expectedSize)) {
    throw new BackupError('Uploaded Google Drive file size does not match the local backup.', {
      code: 'DRIVE_SIZE_MISMATCH'
    });
  }
  if (expectedMd5 && file.md5Checksum && file.md5Checksum !== expectedMd5) {
    throw new BackupError('Uploaded Google Drive file checksum does not match the local backup.', {
      code: 'DRIVE_CHECKSUM_MISMATCH'
    });
  }
  return file;
}

async function uploadFile({
  ctx,
  folderId,
  filePath,
  fileName,
  mimeType = 'application/octet-stream',
  jobId,
  artifact,
  kind,
  localMd5 = null,
  extraAppProperties = {}
}) {
  const { drive } = ctx;
  const stat = await fsp.stat(filePath);
  const existingFiles = await findFileByJob({ ctx, folderId, jobId, artifact });

  for (const existing of existingFiles) {
    if (Number(existing.size) === stat.size) {
      try {
        const verified = await verifyUploadedFile({
          ctx,
          fileId: existing.id,
          expectedSize: stat.size,
          expectedMd5: localMd5
        });
        return { file: verified, reused: true };
      } catch (_) {
        await deleteDriveFile({ ctx, fileId: existing.id, ignoreNotFound: true });
      }
    } else {
      await deleteDriveFile({ ctx, fileId: existing.id, ignoreNotFound: true });
    }
  }

  const appProperties = buildAppProperties({ jobId, artifact, kind, extraAppProperties });
  const useResumable = stat.size > RESUMABLE_THRESHOLD_BYTES;

  const response = useResumable
    ? await withDriveRetry(
      () => uploadResumable({
        ctx,
        folderId,
        filePath,
        fileName,
        mimeType,
        jobId,
        artifact,
        kind,
        appProperties
      }),
      { context: `Google Drive ${artifact} resumable upload` }
    )
    : await withDriveRetry(
      () => drive.files.create({
        requestBody: {
          name: fileName,
          parents: [folderId],
          mimeType,
          appProperties
        },
        media: {
          mimeType,
          body: fs.createReadStream(filePath)
        },
        fields: FILE_FIELDS
      }),
      { context: `Google Drive ${artifact} upload` }
    );

  if (useResumable) {
    const file = response.file;
    try {
      const verified = await verifyUploadedFile({
        ctx,
        fileId: file.id,
        expectedSize: stat.size,
        expectedMd5: localMd5
      });
      return { file: verified, reused: false };
    } catch (err) {
      await deleteDriveFile({ ctx, fileId: file.id, ignoreNotFound: true }).catch(() => {});
      throw err;
    }
  }

  const file = response.data;
  if (!file || !file.id) {
    throw new BackupError('Google Drive did not return an uploaded file id.', {
      status: 502,
      code: 'DRIVE_UPLOAD_FAILED'
    });
  }

  try {
    const verified = await verifyUploadedFile({
      ctx,
      fileId: file.id,
      expectedSize: stat.size,
      expectedMd5: localMd5
    });
    return { file: verified, reused: false };
  } catch (err) {
    await deleteDriveFile({ ctx, fileId: file.id, ignoreNotFound: true }).catch(() => {});
    throw err;
  }
}

async function getFileMetadata(ctx, fileId) {
  const { drive } = ctx;
  const response = await withDriveRetry(
    () => drive.files.get({ fileId, fields: FILE_FIELDS }),
    { context: 'Google Drive metadata lookup' }
  );
  return response.data;
}

async function downloadToFile({ ctx, fileId, destination, expectedSize = null, attempts = 3 }) {
  const { drive } = ctx;
  let lastError;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      await fsp.rm(destination, { force: true });
      const response = await drive.files.get(
        { fileId, alt: 'media' },
        { responseType: 'stream' }
      );
      const stream = response.data;
      if (!stream || typeof stream.pipe !== 'function') {
        throw new BackupError('Google Drive returned an invalid download stream.', { code: 'DRIVE_DOWNLOAD_FAILED' });
      }
      await pipeline(stream, fs.createWriteStream(destination, { mode: 0o600 }));
      const stat = await fsp.stat(destination);
      if (expectedSize != null && Number(stat.size) !== Number(expectedSize)) {
        throw new BackupError('Downloaded backup size does not match the recorded size.', {
          code: 'DOWNLOAD_SIZE_MISMATCH'
        });
      }
      return { size: stat.size, sha256: await sha256File(destination) };
    } catch (err) {
      lastError = err;
      await fsp.rm(destination, { force: true }).catch(() => {});
      if (!isRetryableDriveError(err) || attempt === attempts - 1) break;
      await sleep(retryDelayMs(err, attempt));
    }
  }
  throw normalizeDriveError(lastError, 'Google Drive backup download');
}

async function openDownloadStream(ctx, fileId) {
  const { drive } = ctx;
  const response = await withDriveRetry(
    async () => {
      const metadata = await drive.files.get({ fileId, fields: FILE_FIELDS });
      const media = await drive.files.get(
        { fileId, alt: 'media' },
        { responseType: 'stream' }
      );
      return { metadata: metadata.data, stream: media.data };
    },
    { context: 'Google Drive backup download' }
  );
  return response;
}

async function deleteDriveFile({ ctx, fileId, ignoreNotFound = true }) {
  if (!fileId) return false;
  const { drive } = ctx;
  try {
    await withDriveRetry(
      () => drive.files.delete({ fileId }),
      { context: 'Google Drive file deletion', attempts: 3 }
    );
    return true;
  } catch (err) {
    if (ignoreNotFound && (err.code === 'DRIVE_NOT_FOUND' || err.status === 404)) return false;
    throw err;
  }
}

async function deleteBackupArtifacts(ctx, backup) {
  const results = { data: false, manifest: false };
  if (backup.drive_file_id) {
    results.data = await deleteDriveFile({ ctx, fileId: backup.drive_file_id, ignoreNotFound: true });
  }
  if (backup.manifest_drive_file_id) {
    results.manifest = await deleteDriveFile({ ctx, fileId: backup.manifest_drive_file_id, ignoreNotFound: true });
  }
  return results;
}

module.exports = {
  FOLDER_MIME,
  FILE_FIELDS,
  withDriveRetry,
  normalizeDriveError,
  isRetryableDriveError,
  getDriveContext,
  ensureBackupFolder,
  findBackupFolder,
  findFileByJob,
  verifyUploadedFile,
  uploadFile,
  getFileMetadata,
  downloadToFile,
  openDownloadStream,
  deleteDriveFile,
  deleteBackupArtifacts,
  escapeQueryValue
};

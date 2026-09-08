const crypto = require('crypto');
const pkg = require('@supabase/supabase-js');

let supabase = null;
let bucketReady = false;

function getClient() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variable');
  }
  if (!supabase) supabase = pkg.createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  return supabase;
}

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'research-files';

async function ensureBucket() {
  const client = getClient();
  if (bucketReady) return;
  const { data, error } = await client.storage.getBucket(BUCKET);
  if (error && (!data) && String(error.message).includes('not found')) {
    await client.storage.createBucket(BUCKET, { public: true });
  }
  bucketReady = true;
}

async function uploadFile(buffer, originalName) {
  await ensureBucket();
  const ext = originalName ? originalName.toLowerCase().split('.').pop() : 'bin';
  const key = `uploads/${crypto.randomUUID()}.${ext}`;
  const contentType = originalName && originalName.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream';
  const { error } = await getClient().storage.from(BUCKET).upload(key, buffer, { contentType });
  if (error) throw error;
  return key;
}

function publicUrl(key) {
  return `${process.env.SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${key}`;
}

module.exports = { uploadFile, publicUrl, BUCKET };
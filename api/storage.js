const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'research-files';

async function ensureBucket() {
  const { data, error } = await supabase.storage.getBucket(BUCKET);
  if (error && error.message && error.message.includes('not found')) {
    await supabase.storage.createBucket(BUCKET, { public: true });
  }
}

async function uploadFile(buffer, originalName) {
  await ensureBucket();
  const ext = originalName ? originalName.toLowerCase().split('.').pop() : 'bin';
  const key = `uploads/${crypto.randomUUID()}.${ext}`;
  const opts = originalName ? { contentType: originalName.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'application/msword' } : {};
  const { error } = await supabase.storage.from(BUCKET).upload(key, buffer, opts);
  if (error) throw error;
  return key;
}

function publicUrl(key) {
  return `${process.env.SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${key}`;
}

module.exports = { supabase, ensureBucket, uploadFile, publicUrl, BUCKET };
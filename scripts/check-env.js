const REQUIRED = ['DATABASE_URL', 'JWT_SECRET'];

const missing = REQUIRED.filter((name) => !process.env[name]);

if (missing.length) {
  console.error('\nBuild aborted: missing required environment variable(s):');
  for (const name of missing) console.error(`  - ${name}`);
  console.error('\nAdd them in Vercel -> Project -> Settings -> Environment Variables,');
  console.error('for Production, Preview and Development. See .env.example.\n');
  process.exit(1);
}

console.log('Environment check passed.');
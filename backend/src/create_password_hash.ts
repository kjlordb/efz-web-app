import { hashPassword } from './auth.js';

const password = process.argv[2];
if (!password) {
  console.error('Usage: npm run auth:hash -- "a-long-unique-password"');
  process.exitCode = 1;
} else {
  hashPassword(password)
    .then((hash) => console.log(hash))
    .catch((error: unknown) => {
      console.error(error instanceof Error ? error.message : 'Unable to create password hash.');
      process.exitCode = 1;
    });
}

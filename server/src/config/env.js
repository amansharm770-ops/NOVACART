
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config({ quiet: true });

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),

  PORT: z.coerce.number().int().positive().default(5000),

  CLIENT_ORIGINS: z
    .string()
    .default('http://localhost:5173')
    .transform((value) =>
      value.split(',').map((origin) => origin.trim()).filter(Boolean)
    )
    .pipe(z.array(z.string().url()).min(1)),

  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),

  MONGODB_URI: z.string().optional().default(''),

  // 'lax' works for localhost and for a same-site custom domain in production.
  COOKIE_SAMESITE: z.enum(['lax', 'strict', 'none']).default('lax'),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error('Invalid environment configuration:');
  console.error(result.error.flatten().fieldErrors);
  throw new Error('Please check your server/.env file.');
}

if (
  result.data.JWT_ACCESS_SECRET ===
  result.data.JWT_REFRESH_SECRET
) {
  throw new Error(
    'JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be different.'
  );
}

export const env = Object.freeze(result.data);


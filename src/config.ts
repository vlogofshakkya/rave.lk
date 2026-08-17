/**
 * Rave.LK — runtime configuration.
 *
 * Every secret is read from the environment. Nothing sensitive is committed,
 * because this repository is public.
 *
 * Set these in Vercel → Settings → Environment Variables, and in a local
 * `.env.local` for development (see .env.example).
 */

const env = (key: string, fallback = "") => process.env[key] ?? fallback;

export const config = {
  db: {
    host: env("DB_HOST"),
    port: Number(env("DB_PORT", "3306")),
    user: env("DB_USER"),
    password: env("DB_PASSWORD"),
    database: env("DB_NAME"),
    /**
     * Managed MySQL providers (Aiven, PlanetScale) require TLS. Set
     * DB_SSL=false only for a local server without certificates.
     */
    ssl: env("DB_SSL", "true") !== "false",
  },

  cloudinary: {
    cloudName: env("CLOUDINARY_CLOUD_NAME"),
    apiKey: env("CLOUDINARY_API_KEY"),
    apiSecret: env("CLOUDINARY_API_SECRET"),
  },

  /** Signs admin session cookies. Changing it signs every admin out. */
  authSecret: env("AUTH_SECRET"),

  /**
   * Public base URL. Payment return/notify URLs are built from this, so it
   * must match the deployed domain. Vercel sets VERCEL_URL automatically,
   * which covers preview deployments.
   */
  siteUrl: (() => {
    const explicit = process.env.NEXT_PUBLIC_SITE_URL;
    if (explicit) return explicit.replace(/\/$/, "");
    if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
    return "http://localhost:3000";
  })(),
} as const;

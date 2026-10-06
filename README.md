# Attendance App (Admin + Employee)
React 18 + Vite + Tailwind CSS v4 + Framer Motion + Lucide React. Dark navy theme by default.

    npm install
    npm run dev

Demo logins: Employee EMP001 / demo123, Admin ADM001 / admin123 (press Ctrl/Cmd + K for the command menu).
Accounts are capped at 10 (MAX_USERS in src/lib/api.js). Data is a localStorage mock; swap src/lib/api.js for real fetch() calls.
Fingerprint uses WebAuthn (needs https or localhost); verify the assertion on your server before production.

## Google sign-in
1. Google Cloud Console > APIs & Services > Credentials > Create OAuth client ID > Web application.
2. Authorized JavaScript origins: http://localhost:5173 and your Vercel URL.
3. Put the client ID in `.env` (copy `.env.example`) and in Vercel > Settings > Environment Variables as `VITE_GOOGLE_CLIENT_ID`, then redeploy.
4. A person can sign in with Google only if an admin has added their email (Employees > Add / Edit).

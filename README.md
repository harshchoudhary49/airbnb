# Airbnb Clone Web Application

A full-stack Airbnb clone built with Express.js, EJS, Tailwind CSS, PostgreSQL, and Prisma ORM.

---

## 🚀 Features

- **Authentication & Security**: Account registration (Guest & Host), password hashing with bcrypt, CSRF protection, Helmet security headers, rate limiting, and persistent PostgreSQL session storage (`connect-pg-simple`).
- **Listings & Booking**: Property discovery, detailed home views, host listing management, reservation booking system, and cancellation workflow.
- **Analytics & Wishlist**: Host revenue/earnings tracking, guest spend analytics with CSV export, and persistent favorites list.
- **Reviews**: Guest review submission and host rating calculations.
- **Health Checks**: `/health` endpoint with active PostgreSQL connectivity check.

---

## 🛠️ Tech Stack

- **Runtime & Backend**: Node.js, Express.js (v5)
- **Database & ORM**: PostgreSQL, Prisma ORM
- **Session Store**: `express-session` with `connect-pg-simple` (persisted in PostgreSQL)
- **Frontend / Templating**: EJS, Tailwind CSS v4, FontAwesome
- **Security**: Helmet, Express Rate Limit, CSRF token validation, bcryptjs

---

## ⚙️ Environment Variables

Create a `.env` file in the root directory (refer to `.env.example`):

| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `PORT` | Web server port | `3000` |
| `NODE_ENV` | Environment mode | `development` or `production` |
| `SESSION_SECRET` | Secret key used for signing session cookies | Random 64-char string |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/airbnb?schema=public` |

---

## 📦 Local Development

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up the Database**:
   Ensure PostgreSQL is running locally and `DATABASE_URL` is set in `.env`.
   ```bash
   # Push schema to database
   npm run db:push

   # (Optional) Seed demo homes, users, and bookings
   npm run db:seed
   ```

3. **Build Tailwind CSS**:
   ```bash
   npm run build:css
   ```

4. **Start the application**:
   ```bash
   # Development with nodemon
   npm run dev

   # Production mode
   npm start
   ```

---

## 🌐 Production Deployment

### Option 1: Deploy on Render (Recommended)

1. **Push your code to GitHub**.
2. Go to [Render Dashboard](https://dashboard.render.com/) and click **New > Blueprint**.
3. Select your repository. Render will automatically read `render.yaml` and provision:
   - A managed PostgreSQL database.
   - A Node.js web service with persistent sessions.
   - Run `npm run build && npx prisma db push` automatically.
4. (Optional) Run seed data in Render Shell:
   ```bash
   npm run db:seed
   ```

#### Manual Web Service on Render:
- **Build Command**: `npm run build:deploy`
- **Start Command**: `npm start`
- **Health Check Path**: `/health`
- **Environment Variables**:
  - `NODE_ENV`: `production`
  - `SESSION_SECRET`: `[generate random secret]`
  - `DATABASE_URL`: `[Internal connection string of your Render Postgres]`

---

### Option 2: Deploy on Railway

1. Create a new project on [Railway.app](https://railway.app/).
2. Add a **PostgreSQL** service.
3. Add a **GitHub Repo** service connected to this repository.
4. In the service settings, add the environment variables:
   - `DATABASE_URL`: `${{Postgres.DATABASE_URL}}`
   - `SESSION_SECRET`: `[generate random secret]`
   - `NODE_ENV`: `production`
5. Set Build Command: `npm run build:deploy`
6. Railway will automatically pick up the `Procfile` (`web: npm start`).

---

## 🛡️ Health & Monitoring

- Health check URL: `GET /health`
  - Returns `200 OK` with `{ status: "ok", uptime: ..., db: "connected" }` when both the app and database are healthy.

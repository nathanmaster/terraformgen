# Terraform Honeypot Management Project

This project is a full-stack application for deploying and managing honeypots using Terraform, with authentication via Auth0. It consists of:

- **Backend API** (`honeypot-management-api`): Node.js/Express API that manages honeypot deployments, user authentication, and interacts with Terraform and PostgreSQL.
- **Frontend UI** (`my-honeypot-ui`): Next.js React app for users to configure, deploy, and view their honeypots.

---

## Prerequisites

- **Node.js** (v18+ recommended)
- **npm** or **yarn**
- **PostgreSQL** database (see backend setup)
- **Terraform** installed and available in your PATH
- **Auth0** account (for authentication)
- (Optional) **Bun** or **pnpm** for frontend

---

## Backend Setup (`honeypot-management-api`)

1. **Install dependencies:**
   ```bash
   cd honeypot-management-api
   npm install
   ```

2. **Configure environment variables:**
   - Copy `.env` and set your Auth0 domain and audience.
   - Ensure your PostgreSQL credentials in `server.js` match your local setup.

3. **Prepare the database:**
   - Create a PostgreSQL database named `honeypots`.
   - Create tables:
     ```sql
     CREATE TABLE users (
       id SERIAL PRIMARY KEY,
       auth0_sub TEXT UNIQUE NOT NULL
     );
     CREATE TABLE honeypots (
       id SERIAL PRIMARY KEY,
       user_id TEXT NOT NULL,
       region TEXT,
       instance_type TEXT,
       cowrie_config TEXT,
       outputs JSONB,
       status TEXT
     );
     ```

4. **Run the backend server:**
   ```bash
   node server.js
   ```
   - The API will be available at `http://localhost:3001/api`.

---

## Frontend Setup (`my-honeypot-ui`)

1. **Install dependencies:**
   ```bash
   cd my-honeypot-ui
   npm install
   ```

2. **Configure environment variables:**
   - Copy `.env.production` to `.env.local` and set your Auth0 credentials and API URL if needed.

3. **Run the frontend:**
   ```bash
   npm run dev
   ```
   - The app will be available at [http://localhost:3000](http://localhost:3000).

---

## What Happens When Running

- **Authentication:** Users log in via Auth0.
- **Deploying Honeypots:** Users fill out a form to deploy a honeypot. The frontend sends the configuration to the backend API, which triggers Terraform to provision resources (e.g., AWS EC2 with Cowrie).
- **Database:** Honeypot deployments and user info are stored in PostgreSQL.
- **Dashboard:** Users can view their deployed honeypots and their status.

---

## Troubleshooting

- Ensure Terraform is installed and accessible in your PATH.
- The backend must be running before using the frontend.
- Check your Auth0 settings and environment variables if authentication fails.
- For CORS issues, ensure the backend allows requests from the frontend origin.

---

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Express Documentation](https://expressjs.com/)
- [Terraform Documentation](https://www.terraform.io/docs)
- [Auth0 Documentation](https://auth0.com/docs/)

---

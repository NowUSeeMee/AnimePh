# AnimePh Deployment Guide

Follow these steps to deploy your AnimePh application for free.

## 1. Database (Aiven)
1.  Sign up at [Aiven.io](https://aiven.io/).
2.  Create a new **MySQL** service on the Free plan.
3.  Once the service is running, copy the **Connection details**:
    - Host
    - Port
    - User (`avnadmin`)
    - Password
4.  Download the **CA Certificate** if you plan to use strict SSL.
5.  Use a tool like MySQL Workbench or run `node backend/init-db.js` (after updating your local `.env`) to create the tables.

## 2. Backend (Render)
1.  Create a new Web Service on [Render](https://render.com/).
2.  Connect your GitHub repository.
3.  Set the following configuration:
    - **Root Directory**: `backend`
    - **Environment**: `Node`
    - **Build Command**: `npm install`
    - **Start Command**: `npm start`
4.  Add **Environment Variables**:
    - `DB_HOST`: (From Aiven)
    - `DB_PORT`: (From Aiven)
    - `DB_USER`: `avnadmin`
    - `DB_PASSWORD`: (From Aiven)
    - `DB_NAME`: `defaultdb`
    - `DB_SSL`: `true`
    - `FRONTEND_URL`: `https://your-animeph.vercel.app`

## 3. Frontend (Vercel)
1.  Create a new project on [Vercel](https://vercel.com/).
2.  Connect your GitHub repository.
3.  Set the following configuration:
    - **Root Directory**: `frontend`
    - **Framework Preset**: `Vite`
4.  Add **Environment Variables**:
    - `VITE_API_URL`: `https://your-backend-url.onrender.com/api`
5.  Deploy!

---

### Tips for Fast Reload & Stability
- **Wake up Render**: Since Render's free tier sleeps, the first load after 15 mins might be slow.
- **CORS**: If you get a CORS error, double-check that `FRONTEND_URL` in Render matches your Vercel URL exactly.

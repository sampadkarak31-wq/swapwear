# SwapWear

A clothing exchange marketplace — trade what you no longer wear for something you'll love, without money changing hands.

## Stack

- **Backend:** Node.js, Express, MongoDB (Mongoose), Socket.IO, JWT auth, bcrypt, Multer + Cloudinary for image storage
- **Frontend:** Vanilla HTML/CSS/JS single-page app (hash-based router), served statically by the same Express server
- **Security:** Helmet, CORS, rate limiting, MongoDB sanitization, XSS cleaning, role-based admin middleware

This is a **single-service deployment**: Express serves both the `/api/*` routes and the static frontend, so it deploys as one web service on Render (no separate frontend host required).

## Project structure

```
swapwear/
├── backend/
│   ├── config/          # MongoDB + Cloudinary/Multer config
│   ├── controllers/     # Route handler logic
│   ├── middleware/      # auth, admin, error handling
│   ├── models/          # Mongoose schemas (User, Listing, SwapRequest, Message, Notification, Wishlist, Review)
│   ├── routes/          # Express routers
│   ├── utils/           # token helper, DB seed script
│   ├── server.js        # entry point (Express + Socket.IO)
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── css/style.css
│   ├── js/
│   │   ├── api.js       # fetch wrapper for the REST API
│   │   ├── state.js     # session + socket state
│   │   ├── ui.js        # toasts, formatting helpers
│   │   ├── router.js    # hash-based SPA router
│   │   ├── app.js       # bootstrap
│   │   └── pages/       # one file per page/view
│   └── index.html
├── render.yaml
└── package.json
```

## Local setup

### 1. Prerequisites
- Node.js 18+
- A MongoDB connection string (local MongoDB or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster)
- A free [Cloudinary](https://cloudinary.com) account (for image uploads)

### 2. Configure environment variables

```bash
cd backend
cp .env.example .env
```

Fill in `.env` with your real `MONGO_URI`, `JWT_SECRET`, and Cloudinary credentials.

### 3. Install and run

```bash
# from the project root
npm install       # installs backend dependencies
npm run dev        # starts the server with nodemon on http://localhost:5000
```

Open `http://localhost:5000` — the same server serves both the API and the frontend.

### 4. Create an admin account (optional)

Set `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `.env`, then run:

```bash
npm run seed
```

This creates (or confirms) an admin user you can log in with to access `/#/admin`.

## Deploying to Render

1. Push this repository to GitHub.
2. In Render, choose **New Web Service** → connect the repo. Render will detect `render.yaml` and use it automatically (or set Root Directory to `backend`, Build Command `npm install`, Start Command `npm start`).
3. Add the environment variables Render prompts for: `MONGO_URI` (from MongoDB Atlas), `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, and `CLIENT_URL` (your Render URL, e.g. `https://swapwear.onrender.com`).
4. Deploy. Because the frontend is static files served by the same Express app, there is nothing separate to deploy to Vercel — one Render service is enough. (If you'd prefer to split them, the `frontend/` folder can be deployed to Vercel as a static site with `CLIENT_URL`/API base updated to point at the Render backend.)

## API overview

| Area | Endpoints |
|---|---|
| Auth | `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`, `POST /api/auth/forgot-password`, `POST /api/auth/reset-password/:token` |
| Listings | `GET /api/listings`, `GET /api/listings/:id`, `POST /api/listings`, `PUT /api/listings/:id`, `DELETE /api/listings/:id` |
| Users | `GET /api/users/:id`, `PATCH /api/users/profile`, `GET /api/users/wishlist`, `POST /api/users/wishlist/:listingId` |
| Swaps | `POST /api/swaps`, `GET /api/swaps`, `PATCH /api/swaps/:id` |
| Messages | `GET /api/messages/:swapId`, `POST /api/messages/:swapId` |
| Notifications | `GET /api/notifications`, `PATCH /api/notifications/:id/read`, `PATCH /api/notifications/read-all` |
| Admin | `GET /api/admin/stats`, `GET /api/admin/users`, `DELETE /api/admin/users/:id`, `PATCH /api/admin/users/:id/ban`, `GET /api/admin/listings`, `DELETE /api/admin/listings/:id` |

Real-time chat runs over Socket.IO on the same server (JWT passed via `socket.handshake.auth.token`), with events `joinSwap`, `newMessage`, `typing`, `stopTyping`, and `notification`.

## What's built vs. what's left as a next step

**Built and working end-to-end:** registration/login (JWT + bcrypt), listing CRUD with multi-image Cloudinary upload, browse with search/filter/sort/pagination, wishlist, swap request lifecycle (pending → accepted/rejected → completed/cancelled) with listing status syncing, real-time chat with typing indicators and image sharing, notifications, user dashboard, public profiles, and an admin dashboard with stats/user/listing management and ban/delete actions.

**Reasonable next steps if you want to keep extending it:** transactional email delivery for verification/reset links (currently logged server-side in development, not actually emailed), a review-submission UI (the model and read side exist; there's no "leave a review" form yet), Google/GitHub OAuth, and PWA/push notifications. These were left out of this first pass so the core marketplace loop would be genuinely complete and deployable rather than having every bonus feature half-built.

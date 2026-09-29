# 🏡 Airbnb Clone — Full-Stack MVC Web Application

A full-stack, server-side rendered **Airbnb Clone** built with **Node.js**, **Express.js**, **EJS**, and styled with **Tailwind CSS**. It follows the **MVC (Model-View-Controller)** design pattern and includes role-based authentication, user sessions, host listing management, and guest booking workflows.

---

## ✨ Features

### 👤 Guest Experience
- **Explore & Browse**: View verified listings with high-resolution imagery, pricing, and ratings.
- **Search & Filters**: Search listings in real-time by city or property title.
- **Property Details**: View detailed amenities (Wi-Fi, parking, kitchen, AC), descriptions, and host info.
- **Wishlists / Favorites**: Toggle heart icons on listings to maintain a private saved favorites collection.
- **Reservation & Booking**: Live date calculation (check-in / check-out), guest selection, and automatic pricing breakdown.
- **Trip Management**: View confirmed bookings and easily cancel upcoming reservations.

### 🏠 Host Dashboard
- **Host Privileges**: Restricted access to verified host accounts via `isHost` middleware.
- **Publish Listings**: Register new properties with location, nightly price, photos, and descriptions.
- **Listing Management**: Hosts can only edit and delete properties they personally created.
- **Authentic Ratings**: Newly listed properties default to a `★ New` badge until guests leave reviews.

### 🔒 Security & Architecture
- **Authentication**: User registration and login powered by secure **`bcryptjs`** password hashing.
- **Session Management**: Cookie-based session tracking via **`express-session`**.
- **Role-Based Access Control (RBAC)**: Custom `isAuth` and `isHost` middleware guarding routes with clean HTTP 403 / redirect fallbacks.
- **Data Persistence**: Asynchronous JSON file-based database for homes, users, bookings, and favorites.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Runtime** | Node.js |
| **Backend Framework** | Express.js (v5.x) |
| **Architecture** | MVC (Model-View-Controller) |
| **Templating Engine** | EJS (Embedded JavaScript) |
| **Styling** | Tailwind CSS & FontAwesome Icons |
| **Authentication** | bcryptjs & express-session |
| **Storage** | File-based JSON Mock Database (`fs`) |

---

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/harshchoudhary49/airbnb.git
cd airbnb
```

### 2. Install dependencies
```bash
npm install
```

### 3. Start the development server
```bash
npm run dev
# or
npm start
```

Open your browser and navigate to:
👉 **[http://localhost:3000](http://localhost:3000)**

---

## 🔑 Demo Accounts

For immediate testing, use the pre-seeded credentials below:

| Role | Email | Password | Privileges |
|---|---|---|---|
| **Host** | `host@airbnb.com` | `password123` | Can access Host Dashboard, add, edit, and delete listings |
| **Guest** | `guest@airbnb.com` | `password123` | Can browse, favorite, and book stays (blocked from `/host`) |

*(You can also click **"Sign Up"** to create a new custom Host or Guest account)*

---

## 📂 Project Structure

```text
├── src/
│   ├── app.js               # Express application initialization & middleware
│   ├── controllers/         # Request handling & view orchestration
│   │   ├── auth-controller.js
│   │   ├── host-controller.js
│   │   └── store-controller.js
│   ├── data/                # Mock JSON database storage
│   │   ├── homes.json
│   │   ├── users.json
│   │   ├── bookings.json
│   │   └── favorites.json
│   ├── middleware/          # Route protection guards (isAuth, isHost)
│   ├── models/              # Business logic & data models (User, Home, Booking, Favorite)
│   ├── public/              # Static assets & compiled Tailwind CSS
│   ├── routes/              # Express modular routers (auth, host, store)
│   ├── utils/               # Path utilities
│   └── views/               # Dynamic EJS templates
│       ├── auth/            # Login & signup views
│       ├── host/            # Host dashboard & listing forms
│       ├── partials/        # Reusable header and navigation
│       └── store/           # Catalog, detail, booking, and favorites views
├── .gitignore
├── package.json
└── tailwind.config.js
```

---

## 📄 License
This project is open-source and available under the [ISC License](LICENSE).

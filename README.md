# 🎬 Open Kino

**Open Kino** is a simple and modern movie streaming platform built with React, Node.js, and MongoDB. Users can browse a catalog of movies, register/login, and manage their personal watchlist.

## 🔧 Tech Stack

### 🔙 Backend

* **Node.js** – JavaScript runtime for server-side development.
* **Express.js** – Web framework for creating RESTful APIs.
* **MongoDB** – NoSQL database to store users, movies, and lists.
* **Mongoose** – ODM for MongoDB to define schemas and models.

### 🔝 Frontend

* **React.js** – Frontend library for building UI components.
* **React Router** – Handles routing between pages (Home, Login, Movie Page).
* **Fetch / Axios** – For HTTP requests to the backend API.

## 🚀 Features

* User registration and login (with JWT authentication).
* Display movie list with title, genre, and description.
* Add movies to personal “My List”.
* Individual movie pages with detailed info.
* Simple and clean UI for user interaction.


## 📦 How to Run the Project

### 1. Clone the repository

```bash
git clone https://github.com/jitter200/open-kino.git
cd open-kino
```

### 2. Install dependencies

#### Backend:

```bash
cd server
npm install
```

#### Frontend:

```bash
cd ../client
npm install
```

### 3. Set up environment variables

Create a `.env` file in the `server/` folder with the following values:

```
PORT=5000
MONGO_URI=mongodb://localhost:27017/openkino
JWT_SECRET=your_jwt_secret_key
```

### 4. Start the development servers

#### Backend:

```bash
cd server
npm run dev
```

#### Frontend:

```bash
cd ../client
npm start
```

Then go to [http://localhost:3000](http://localhost:3000) to see the app in action.

## 📁 Project Structure

```
open-kino/
├── client/           # React frontend
├── server/           # Node.js + Express backend
│   ├── models/       # Mongoose models
│   ├── routes/       # API endpoints
│   └── controllers/  # Business logic
├── screenshots/      # UI screenshots
└── README.md
```

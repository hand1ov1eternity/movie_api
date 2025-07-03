## 🚀 Features

- 📚 **Browse Movies**
  - Retrieve a list of all movies or get details by title.
- 🎭 **Explore Genres & Directors**
  - Look up genre and director information.
- 👤 **User Management**
  - Register, update, or delete user accounts.
- ⭐ **Favorites**
  - Add or remove favorite movies for any user.

---

## 🛠️ Technologies Used

JavaScript
Node.js
Express.js
MongoDB
Mongoose
PostgreSQL
JSON
Render

---

## 📦 Installation

Clone the repository and install dependencies:

```bash
# Step 1: Clone the repository
git clone https://github.com/hand1ov1eternity/movie_api.git

# Step 2: Navigate into the project directory
cd movie_api

# Step 3: Install dependencies
npm install
⚙️ Usage
Run the API server locally:

node index.js
The API will be available at:

http://localhost:3000
Use Postman, cURL, or any HTTP client to interact with the endpoints.

📚 Endpoints Overview
🎞️ Movies
GET /movies
Retrieve a list of all movies.

GET /movies/:title
Get details about a movie by title.

🏷️ Genres
GET /genres/:name
Retrieve information about a genre.

🎬 Directors
GET /directors/:name
Get information about a director.

👥 Users
POST /users
Register a new user.

PUT /users/:username
Update user details.

POST /users/:username/movies/:movieID
Add a movie to user's favorites.

DELETE /users/:username/movies/:movieID
Remove a movie from user's favorites.

DELETE /users/:username
Delete a user account.

📖 Documentation
For detailed API specs, see:

API Documentation

TypeDoc output located in the out/ folder.

✨ Deployment
This API is deployed using Render for easy cloud hosting and scaling.

---

> Built with Express, MongoDB, and a love of movies 🍿 — always a work in progress 🚧.

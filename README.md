## 🎯 Features

- 🎥 **Movies**
  - Retrieve a list of all movies
  - Get details for a specific movie by title

- 🎭 **Genres**
  - Look up information about genres

- 🎬 **Directors**
  - Get details about directors by name

- 👤 **Users**
  - User registration and account management
  - Add/remove favorite movies
  - Update user details
  - Delete user accounts

---

## 🛠️ Technologies Used

JavaScript
Node.js
Express.js
MongoDB & Mongoose
PostgreSQL
JSON
Render (deployment)

yaml
Kopieren

---

## ⚙️ Installation

Follow these steps to set up the project locally:

1️⃣ **Clone the repository:**

```bash
git clone https://github.com/hand1ov1eternity/movie_api.git
2️⃣ Navigate to the project directory:

bash
Kopieren
cd movie_api
3️⃣ Install dependencies:

bash
Kopieren
npm install
🚀 Usage
After installing dependencies, start the API server with:

bash
Kopieren
node index.js
By default, the API will run at:

arduino
Kopieren
http://localhost:3000
Use tools like Postman, curl, or any HTTP client to interact with the endpoints.

🛣️ API Endpoints Overview
🎬 Movies
GET /movies — Get all movies

GET /movies/:title — Get movie details by title

🎭 Genres
GET /genres/:name — Get genre info by name

🎬 Directors
GET /directors/:name — Get director info by name

👤 Users
POST /users — Register a new user

PUT /users/:username — Update user details

POST /users/:username/movies/:movieID — Add a movie to favorites

DELETE /users/:username/movies/:movieID — Remove a movie from favorites

DELETE /users/:username — Delete user account

For complete details, please see the API Documentation and the TypeDoc output in the out/ folder.

🖥️ Deployment
This API can be deployed on Render or similar cloud platforms. Make sure to configure environment variables for database connections and other sensitive settings.

✨ Contributing
Feel free to fork this repository, open issues, and submit pull requests. Contributions are always welcome!

🎬 Crafted with Node.js and a love for movies.

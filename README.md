# Movie API

Welcome to the Movie API! This is a RESTful API that provides users with the ability to interact with movie data, including movies, genres, directors, and user-specific actions such as registration, favorites, and more.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Endpoints](#endpoints)
- [License](#license)

## Installation

To get started with the Movie API, clone this repository to your local machine and install the required dependencies.

Step 1: Clone the repository

```bash
git clone https://github.com/hand1ov1eternity/movie_api.git
```
Step 2: Navigate to the project directory

```bash
cd movie_api
```
Step 3: Install dependencies

```bash
npm install
```
Usage
After installing the dependencies, you can run the API server by using the following command:

```bash
npm start
```

The server will start and you can make requests to the API using Postman or any HTTP client. The default API URL is:

```bash
http://localhost:3000
```
**Endpoints**

Here is a brief overview of the available API endpoints:

Movies Endpoints

* GET /movies - Get a list of all movies

* GET /movies/:title - Get detailed information about a movie by title

Genres Endpoints

* GET /genres/:name - Get information about a genre by name

Directors Endpoints

*GET /directors/:name - Get information about a director by name

Users Endpoints

* POST /users - Register a new user

* PUT /users/:username - Update user details (username, email, etc.)

* POST /users/:username/movies/:movieID - Add a movie to the user's favorites

* DELETE /users/:username/movies/:movieID - Remove a movie from the user's favorites

* DELETE /users/:username - Delete the user from the system

For more details on the API, check out the API Documentation.






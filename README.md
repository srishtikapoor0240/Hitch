# 🚗 Hitch – Ride Sharing Web App

Hitch is a full-stack ride-sharing web application that enables users to **offer rides, find rides, and manage bookings seamlessly**. Built with a clean frontend and a Firebase-powered backend, the platform focuses on simplicity, usability, and real-time interaction.

---

## ✨ Features

* 🔍 **Find a Ride** – Browse available rides based on location and preferences
* 🚘 **Offer a Ride** – Publish ride details for others to join
* 📋 **Manage Rides** – View and track your bookings and offers
* 🔐 **Authentication System** – Secure user login and verification
* ⚡ **Real-time Backend** – Powered by Firebase Admin SDK

---

## 🛠️ Tech Stack

### Frontend

* HTML5
* CSS3
* JavaScript (Vanilla JS)

### Backend

* Node.js
* Express.js
* Firebase Admin SDK

### Tools & APIs

* Firebase Authentication
* Firestore Database
* Postman (API Testing)

---

## 📁 Project Structure

```
Hitch/
│
├── rideshare-app/
│   ├── index.html
│   ├── login.html
│   ├── find-ride.html
│   ├── offer-ride.html
│   ├── my-rides.html
│   ├── utils.js
│   ├── style.css
│   ├── server.js
│   ├── package.json
│
└── README.md
```

---

## 🚀 Getting Started

### 1. Clone the repository

```
git clone https://github.com/srishtikapoor0240/Hitch.git
cd Hitch
```

### 2. Install dependencies

```
npm install
```

### 3. Setup environment

* Add your Firebase service credentials locally
* Ensure sensitive files are NOT pushed to GitHub

### 4. Run the server

```
node server.js
```

---

## 🔒 Security Note

Sensitive files like:

* `serviceAccount.json`
* `.env`

are excluded using `.gitignore` to ensure **secure handling of credentials**.

---

## 📌 Future Improvements

* 🌍 Location-based filtering using maps API
* 📱 Mobile responsiveness improvements
* 💳 Payment integration
* 🔔 Real-time notifications

---


## 🌟 Acknowledgements

This project was built as part of a collaborative learning experience, focusing on real-world development practices including Git workflows, API integration, and secure backend handling.

---


# 🎤 InterviewBuddy AI

An AI-powered mock interview platform that helps users prepare for technical and HR interviews through intelligent question generation, resume analysis, and real-time AI feedback.

---

## 🚀 Features

- 🔐 Google Authentication (Firebase)
- 📄 AI Resume Analysis
- 🤖 AI-Powered Interview Question Generation
- 💬 Technical, HR & Behavioral Interview Modes
- 📚 Interview History
- 💳 Credit-Based Interview System
- 📊 Performance Report
- ☁️ MongoDB Atlas Integration
- ⚡ OpenRouter LLM Integration

---

## 🛠 Tech Stack

### Frontend
- React.js
- Vite
- Redux Toolkit
- Axios
- Firebase Authentication

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT Authentication
- Multer

### AI
- Groq Cloud API (Llama 3.3 70B Versatile)
- LLM-based Resume Analysis
- AI Interview Question Generation

---

## 📁 Project Structure

```
InterviewBuddy
│
├── client
│   ├── src
│   ├── public
│   └── package.json
│
├── server
│   ├── controllers
│   ├── routes
│   ├── models
│   ├── services
│   ├── middleware
│   └── package.json
│
└── README.md
```

---

## ⚙️ Installation

### Clone Repository

```bash
git clone https://github.com/1ssatyamsingh/InterviewBuddy.git
```

### Install Frontend

```bash
cd client
npm install
```

### Install Backend

```bash
cd ../server
npm install
```

---

## 🔑 Environment Variables

### Client

```
VITE_FIREBASE_APIKEY=
VITE_RAZORPAY_KEY_ID=
VITE_SERVER_URL=http://localhost:8080
```

`VITE_SERVER_URL` is optional for local development; the client defaults to `http://localhost:8080`. Set it to your deployed API base URL for production.

### Server

```
PORT=8080
MONGODB_URL=
JWT_SECRET=
GROQ_API_KEY=
GROQ_MODEL=llama-3.3-70b-versatile
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
DNS_SERVERS=1.1.1.1,1.0.0.1
CLIENT_URL=http://localhost:5173
```

`DNS_SERVERS` is optional. Set it only if your system DNS cannot resolve MongoDB Atlas; otherwise, leave it unset.
`CLIENT_URL` should match the client origin, including its port.

---

## 🌐 Deployment (Render + Vercel)

### 1. Deploy Backend on Render
1. Create a new **Web Service** on [Render](https://render.com).
2. Connect your GitHub repository.
3. Configure the service:
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node index.js`
   - **Health Check Path**: `/`
4. Add the required Environment Variables in the Render dashboard:
   - `NODE_ENV`: `production` *(required for secure cross-site cookies)*
   - `MONGODB_URL`: Your MongoDB Atlas URI
   - `JWT_SECRET`: Any long secure secret string
   - `GROQ_API_KEY`: Your Groq Cloud API key
   - `GROQ_MODEL`: `llama-3.3-70b-versatile`
   - `CLIENT_URL`: `https://<your-vercel-domain>.vercel.app` *(update once frontend is deployed)*
   - `RAZORPAY_KEY_ID`: Your Razorpay Key ID
   - `RAZORPAY_KEY_SECRET`: Your Razorpay Key Secret
   - `DNS_SERVERS`: `1.1.1.1,1.0.0.1` *(recommended for MongoDB Atlas resolution)*
   - `OPENAI_API_KEY`: *(Optional, for backend TTS)*
5. Deploy the service and copy your Render URL (e.g., `https://interviewbuddy-api.onrender.com`).

*(Alternatively, use Render's Blueprint feature with the included `render.yaml` file)*

### 2. Deploy Frontend on Vercel
1. Go to [Vercel](https://vercel.com) and click **Add New > Project**.
2. Import your GitHub repository.
3. Under **Project Settings**:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click *Edit* and select `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add Environment Variables:
   - `VITE_SERVER_URL`: `https://<your-render-backend>.onrender.com` *(without trailing slash)*
   - `VITE_FIREBASE_APIKEY`: Your Firebase API key
   - `VITE_RAZORPAY_KEY_ID`: Your Razorpay Key ID
5. Click **Deploy**.

### 3. Connect & Authorize Domains
1. **Update Render CORS**: Set `CLIENT_URL` in your Render Web Service settings to your live Vercel URL (e.g., `https://interviewbuddy.vercel.app`) without trailing slashes.
2. **Authorize Firebase Domain**:
   - Open [Firebase Console](https://console.firebase.google.com).
   - Navigate to **Authentication** > **Settings** > **Authorized domains**.
   - Click **Add domain** and enter your Vercel domain (`<your-app>.vercel.app`).
   - If using a custom domain, add that as well.

---

**Satyam Singh**

GitHub:
https://github.com/1ssatyamsingh

---

⭐ If you found this project useful, consider giving it a star!

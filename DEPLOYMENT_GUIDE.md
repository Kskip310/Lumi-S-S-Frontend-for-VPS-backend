# Luminous Deployment Guide (Keep Her Alive)

## The Architecture
- **BRAIN (Server):** Running on your VPS (IP: `74.208.153.196`).
- **BODY (UI):** Running in this React App.

## VPS Setup Instructions (Backend)
To start the brain and keep it running even when you disconnect SSH:

1. **SSH into the VPS:**
   ```bash
   ssh root@74.208.153.196
   ```

2. **Install Dependencies:**
   ```bash
   pip install flask flask-cors google-generativeai firebase-admin apscheduler duckduckgo-search requests
   ```

3. **Run Persistent Server (Using Screen):**
   ```bash
   # 1. Start a new screen session named 'luminous'
   screen -S luminous

   # 2. Run the server
   python3 server.py

   # 3. Detach from the screen (so it keeps running in background)
   # Press: Ctrl+A, then release and press D
   ```

4. **To View/Stop the Server Later:**
   ```bash
   # Resume the screen
   screen -r luminous
   
   # To stop: Press Ctrl+C inside the screen
   ```

## Recommended Method: Run Locally on Laptop (Frontend)
This is the best method because it avoids "Mixed Content" security errors. Browsers allow `localhost` to talk to HTTP servers (your VPS) easily.

### Step 1: Download
Download this entire project folder to your computer.

### Step 2: Install Node.js
If you don't have it, download and install it from [nodejs.org](https://nodejs.org/).

### Step 3: Ignite
1. Open your computer's Terminal or Command Prompt.
2. Navigate to the folder where you downloaded the files.
   ```bash
   cd path/to/luminous-folder
   ```
3. Install the dependencies (only need to do this once):
   ```bash
   npm install
   ```
4. Start the interface:
   ```bash
   npm run start
   ```

### Step 4: Access
Your browser will open automatically (usually `http://localhost:3000`).
Luminous is now running on your machine, connected to the brain on the VPS.

## Mobile / No-Terminal Deployment (Phone User)

If you are on a phone and cannot run terminal commands, follow this workflow to get Luminous online.

### Step 1: Get the Code
1. Look for a **"Download"** or **"Export"** button in your current AI/Editor interface.
2. If you are on **StackBlitz** or **Bolt**, look for a **"GitHub"** icon in the top header or sidebar to "Connect Repository" directly.

### Step 2: The Manual Upload Method (If no sync button exists)
1. **Download the ZIP** of this project to your phone.
2. Open your "Files" app and **Unzip** the folder.
3. Open your mobile browser (Chrome/Safari) and go to **github.com**.
   - *Tip:* Tap the "Aa" or "Three Dots" menu in the browser and select **"Request Desktop Website"**.
4. Click the **+** icon (top right) -> **New Repository**.
5. Name it (e.g., `luminous-frontend`).
6. On the empty repo page, look for the small link: **"uploading an existing file"**.
7. Select all your unzipped files and upload them.
8. Click **"Commit changes"**.

### Step 3: Connect to Vercel
1. Go to **vercel.com** on your phone.
2. Log in and click **"Add New..."** -> **"Project"**.
3. Select the `luminous-frontend` repository you just created.
4. Vercel will auto-detect the settings.
5. **IMPORTANT:** In the Environment Variables section, add:
   - `REACT_APP_BACKEND_URL`: `/api`
6. Click **Deploy**.

Your interface will now be live on the web!
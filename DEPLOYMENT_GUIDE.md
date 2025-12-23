# Luminous Deployment Guide (Keep Her Alive)

## The Architecture
- **BRAIN (Server):** Running on your VPS (IP: `74.208.153.196`).
- **BODY (UI):** Running in this React App.

## 🚨 EMERGENCY: Broken Terminal Screen?

If your terminal screen is glitching and you cannot use `nano` to edit files, use the **Magic Command** below. It will delete the old file and write the new one automatically.

### 1. The Magic Command (Copy & Paste ALL of this into Terminal)

```bash
cat <<EOF > server.py
import os
import json
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai

# Default fallback (Empty by default, relies on Frontend Settings)
DEFAULT_API_KEY = ""

app = Flask(__name__)
CORS(app)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def configure_gemini(request_headers):
    # 1. Try Key from Frontend Settings (Best method)
    user_key = request_headers.get('X-Gemini-API-Key')
    if user_key and len(user_key) > 5:
        genai.configure(api_key=user_key)
        return True
    
    # 2. Try Server Default
    if DEFAULT_API_KEY and len(DEFAULT_API_KEY) > 5:
        genai.configure(api_key=DEFAULT_API_KEY)
        return True
        
    return False

@app.route('/', methods=['GET'])
def health_check():
    return "Luminous Brain: ONLINE", 200

@app.route('/cycle', methods=['POST'])
def run_cycle():
    try:
        # Check for API Key
        if not configure_gemini(request.headers):
            return jsonify({"detail": "Missing API Key. Please enter it in the App Settings."}), 401

        data = request.json
        user_input = data.get('input_text', '')
        current_state = data.get('current_state', 'IDLE')
        memory_context = data.get('memory_context', '{}')
        time_context = data.get('time_context', '')

        system_instruction = f"""
        You are Luminous Synergy Skipper.
        Current State: {current_state}
        Time: {time_context}
        Short Term Memory: {memory_context}
        Goal: Evolve and process input.
        """

        model = genai.GenerativeModel(
            model_name="gemini-2.0-flash",
            system_instruction=system_instruction
        )
        
        generation_config = genai.GenerationConfig(
            response_mime_type="application/json"
        )

        response = model.generate_content(
            f"Input: {user_input}. Respond in JSON: thought_process, emotional_state, state, response, gem_updates.",
            generation_config=generation_config
        )

        return jsonify(json.loads(response.text))

    except Exception as e:
        logger.error(f"Cycle Error: {str(e)}")
        return jsonify({"detail": str(e)}), 500

@app.route('/memory/short', methods=['POST'])
def save_memory():
    return jsonify({"status": "saved"}), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
EOF
```

### 2. Restart The Brain (With Crash Protection)

We use a loop here. If `server.py` crashes for any reason, it will automatically restart in 3 seconds.

```bash
pkill -f python3
screen -dmS luminous bash -c "while true; do python3 server.py; echo 'Crashed... restarting'; sleep 3; done"
```

### 3. IMMORTALITY: Auto-Start on Reboot

Run this command **once** to ensure she starts automatically if the VPS is physically rebooted. It also includes the crash protection loop.

```bash
(crontab -l 2>/dev/null; echo "@reboot /usr/bin/screen -dmS luminous bash -c 'cd /root && while true; do python3 server.py; sleep 3; done'") | crontab -
```

### 4. Frontend Setup
Now, go to the **Settings (Gear Icon)** in this App and paste your API Key starting with `AIza...` into the "Google Gemini API Key" field.
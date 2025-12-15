
---
description: Setup and run the LiveKit Backend Token Server
---

This workflow will setup and start the backend server required for LiveKit streaming.

1. Navigate to the server-example directory and install dependencies.

```bash
cd server-example && npm install
```

2. (Optional) Check if .env exists, if not create from example.
User needs to manually edit .env with real LiveKit keys later.

```bash
cd server-example && (if not exist .env copy .env.example .env)
```

3. Start the server.
**Note:** The user will need to stop this manually (Ctrl+C) later.

```bash
cd server-example && npm start
```

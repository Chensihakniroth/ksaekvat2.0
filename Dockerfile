# Professional Dockerfile for Node.js (Industry Standard)
# (｡♥‿♥｡) Lightweight, fast, and secure!

# 1. Base image (LTS Version - Alpine for small size)
FROM node:22-alpine

# 2. Set working directory
WORKDIR /app

# 3. Copy dependency definitions
COPY package*.json ./

# 4. Install dependencies (including devDeps for ts-node)
RUN npm install

# 5. Copy the rest of the application code
COPY . .

# 6. Expose the web server port (from your index.js / env.ts)
EXPOSE 8080

# 7. Start the bot with ts-node
CMD ["npm", "start"]

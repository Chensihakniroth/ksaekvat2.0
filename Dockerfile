# Professional Dockerfile for KsaeKvat Bot + Dashboard
# (｡♥‿♥｡) Lightweight, fast, and secure!

# 1. Base image (LTS Version - Alpine for small size)
FROM node:22-alpine

# 2. Set working directory
WORKDIR /app

# 3. Install necessary system fonts for Sharp SVG text rendering
RUN apk add --no-cache fontconfig ttf-dejavu

# 4. Copy ROOT dependency definitions and install
COPY package*.json ./
RUN npm install

# 5. Copy DASHBOARD dependency definitions and install
COPY dashboard/package*.json ./dashboard/
RUN cd dashboard && npm install

# 6. Copy the rest of the application code
COPY . .

# 7. Build dashboard (Vite) + compile bot (TypeScript)
RUN npm run build

# 8. Expose the web server port
EXPOSE 8080

# 9. Start the bot (serves API + dashboard)
CMD ["npm", "start"]

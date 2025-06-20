FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Create Next.js config
RUN echo 'module.exports = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    appDir: false
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_GENOMICS_API_URL: process.env.NEXT_PUBLIC_GENOMICS_API_URL
  }
}' > next.config.js

# Create Tailwind CSS config
RUN echo 'module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {}
  },
  plugins: []
}' > tailwind.config.js

# Create PostCSS config
RUN echo 'module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {}
  }
}' > postcss.config.js

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "run", "dev"]

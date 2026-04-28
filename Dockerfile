FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Exponemos el puerto de Vite (5173) o de CRA (3000)
EXPOSE 5173

# Comando para iniciar en modo desarrollo y permitir conexiones externas (--host)
CMD ["npm", "run", "dev", "--", "--host"]
# Usa una imagen de Node.js
FROM node:18

# Crea un directorio de trabajo
WORKDIR /app

# Copia los archivos de dependencias e instálalas
COPY package*.json ./
RUN npm install

# Se copia el resto de los archivos
COPY . .

# Expone el puerto 3000 
EXPOSE 3000

# Ejecuta la aplicación
CMD ["node", "app.js"]

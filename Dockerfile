# Importando a imagem base do node
FROM node:16

RUN apt-get update \
  && apt-get install -y sox libsox-fmt-mp3

# libsox-fmt-all

# Diretório com as informações, onde vai ficar a imagem
WORKDIR /spotify-radio/
# O primeiro parâmetro é o arquivo local, irá copiar o  package.json package-lock.json local
# O segundo é aonde irá jogar esse arquivo, no caso irá jogar em /spotify-radio/ 
COPY package.json package-lock.json /spotify-radio/

RUN npm ci --silent

# Copia tudo da raiz do local para dentro da pasta raiz do host
COPY . .

USER node

# Comando que vai rodar quando rodar a imagem
CMD npm run live-reload
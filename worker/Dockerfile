FROM node:8.9
RUN apt-get update -y && apt-get upgrade -y
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
COPY package.json /usr/src/app/
COPY package-lock.json /usr/src/app/
RUN npm install --production
COPY . /usr/src/app
EXPOSE 8081
ENV NODE_ENV production
CMD [ "npm", "start" ]
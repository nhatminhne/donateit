FROM node:16.17-alpine

WORKDIR /usr/app
COPY ["package.json","package-lock.json", "./"]
RUN apk add --no-cache git openssh
RUN yarn install
COPY . .
RUN yarn run build
EXPOSE 80
EXPOSE 443

CMD ["yarn","start"]


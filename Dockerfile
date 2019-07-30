FROM node:10-alpine

WORKDIR /home/node/app

COPY ./package.json /home/node/app

RUN apk update && apk upgrade && \
    echo @edge http://nl.alpinelinux.org/alpine/edge/community >> /etc/apk/repositories && \
    echo @edge http://nl.alpinelinux.org/alpine/edge/main >> /etc/apk/repositories && \
    apk add --no-cache \
      chromium@edge=~73.0.3683.103 \
      nss@edge \
      freetype@edge \
      freetype-dev@edge \
      harfbuzz@edge \
      ttf-freefont@edge

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true

RUN yarn add puppeteer@1.12.2

RUN npm install

RUN ls
FROM mhart/alpine-node:8 as base
RUN apk update && apk upgrade && apk add --no-cache \
    bash \
    git \
    openssh
RUN adduser -D appuser -h /app

WORKDIR /app
USER appuser
COPY --chown=appuser:appuser . .
RUN npm install --production
EXPOSE 4000
ENV PORT 4000
CMD ["npm", "start"]
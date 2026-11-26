FROM node:22-alpine
ENV NODE_ENV=production PORT=3000 DATA_DIR=/app/data
WORKDIR /app
COPY --chown=node:node package.json server.js relay.js tvheadend.js ./
COPY --chown=node:node public ./public
COPY --chown=node:node third_party ./third_party
RUN mkdir -p /app/data && chown node:node /app/data
USER node
VOLUME ["/app/data"]
EXPOSE 3000
CMD ["node", "server.js"]

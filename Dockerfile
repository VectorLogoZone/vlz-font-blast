FROM node:current-stretch-slim as base
RUN groupadd -r appuser && \
	useradd --create-home --gid appuser --home-dir /app --no-log-init --system appuser

FROM base AS run
ARG COMMIT="(not set)"
ARG LASTMOD="(not set)"
ENV COMMIT=$COMMIT
ENV LASTMOD=$LASTMOD
WORKDIR /app
USER appuser
COPY --chown=appuser:appuser . .
RUN yarn install --production
EXPOSE 4000
ENV PORT 4000
CMD ["yarn", "start"]


FROM node:20-alpine AS build

WORKDIR /app

ARG VITE_USER_API_END_POINT=http://localhost:8000/api/v1/user
ARG VITE_JOB_API_END_POINT=http://localhost:8000/api/v1/job
ARG VITE_APPLICATION_API_END_POINT=http://localhost:8000/api/v1/application
ARG VITE_COMPANY_API_END_POINT=http://localhost:8000/api/v1/company
ARG VITE_SCRAPED_JOB_API_END_POINT=http://localhost:8000/api/v1/scraped-jobs
ARG VITE_CAREER_SOURCE_API_END_POINT=http://localhost:8000/api/v1/career-sources
ARG VITE_CHATBOT_API_END_POINT=http://localhost:8000/api/v1/chatbot

ENV VITE_USER_API_END_POINT=$VITE_USER_API_END_POINT
ENV VITE_JOB_API_END_POINT=$VITE_JOB_API_END_POINT
ENV VITE_APPLICATION_API_END_POINT=$VITE_APPLICATION_API_END_POINT
ENV VITE_COMPANY_API_END_POINT=$VITE_COMPANY_API_END_POINT
ENV VITE_SCRAPED_JOB_API_END_POINT=$VITE_SCRAPED_JOB_API_END_POINT
ENV VITE_CAREER_SOURCE_API_END_POINT=$VITE_CAREER_SOURCE_API_END_POINT
ENV VITE_CHATBOT_API_END_POINT=$VITE_CHATBOT_API_END_POINT

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:1.27-alpine

RUN apk add --no-cache curl

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://127.0.0.1/health || exit 1

CMD ["nginx", "-g", "daemon off;"]

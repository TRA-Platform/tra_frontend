#FROM node:16 as build
FROM nginx:1.21-alpine
WORKDIR /frontend
COPY . .

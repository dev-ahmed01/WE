# docker build -f deploy/Dockerfile -t emlen-site . && docker run -p 8080:80 emlen-site
FROM nginx:1.27-alpine
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY public/ /var/www/emlen/

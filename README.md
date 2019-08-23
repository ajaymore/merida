```
docker build -t merida/app:1.0.1 .
docker run --net reverse-proxy --name merida --restart always -p 3000:3000 merida/app:1.0.1
```

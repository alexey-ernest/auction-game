docker stop auction
docker rm auction
docker rmi auction
docker build -t auction .
docker run -d --name auction -p 8080:8080 -e POSTGRES_CONNECTION=postgres://auction:auction@192.168.99.100:5432/auction -e TOKEN_SECRET=secret -e DEBUG=auction-game:* auction

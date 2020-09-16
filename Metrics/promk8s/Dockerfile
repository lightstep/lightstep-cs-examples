FROM golang:alpine
RUN mkdir /app 
WORKDIR /app
COPY go.mod .
COPY go.sum .
RUN go mod download
COPY . .
RUN go build -o main ./cmd
RUN adduser -S -D -H -h /app appuser
USER appuser
EXPOSE 8000
CMD ["./main"]

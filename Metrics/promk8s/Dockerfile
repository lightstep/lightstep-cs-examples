FROM golang:alpine
RUN mkdir /app 
ADD . /app/
WORKDIR /app 
RUN go build -o main ./cmd
RUN adduser -S -D -H -h /app appuser
USER appuser
EXPOSE 8000
CMD ["./main"]

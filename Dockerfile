FROM golang:1.18

LABEL Authors="alihjmm, 7abib04, Mohamed-Alasfoor, Hujafaar"
LABEL Description="Talknet Container"
LABEL Version="Latest"

EXPOSE 8080

WORKDIR /app

# Install SQLite and dependencies
RUN apt-get update && apt-get install -y sqlite3 libsqlite3-dev

# Copy everything from current directory to container’s app directory
COPY . .

# Build the Go app
RUN go build -o forum main.go

# Run the Go app
CMD ["./forum"]

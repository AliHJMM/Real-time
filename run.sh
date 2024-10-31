#!/bin/bash
docker build -t forum .

# Stop and remove the previous container if it exists
docker stop forumContainer || true
docker rm forumContainer || true

# Run the container
docker run -p 8080:8080 --name forumContainer forum

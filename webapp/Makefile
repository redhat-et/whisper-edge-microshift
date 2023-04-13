

small.pt:
	wget https://openaipublic.azureedge.net/main/whisper/models/9ecf779972d90ba49c06d968637d720dd632c55bbf19d441fb42bf17a411e794/small.pt

medium.pt:
	wget https://openaipublic.azureedge.net/main/whisper/models/345ae4da62f9b3d59415adc60127b97c714f32e89e936602e85993674d08dcb1/medium.pt

build: small.pt
	podman build . -f Containerfile -t quay.io/mangelajo/nv-whisper-edge:latest

push:
	podman push quay.io/mangelajo/nv-whisper-edge:latest

run:
	./run.sh

all: build
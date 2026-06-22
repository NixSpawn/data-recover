.PHONY: setup server app dev

setup:
	cd server && uv sync
	cd app && bun install

server:
	cd server && uv run python main.py

app:
	cd app && bun run tauri:dev

dev:
	make -j2 server app

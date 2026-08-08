from http.server import BaseHTTPRequestHandler, HTTPServer
import json

RECEIVED_LOG = "/tmp/received_http_requests.log"


class EchoHandler(BaseHTTPRequestHandler):
    def _handle(self):
        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length).decode("utf-8", errors="replace") if length else ""
        with open(RECEIVED_LOG, "a", encoding="utf-8") as f:
            f.write(f"=== {self.command} {self.path} ===\n")
            f.write(f"Headers: {dict(self.headers)}\n")
            f.write(f"Body: {body}\n\n")
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps({"status": "ok", "received": body}).encode("utf-8"))

    def do_POST(self):
        self._handle()

    def do_GET(self):
        self._handle()

    def log_message(self, format, *args):
        pass  # quiet


if __name__ == "__main__":
    open(RECEIVED_LOG, "w").close()
    server = HTTPServer(("127.0.0.1", 8090), EchoHandler)
    print("HTTP echo server listening on 127.0.0.1:8090")
    server.serve_forever()

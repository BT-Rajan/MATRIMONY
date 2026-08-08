import asyncio
from aiosmtpd.controller import Controller

RECEIVED_LOG = "/tmp/received_emails.log"


class LoggingHandler:
    async def handle_DATA(self, server, session, envelope):
        with open(RECEIVED_LOG, "a", encoding="utf-8") as f:
            f.write("=== MESSAGE RECEIVED ===\n")
            f.write(f"MAIL FROM: {envelope.mail_from}\n")
            f.write(f"RCPT TO: {envelope.rcpt_tos}\n")
            f.write("--- content ---\n")
            f.write(envelope.content.decode("utf-8", errors="replace"))
            f.write("\n=== END ===\n\n")
        return "250 Message accepted for delivery"


if __name__ == "__main__":
    open(RECEIVED_LOG, "w").close()  # reset log
    controller = Controller(LoggingHandler(), hostname="127.0.0.1", port=1025)
    controller.start()
    print("SMTP debug server listening on 127.0.0.1:1025")
    try:
        asyncio.get_event_loop().run_forever()
    except KeyboardInterrupt:
        controller.stop()

---
title: "Message Persistence"
termSlug: "message-persistence"
year: 2025
month: 7
monthName: "July"
day: 17
order: 14
source: "2025/july-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2025/july-term.md"
excerpt: "Message Persistence is the ability to store messages durably so they survive system failures, restarts, or crashes. It ensures messages are not lost and can be retrieved and processed even after un..."
---
### Definition:

Message Persistence is the ability to store messages durably so they survive system failures, restarts, or crashes. It ensures messages are not lost and can be retrieved and processed even after unexpected interruptions.

Key Features:
✅ Recursive Design: Efficiently traverses nested structures
✅ Early Return: Stops searching once target is found
✅ Error Handling: Returns -1 for non-existent documents
✅ Flexible Structure: Works with any depth of nesting
✅ Clean Code: Well-documented and readable

### Example:

RabbitMQ Persistent Queues

```
import pika

connection = pika.BlockingConnection(pika.ConnectionParameters('localhost'))
channel = connection.channel()

# Declare persistent queue
channel.queue_declare(queue='persistent_queue', durable=True)

# Send persistent message
channel.basic_publish(
    exchange='',
    routing_key='persistent_queue',
    body='Hello World!',
    properties=pika.BasicProperties(
        delivery_mode=2,  # Make message persistent
    )
)
```

Database Message Store

```
import sqlite3
from datetime import datetime

class MessageStore:
    def __init__(self):
        self.conn = sqlite3.connect('messages.db')
        self.create_table()

    def create_table(self):
        self.conn.execute('''
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY,
                content TEXT,
                timestamp DATETIME,
                processed BOOLEAN DEFAULT FALSE
            )
        ''')

    def store_message(self, content):
        self.conn.execute(
            'INSERT INTO messages (content, timestamp) VALUES (?, ?)',
            (content, datetime.now())
        )
        self.conn.commit()

    def get_unprocessed_messages(self):
        cursor = self.conn.execute(
            'SELECT * FROM messages WHERE processed = FALSE'
        )
        return cursor.fetchall()
```

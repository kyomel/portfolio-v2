---
title: "ActiveMQ"
termSlug: "activemq"
year: 2026
month: 5
monthName: "May"
day: 22
order: 16
source: "2026/may-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/may-term.md"
excerpt: "Apache ActiveMQ is an open-source message broker — think of it as a post office for software applications. It lets different programs (or parts of a program) talk to each other by sending and recei..."
---
### Definition:

Apache ActiveMQ is an open-source message broker — think of it as a post office for software applications. It lets different programs (or parts of a program) talk to each other by sending and receiving messages, without needing to be connected at the same time.

In simpler terms: instead of Application A calling Application B directly, A drops a message into ActiveMQ, and B picks it up whenever it's ready. This is called asynchronous communication.

Analogy
Imagine a restaurant kitchen:

Role	Real World	ActiveMQ
Waiter writes down an order	Produces a message	Producer
The order slip sits on a board	Message waits in line	Queue
Chef picks up the next order	Reads and processes the message	Consumer
The waiter and chef don't have to interact face-to-face. Orders pile up safely, and nobody gets overwhelmed.

### Example:

ere's a minimal producer sending a message and a consumer receiving it:

```
✅ Producer (Sends a message)

import javax.jms.*;
import org.apache.activemq.ActiveMQConnectionFactory;

public class Producer {
    public static void main(String[] args) throws Exception {
        // 1. Connect to the broker (running on localhost:61616)
        ConnectionFactory factory = new ActiveMQConnectionFactory("tcp://localhost:61616");
        Connection connection = factory.createConnection();
        connection.start();

        // 2. Create a session and a queue called "ORDERS"
        Session session = connection.createSession(false, Session.AUTO_ACKNOWLEDGE);
        Destination queue = session.createQueue("ORDERS");

        // 3. Create a producer and send a message
        MessageProducer producer = session.createProducer(queue);
        TextMessage message = session.createTextMessage("Table 5: two burgers 🍔🍔");
        producer.send(message);

        System.out.println("✅ Order sent!");
        producer.close();
        session.close();
        connection.close();
    }
}
📥 Consumer (Receives the message)

import javax.jms.*;
import org.apache.activemq.ActiveMQConnectionFactory;

public class Consumer {
    public static void main(String[] args) throws Exception {
        // 1. Connect to the broker
        ConnectionFactory factory = new ActiveMQConnectionFactory("tcp://localhost:61616");
        Connection connection = factory.createConnection();
        connection.start();

        // 2. Create session and listen on the "ORDERS" queue
        Session session = connection.createSession(false, Session.AUTO_ACKNOWLEDGE);
        Destination queue = session.createQueue("ORDERS");

        MessageConsumer consumer = session.createConsumer(queue);
        consumer.setMessageListener(msg -> {
            TextMessage text = (TextMessage) msg;
            System.out.println("👨‍🍳 Cooking: " + text.getText());
        });

        // Keep the program alive to listen
        Thread.sleep(10000);
        consumer.close();
        session.close();
        connection.close();
    }
}
```

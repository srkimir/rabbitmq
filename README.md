## Message acknowledgements
Section 3.1.8 https://www.rabbitmq.com/resources/specs/amqp0-9-1.pdf

Message acknowledgement is mechanism provided to consumer application to inform RabbitMQ server about message handling results.
Consumer application (if in acknowledgement mode, `{noAck: true | false}`) can either send `ack`, `nack` or `reject`

1. `ack`, once sent from consumer application to broker will signal to broker that message was `successfully` processed.
It is up to consumer application to define what does it mean to `successfully` process the message. When broker
receives `ack` it will remove message from queue permanently.

2. `nack`, once sent from consumer application will signal to broker that message was **not** successfully processed.
By default, 'nack' will put the message back in the queue **for later handling.** Here term **for later handling** is tricky
and will be explained above.

3. `reject`, the difference between `nack` and `reject` is in that broker will not requeue the message for later handling by default.
One could look on `nack` vs `reject` like `recoverable` errors and `unrecoverable` errors respectively. It is possible to declare
special type of exchange called `dead letter exchange` where all messagess will go if any of the following criteria:

- The message is rejected (basic.reject or basic.nack) with requeue=false,
- The TTL for the message expires; or
- The queue length limit is exceeded.

### Messages that needs to be handled later (nack)
Imagine the use case in which your consumer application is communication with 3rd party service via HTTP which is currently down for `N` minutes. Depending on your logic this can be considered as `recoverable` error if you are receiving lets say `5xx` back. It would make sense to retry and handle message a little bit later expecting that 3rd party service next time will be up and running.

## Delivery guarantee

### Mandatory flag and pubisher confirms
1. transient (non persistent) message is confirmed (Acked) the moment it is enqueued</span>
```
[20/11/2017 13:44:37.800] [LOG]   Consumer connected, awaiting for messages
[20/11/2017 13:44:45.229] [LOG]   Publisher connected
[20/11/2017 13:44:45.230] [LOG]   Publisher about to publish message
* [20/11/2017 13:44:45.233] [LOG]   Message acked on publisher side
* [20/11/2017 13:44:45.234] [LOG]   Consumer received message, working...
[20/11/2017 13:44:50.236] [LOG]   Consumer processed message
```
2. An `un-routable` mandatory message is confirmed right after the `basic.return`

From publisher perspective while using `publishier confirms` this one gets tricky.

In case of un-routable message (not mandatory) message publisher can't know about positive/negative outcome.
Positive outcome would be that message is `enqueued`, while negative one would be that message is `un-routable`.
In both case publisher will receive same info about message being acked, but consumer received nothing.
```
[30/11/2017 12:55:45.957] [LOG]   Consumer connected, awaiting for messages
[30/11/2017 12:55:52.090] [LOG]   Publisher connected
[30/11/2017 12:55:52.091] [LOG]   Publisher about to publish message
[30/11/2017 12:55:52.094] [LOG]   Message acked on publisher side
```

So rabbitmq will **silently** drop this message, while publisher could think that everything went well.
Solution to this is to use `mandatory` flag while publishing and to listen to `return` event on channel.
> The mandatory flag is an argument that is passed along with the Basic.Publish RPC command and tells RabbitMQ that if a message is not routable, it should send the message back to the publisher via a Basic.Return [RabbitMQ in Depth]
```
channel.on('return', (message) => console.error('Message returned back to publisher', message))
channel.publish(config.EX.name, routingKey, content, {mandatory: true}, onConfirmation)
```

```
[30/11/2017 13:07:55.204] [LOG]   Consumer connected, awaiting for messages
[30/11/2017 13:07:58.929] [LOG]   Publisher connected
[30/11/2017 13:07:58.930] [LOG]   Publisher about to publish message
[30/11/2017 13:07:58.933] [ERROR] Message returned back to publisher {
  fields: {
     replyCode: 312,
     replyText: 'NO_ROUTE',
     exchange: 'company.e.whatever-exchange',
     routingKey: 'whatever.b.b'
   },
   properties: {
     contentType: undefined,
     contentEncoding: undefined,
     headers: {},
     deliveryMode: undefined,
     priority: undefined,
     correlationId: undefined,
     replyTo: undefined,
     expiration: undefined,
     messageId: undefined,
     timestamp: undefined,
     type: undefined,
     userId: undefined,
     appId: undefined,
     clusterId: undefined
   },
   content: <Buffer 74 65 73 74>
}
[30/11/2017 13:07:58.935] [LOG]   Message acked on publisher side
```

3. Persistent message is confirmed when it is persisted to disk or when it is enqueued**

Only the first causes a confirm to be sent. Every published message will be confirmed sooner or later and no message will be confirmed more than once

### Alternate exchanges
Dedicated exchange where un-routable message will go.

```
[01/12/2017 14:21:06.503] [LOG]   Consumer connected, awaiting for messages
[01/12/2017 14:21:15.171] [LOG]   Publisher connected
[01/12/2017 14:21:15.172] [LOG]   Publisher about to publish message
[01/12/2017 14:21:15.175] [LOG]   Unroutable message received test
```

Now when publishing with `mandatory: true`, `Basic.Return` wont be issued to publisher. So registering event handler for `return` on given channel will never be fired. Dedicated consumer will receive un-routable message.

### Highly available queues (redundant copies)
This implies that you have cluster of RabbitMQ servers. By default even if you have one, queue exists at only one server, where it was firstly declared. This works by passing `policy` when queue is about to be declared. Policy will tell where your mirrored(slaves) queues
will be declared. Messages published to the queue are replicated to all mirrors. Consumers are connected to the master regardless of which node they connect to, with mirrors dropping messages that have been acknowledged at the master. If node where master is goes down, next master is oldest mirror.

## TCP Backpressure
https://github.com/squaremo/amqp.node/issues/365

# rabbitmq
### Pubisher confirms and mandatory flag

**1. transient (non persistent) message is confirmed (Acked) the moment it is enqueued**
```
[20/11/2017 13:44:37.800] [LOG]   Consumer connected, awaiting for messages
[20/11/2017 13:44:45.229] [LOG]   Publisher connected
[20/11/2017 13:44:45.230] [LOG]   Publisher about to publish message
* [20/11/2017 13:44:45.233] [LOG]   Message acked on publisher side
* [20/11/2017 13:44:45.234] [LOG]   Consumer received message, working...
[20/11/2017 13:44:50.236] [LOG]   Consumer processed message
```
**2. An `un-routable` mandatory message is confirmed right after the `basic.return`**

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

**3. Persistent message is confirmed when it is persisted to disk or when it is enqueued**

Only the first causes a confirm to be sent. Every published message will be confirmed sooner or later and no message will be confirmed more than once

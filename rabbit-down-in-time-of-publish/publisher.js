'use strict'

const amqplib = require('amqplib')
const config = require('../config')
require('console-stamp')(console, { pattern: 'dd/mm/yyyy HH:MM:ss.l' })

const counter = {
  i: 0,
  increment: function () {
    return ++this.i
  }
}

amqplib.connect(config.RABBIT_MQ)
.then(connection => connection.createChannel())
.then(channel => {
  let publishInterval

  channel.on('drain', () => {
    clearInterval(publishInterval)
    console.log('You could publish again mi amigo')
  })

  channel.on('blocked', () => {
    console.log('Publisher blocked')
  })

  channel.on('unblocked', () => {
    console.log('Publisher unblocked')
  })

  channel.assertExchange(config.EX.name, config.EX.type, config.EX.options)
  .then(() => {
    /**
     * Publish message every 5 seconds
     */
    const routingKey = 'whatever'
    const options = {
      mandatory: true
    }

    /**
     * What will happen when soon or
     * later you kill RabbitMQ server?
     *
     * When trying to call channel.publish
     * error will be thrown: IllegalOperationError: Channel closed
     */
    publishInterval = setInterval(() => {
      const count = counter.increment()
      const content = Buffer.from(JSON.stringify({
        count
      }))

      if (channel.publish(config.EX.name, routingKey, content, options)) {
        console.log(`Publishing message with count ${count}`)
      } else {
        console.log(`Received FALSE from publish for message with count ${count}`)
      }
    }, 0)
  })
})
.catch(console.error)
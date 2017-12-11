'use strict'

const amqplib = require('amqplib')
const config = require('../config')
require('console-stamp')(console, { pattern: 'dd/mm/yyyy HH:MM:ss.l' })

amqplib.connect(config.RABBIT_MQ)
.then(connection => connection.createChannel())
.then(channel => {
  return Promise.all([
    channel.assertExchange(config.EX.name, 'topic', config.EX.options),
    channel.assertQueue(config.QUEUE.name, config.QUEUE.options)
  ])
  .then(() => {
    const bindingKey = 'whatever'
    return channel.bindQueue(config.QUEUE.name, config.EX.name, bindingKey)
  })
  .then(() => {
    console.log('Consumer connected, awaiting for messages')

    channel.consume(config.QUEUE.name, message => {
      const parsed = JSON.parse(message.content.toString())
      console.log(`Consumer received message with count ${parsed.count}, working...`)
      /**
       * Simulate work
       * for 5 seconds
       */
      setTimeout(() => {
        console.log(`Consumer processed message with count ${parsed.count}`)
        channel.ack(message)
      }, 20000)
    }, {noAck: false})
  })
})
.catch(console.error)

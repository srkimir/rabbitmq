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
    const bindingKey = 'whatever.a.*'
    return channel.bindQueue(config.QUEUE.name, config.EX.name, bindingKey)
  })
  .then(() => {
    console.log('Consumer connected, awaiting for messages')

    channel.consume(config.QUEUE.name, message => {
      console.log('Consumer received message, working...')
      /**
       * Simulate work
       * for 5 seconds
       */
      setTimeout(() => {
        console.log('Consumer processed message')
        channel.ack(message)
      }, 5000)
    }, {noAck: false})
  })
})
.catch(console.error)

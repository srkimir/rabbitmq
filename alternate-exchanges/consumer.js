'use strict'

const amqplib = require('amqplib')
const config = require('../config')
require('console-stamp')(console, { pattern: 'dd/mm/yyyy HH:MM:ss.l' })

const onRoutableMessage = message => console.log('Consumer processed message', message.content.toString())
const onUnRoutableMessage = message => console.log('Unroutable message received', message.content.toString())

amqplib.connect(config.RABBIT_MQ)
.then(connection => connection.createChannel())
.then(channel => {
  return Promise.all([
    channel.assertExchange(config.EX.name, config.EX.type, config.EX.options),
    channel.assertExchange(config.ALTERNATE_EXCHANGE.name, config.ALTERNATE_EXCHANGE.type, config.EX.options),
    channel.assertQueue(config.QUEUE.name, config.QUEUE.options),
    channel.assertQueue(config.ALTERNATE_QUEUE.name, config.ALTERNATE_QUEUE.options)
  ])
  .then(() => {
    return Promise.all([
      channel.bindQueue(config.QUEUE.name, config.EX.name, 'whatever.a.*'),
      channel.bindQueue(config.ALTERNATE_QUEUE.name, config.ALTERNATE_EXCHANGE.name)
    ])
  })
  .then(() => {
    return Promise.all([
      channel.consume(config.QUEUE.name, onRoutableMessage),
      channel.consume(config.ALTERNATE_QUEUE.name, onUnRoutableMessage)
    ])
  })
  .then(() => console.log('Consumer connected, awaiting for messages'))
})
.catch(console.error)
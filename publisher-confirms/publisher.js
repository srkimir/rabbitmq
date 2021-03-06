'use strict'

const amqplib = require('amqplib')
const config = require('../config')
require('console-stamp')(console, { pattern: 'dd/mm/yyyy HH:MM:ss.l' })

const onConfirmation = (err, reply) => {
  err
    ? console.error('Message nacked on publisher side', err)
    : console.log('Message acked on publisher side', reply)
}

const onReturn = message => {
  console.error('Message returned back to publisher', message)
}

amqplib.connect(config.RABBIT_MQ)
.then(connection => connection.createConfirmChannel())
.then(channel => {
  channel.assertExchange(config.EX.name, 'topic', config.EX.options)
  .then(() => {
    channel.on('return', onReturn)
    console.log('Publisher connected')

    const routingKey = 'whatever.a.b'
    const content = Buffer.from('test')
    const options = {
      persistent: true
    }
    
    console.log('Publisher about to publish message')
    channel.publish(config.EX.name, routingKey, content, options, onConfirmation)
  })
})
.catch(console.error)

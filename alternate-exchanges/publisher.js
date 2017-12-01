'use strict'

const amqplib = require('amqplib')
const config = require('../config')
require('console-stamp')(console, { pattern: 'dd/mm/yyyy HH:MM:ss.l' })

const onReturn = message => {
  console.error('This will never fire now with alternate exchange', message)
}

amqplib.connect(config.RABBIT_MQ)
.then(connection => connection.createChannel())
.then(channel => {
  channel.assertExchange(config.EX.name, 'topic', config.EX.options)
  .then(() => {
    channel.on('return', onReturn)
    console.log('Publisher connected')

    const routingKey = 'whatever.b.c'
    const content = Buffer.from('test')
    const options = {
      mandatory: true
    }
    
    console.log('Publisher about to publish message')
    channel.publish(config.EX.name, routingKey, content, options)
  })
})
.catch(console.error)

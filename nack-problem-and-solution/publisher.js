'use strict'

const amqplib = require('amqplib')
const config = require('../config')
require('console-stamp')(console, { pattern: 'dd/mm/yyyy HH:MM:ss.l' })

amqplib.connect(config.RABBIT_MQ)
.then(connection => connection.createChannel())
.then(channel => {
  /**
   * What would happen if you
   * just declare an exchange
   * on publisher side and you
   * publish but consumer didn't
   * set topology yet?
   */
  channel.assertExchange(config.EX.name, config.EX.type, config.EX.options)
  .then(() => {
    const routingKey = 'whatever.a.b.c'
    const content = Buffer.from(JSON.stringify({
      b: true
    }))

    channel.publish(config.EX.name, routingKey, content)
  })
})
.catch(console.error)
'use strict'

const amqplib = require('amqplib')
const config = require('../config')
require('console-stamp')(console, { pattern: 'dd/mm/yyyy HH:MM:ss.l' })

const counter = {
  i: 0,
  increment () {
    return ++this.i
  }
}

amqplib.connect(config.RABBIT_MQ)
.then(connection => connection.createChannel())
.then(channel => {
  Promise.all([
    channel.assertExchange(config.EX.name, config.EX.type, config.EX.options),
    channel.assertQueue(config.QUEUE.name, config.QUEUE.options)
  ])
  .then(() => {
    const bindingKey = 'whatever.a.#'
    return channel.bindQueue(config.QUEUE.name, config.EX.name, bindingKey)
  })
  .then(() => {
    /**
     * kill the node process after 2 minutes
     */
    setTimeout(() => {
      process.exit(0)
    }, 2* 60 * 1000)

    channel.consume(config.QUEUE.name, message => {
      console.log(`Message received for the the ${counter.increment()} time`)

      /**
       * requeue is true by default
       */
      channel.nack(message)
    })
  })
})
.catch(console.error)
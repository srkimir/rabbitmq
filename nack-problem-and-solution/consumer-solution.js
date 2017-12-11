'use strict'

const amqplib = require('amqplib')
const _ = require('lodash')
const config = require('../config')
require('console-stamp')(console, { pattern: 'dd/mm/yyyy HH:MM:ss.l' })

amqplib.connect(config.RABBIT_MQ)
.then(connection => connection.createChannel())
.then(channel => {
  Promise.all([
    channel.assertExchange(config.EX.name, config.EX.type, config.EX.options),
    channel.assertExchange(config.DELAYED_EX.name, config.DELAYED_EX.type, config.DELAYED_EX.options),
    channel.assertExchange(config.DLX_EX.name, config.DLX_EX.type, config.DLX_EX.options),
    channel.assertQueue(config.QUEUE.name, config.QUEUE.options),
    channel.assertQueue(config.DLX_QUEUE.name, config.DLX_QUEUE.options)
  ])
  .then(() => {
    const bindingKey = 'whatever.a.#'

    return Promise.all([
      channel.bindQueue(config.QUEUE.name, config.EX.name, bindingKey),
      channel.bindQueue(config.QUEUE.name, config.DELAYED_EX.name),
      channel.bindQueue(config.DLX_QUEUE.name, config.DLX_EX.name)
    ])
  })
  .then(() => {
    channel.consume(config.QUEUE.name, message => {
      console.log('New message received')

      /**
       * Lets simulate success, recoverable and unrecoverable errors
       * If number equals 1 consumer was able to process message successfully
       * If number is equal to 2 it was unrecoverable error and there is no need to repeat processing
       * Otherwise if it fals under [3, 10] it is recoverable error and we can try again to handle same message
       */
      const randomNumber = _.random(1, 10)

      if (randomNumber === 1) {
        console.log('It was 1 consumer successfully processed message, acking...')
        channel.ack(message)
      } else if (randomNumber === 2) {
        console.log('It was 2 consumer rejecting the message')

        const requeue = false
        channel.reject(message, requeue)
      } else {
        console.log('It was from [3, 10], consumer will try to handle message again')
        /**
         * Ack previous delivery of this
         * message, cause we will republish
         * same message again but to delayed exchange.
         * It is not about nacking the message now
         */
        channel.ack(message)
        
        /**
         * Type of delayed exchange is fanout
         * so routingKey is ignored. Repeat
         * processing every 2 seconds
         */
        const routingKey = ''
        const headers = {
          'x-delay': 2000
        }

        channel.publish(config.DELAYED_EX.name, routingKey, message.content, { headers })
      }
    })
  })
})
.catch(console.error)
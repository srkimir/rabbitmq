'use strict'

module.exports = {
  RABBIT_MQ: 'amqp://guest:guest@localhost:5672/%2f',
  EX: {
    name: 'company.e.whatever-exchange',
    options: {
      durable: false
    }
  },
  QUEUE: {
    name: 'comapny.q.whatever-queue',
    options: {
      durable: false,
      exclusive: true
    }
  }
}

'use strict'

module.exports = {
  RABBIT_MQ: 'amqp://guest:guest@localhost:5672/%2f',
  EX: {
    name: 'company.e.whatever-exchange',
    type: 'topic',
    options: {
      durable: false,
      alternateExchange: 'company.e.alternate-exchange'
    }
  },
  QUEUE: {
    name: 'comapny.q.whatever-queue',
    options: {
      durable: true
    }
  },
  ALTERNATE_EXCHANGE: {
    name: 'company.e.alternate-exchange',
    type: 'fanout',
    options: {
      durable: false
    }
  },
  ALTERNATE_QUEUE: {
    name: 'company.q.alternate-queue',
    options: {
      durable: false
    }
  }
}

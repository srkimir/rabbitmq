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
  ALTERNATE_EXCHANGE: {
    name: 'company.e.alternate-exchange',
    type: 'fanout',
    options: {
      durable: false
    }
  },
  DELAYED_EX: {
    name: 'company.e.delayed-exchange',
    type: 'x-delayed-message',
    options: {
      durable: true,
      arguments: {
        'x-delayed-type': 'fanout'
      }
    }
  },
  DLX_EX: {
    name: 'company.e.dlx',
    type: 'fanout',
    options: {
      durable: true
    }
  },
  QUEUE: {
    name: 'comapny.q.whatever-queue',
    options: {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': 'company.e.dlx'
      }
    }
  },
  ALTERNATE_QUEUE: {
    name: 'company.q.alternate-queue',
    options: {
      durable: false
    }
  },
  DLX_QUEUE: {
    name: 'company.q.dlq',
    options: {
      exclusive: false
    }
  }
}

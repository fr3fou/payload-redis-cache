import { createClient, RedisClientType } from 'redis'
import { logger, logger as pinoLogger } from './logger'
import payload from 'payload'

export interface IRedisContext {
  getRedisClient: () => RedisClientType
}

export interface InitRedisContextParams {
  url: string
  namespace: string
  indexesName: string
}

export class RedisContext implements IRedisContext {
  private redisClient: RedisClientType | null = null
  private namespace: string | null = null
  private indexesName: string | null = null
  private logger: typeof payload.logger

  public init(params: InitRedisContextParams) {
    const { url, namespace, indexesName } = params

    this.logger =
      payload.logger?.child({ component: 'redis-cache' }) ?? (pinoLogger as typeof payload.logger)
    this.namespace = namespace
    this.indexesName = indexesName
    try {
      this.redisClient = createClient({ url })
      this.redisClient.connect().then(() => this.logger.info('Connected to Redis successfully!'))

      this.redisClient.on('error', (error) => {
        this.logger.error(error)
      })
    } catch (e) {
      this.redisClient = null
      this.logger.error('Unable to connect to Redis!', e)
    }
  }

  //getter
  public getRedisClient(): RedisClientType {
    return this.redisClient
  }
  public getNamespace(): string {
    return this.namespace
  }
  public getIndexesName(): string {
    return this.indexesName
  }
  public getLogger(): typeof payload.logger {
    return this.logger
  }
}

export const redisContext = new RedisContext()
export const initRedisContext = (params: InitRedisContextParams) => {
  redisContext.init(params)
}

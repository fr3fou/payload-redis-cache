class RedisContext {
     redisClient = null
     namespace = null
     indexesName = null
     logger = null

    init(params) {
      const { url, namespace, indexesName } = params

      this.namespace = namespace
      this.indexesName = indexesName

    }
    //getter
    getRedisClient() {
      return this.redisClient
    }
    getNamespace() {
      return this.namespace
    }
    getIndexesName() {
      return this.indexesName
    }
    getLogger() {
       return this.logger
    }
  }

  export const redisContext = new RedisContext()
  export const initRedisContext = (params) => {
    redisContext.init(params)
  }

import IORedis from 'ioredis'

const redis = new IORedis(process.env.REDIS_URL!, {
    maxRetriesPerRequest: null
})
console.log("Redis connected");

export default redis

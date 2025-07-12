package com.matrix.lawsuit.common.redis.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;

/**
 * Redis服务
 */
@Service
public class RedisService {
    
    private static final Logger log = LoggerFactory.getLogger(RedisService.class);
    
    @Autowired
    private RedisTemplate<String, Object> redisTemplate;
    
    /**
     * 设置缓存
     */
    public void set(String key, Object value) {
        try {
            redisTemplate.opsForValue().set(key, value);
        } catch (Exception e) {
            log.error("设置缓存失败, key: {}, error: {}", key, e.getMessage());
        }
    }
    
    /**
     * 设置缓存并指定过期时间
     */
    public void set(String key, Object value, long timeout, TimeUnit unit) {
        try {
            redisTemplate.opsForValue().set(key, value, timeout, unit);
        } catch (Exception e) {
            log.error("设置缓存失败, key: {}, timeout: {}, unit: {}, error: {}", 
                    key, timeout, unit, e.getMessage());
        }
    }
    
    /**
     * 获取缓存
     */
    public Object get(String key) {
        try {
            return redisTemplate.opsForValue().get(key);
        } catch (Exception e) {
            log.error("获取缓存失败, key: {}, error: {}", key, e.getMessage());
            return null;
        }
    }
    
    /**
     * 获取缓存（指定类型）
     */
    @SuppressWarnings("unchecked")
    public <T> T get(String key, Class<T> clazz) {
        try {
            Object value = redisTemplate.opsForValue().get(key);
            return value != null ? (T) value : null;
        } catch (Exception e) {
            log.error("获取缓存失败, key: {}, class: {}, error: {}", key, clazz.getSimpleName(), e.getMessage());
            return null;
        }
    }
    
    /**
     * 删除缓存
     */
    public boolean delete(String key) {
        try {
            return Boolean.TRUE.equals(redisTemplate.delete(key));
        } catch (Exception e) {
            log.error("删除缓存失败, key: {}, error: {}", key, e.getMessage());
            return false;
        }
    }
    
    /**
     * 检查key是否存在
     */
    public boolean hasKey(String key) {
        try {
            return Boolean.TRUE.equals(redisTemplate.hasKey(key));
        } catch (Exception e) {
            log.error("检查key是否存在失败, key: {}, error: {}", key, e.getMessage());
            return false;
        }
    }
    
    /**
     * 设置过期时间
     */
    public boolean expire(String key, long timeout, TimeUnit unit) {
        try {
            return Boolean.TRUE.equals(redisTemplate.expire(key, timeout, unit));
        } catch (Exception e) {
            log.error("设置过期时间失败, key: {}, timeout: {}, unit: {}, error: {}", 
                    key, timeout, unit, e.getMessage());
            return false;
        }
    }
    
    /**
     * 获取过期时间
     */
    public long getExpire(String key) {
        try {
            Long expire = redisTemplate.getExpire(key);
            return expire != null ? expire : -1;
        } catch (Exception e) {
            log.error("获取过期时间失败, key: {}, error: {}", key, e.getMessage());
            return -1;
        }
    }
    
    /**
     * 递增操作
     */
    public long increment(String key) {
        try {
            Long result = redisTemplate.opsForValue().increment(key);
            return result != null ? result : 0;
        } catch (Exception e) {
            log.error("递增操作失败, key: {}, error: {}", key, e.getMessage());
            return 0;
        }
    }
    
    /**
     * 递增操作（指定步长）
     */
    public long increment(String key, long delta) {
        try {
            Long result = redisTemplate.opsForValue().increment(key, delta);
            return result != null ? result : 0;
        } catch (Exception e) {
            log.error("递增操作失败, key: {}, delta: {}, error: {}", key, delta, e.getMessage());
            return 0;
        }
    }
    
    /**
     * 递减操作
     */
    public long decrement(String key) {
        try {
            Long result = redisTemplate.opsForValue().decrement(key);
            return result != null ? result : 0;
        } catch (Exception e) {
            log.error("递减操作失败, key: {}, error: {}", key, e.getMessage());
            return 0;
        }
    }
    
    /**
     * 递减操作（指定步长）
     */
    public long decrement(String key, long delta) {
        try {
            Long result = redisTemplate.opsForValue().decrement(key, delta);
            return result != null ? result : 0;
        } catch (Exception e) {
            log.error("递减操作失败, key: {}, delta: {}, error: {}", key, delta, e.getMessage());
            return 0;
        }
    }
}
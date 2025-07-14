package com.dlmp.config;

import com.fasterxml.jackson.annotation.JsonAutoDetect;
import com.fasterxml.jackson.annotation.PropertyAccessor;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.jsontype.impl.LaissezFaireSubTypeValidator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisClusterConfiguration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.RedisStandaloneConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.connection.lettuce.LettucePoolingClientConfiguration;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.serializer.Jackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;
import io.lettuce.core.cluster.ClusterClientOptions;
import io.lettuce.core.cluster.ClusterTopologyRefreshOptions;
import org.apache.commons.pool2.impl.GenericObjectPoolConfig;

import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Redis配置 - 支持集群模式和缓存优化
 */
@Configuration
@EnableCaching
public class RedisConfig {
    
    private static final Logger logger = LoggerFactory.getLogger(RedisConfig.class);
    
    @Value("${spring.redis.cluster.nodes:}")
    private List<String> clusterNodes;
    
    @Value("${spring.redis.host:localhost}")
    private String host;
    
    @Value("${spring.redis.port:6379}")
    private int port;
    
    @Value("${spring.redis.password:}")
    private String password;
    
    @Value("${spring.redis.database:0}")
    private int database;
    
    @Value("${spring.redis.timeout:5000}")
    private int timeout;
    
    @Value("${spring.redis.lettuce.pool.max-active:200}")
    private int maxActive;
    
    @Value("${spring.redis.lettuce.pool.max-idle:20}")
    private int maxIdle;
    
    @Value("${spring.redis.lettuce.pool.min-idle:10}")
    private int minIdle;
    
    @Value("${spring.redis.lettuce.pool.max-wait:1000}")
    private long maxWait;
    
    /**
     * Redis连接工厂配置
     */
    @Bean
    @Primary
    public RedisConnectionFactory redisConnectionFactory() {
        // 连接池配置
        GenericObjectPoolConfig<Object> poolConfig = new GenericObjectPoolConfig<>();
        poolConfig.setMaxTotal(maxActive);
        poolConfig.setMaxIdle(maxIdle);
        poolConfig.setMinIdle(minIdle);
        poolConfig.setMaxWaitMillis(maxWait);
        poolConfig.setTestOnBorrow(true);
        poolConfig.setTestOnReturn(true);
        poolConfig.setTestWhileIdle(true);
        poolConfig.setTimeBetweenEvictionRunsMillis(60000);
        poolConfig.setMinEvictableIdleTimeMillis(300000);
        poolConfig.setNumTestsPerEvictionRun(3);
        poolConfig.setBlockWhenExhausted(true);
        
        LettucePoolingClientConfiguration clientConfiguration = LettucePoolingClientConfiguration.builder()
                .poolConfig(poolConfig)
                .commandTimeout(Duration.ofMillis(timeout))
                .shutdownTimeout(Duration.ofMillis(100))
                .build();
        
        LettuceConnectionFactory factory;
        
        // 集群模式配置
        if (clusterNodes != null && !clusterNodes.isEmpty()) {
            logger.info("配置Redis集群模式，节点: {}", clusterNodes);
            
            RedisClusterConfiguration clusterConfiguration = new RedisClusterConfiguration(clusterNodes);
            clusterConfiguration.setMaxRedirects(3);
            if (password != null && !password.isEmpty()) {
                clusterConfiguration.setPassword(password);
            }
            
            // 集群客户端配置
            ClusterTopologyRefreshOptions topologyRefreshOptions = ClusterTopologyRefreshOptions.builder()
                    .enablePeriodicRefresh(Duration.ofSeconds(30))
                    .enableAllAdaptiveRefreshTriggers()
                    .build();
            
            ClusterClientOptions clusterClientOptions = ClusterClientOptions.builder()
                    .topologyRefreshOptions(topologyRefreshOptions)
                    .build();
            
            LettucePoolingClientConfiguration clusterClientConfiguration = LettucePoolingClientConfiguration.builder()
                    .poolConfig(poolConfig)
                    .commandTimeout(Duration.ofMillis(timeout))
                    .clientOptions(clusterClientOptions)
                    .build();
            
            factory = new LettuceConnectionFactory(clusterConfiguration, clusterClientConfiguration);
        } else {
            logger.info("配置Redis单机模式，地址: {}:{}", host, port);
            
            // 单机模式配置
            RedisStandaloneConfiguration standaloneConfiguration = new RedisStandaloneConfiguration();
            standaloneConfiguration.setHostName(host);
            standaloneConfiguration.setPort(port);
            standaloneConfiguration.setDatabase(database);
            if (password != null && !password.isEmpty()) {
                standaloneConfiguration.setPassword(password);
            }
            
            factory = new LettuceConnectionFactory(standaloneConfiguration, clientConfiguration);
        }
        
        factory.setValidateConnection(true);
        factory.afterPropertiesSet();
        
        logger.info("Redis连接工厂配置完成");
        return factory;
    }
    
    /**
     * RedisTemplate配置 - 通用对象操作
     */
    @Bean
    @Primary
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory connectionFactory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);
        
        // JSON序列化配置
        Jackson2JsonRedisSerializer<Object> jackson2JsonRedisSerializer = new Jackson2JsonRedisSerializer<>(Object.class);
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.setVisibility(PropertyAccessor.ALL, JsonAutoDetect.Visibility.ANY);
        objectMapper.activateDefaultTyping(LaissezFaireSubTypeValidator.instance, ObjectMapper.DefaultTyping.NON_FINAL);
        jackson2JsonRedisSerializer.setObjectMapper(objectMapper);
        
        // String序列化配置
        StringRedisSerializer stringRedisSerializer = new StringRedisSerializer();
        
        // 设置序列化器
        template.setKeySerializer(stringRedisSerializer);
        template.setHashKeySerializer(stringRedisSerializer);
        template.setValueSerializer(jackson2JsonRedisSerializer);
        template.setHashValueSerializer(jackson2JsonRedisSerializer);
        
        // 事务支持
        template.setEnableTransactionSupport(true);
        
        template.afterPropertiesSet();
        
        logger.info("RedisTemplate配置完成");
        return template;
    }
    
    /**
     * StringRedisTemplate配置 - 字符串操作
     */
    @Bean
    public StringRedisTemplate stringRedisTemplate(RedisConnectionFactory connectionFactory) {
        StringRedisTemplate template = new StringRedisTemplate();
        template.setConnectionFactory(connectionFactory);
        template.setEnableTransactionSupport(true);
        template.afterPropertiesSet();
        
        logger.info("StringRedisTemplate配置完成");
        return template;
    }
    
    /**
     * 缓存管理器配置
     */
    @Bean
    @Primary
    public CacheManager cacheManager(RedisConnectionFactory connectionFactory) {
        // 默认缓存配置
        RedisCacheConfiguration defaultConfig = RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofHours(1))                    // 默认1小时过期
                .disableCachingNullValues()                       // 不缓存null值
                .serializeKeysWith(org.springframework.data.redis.serializer.RedisSerializationContext.SerializationPair
                        .fromSerializer(new StringRedisSerializer()))
                .serializeValuesWith(org.springframework.data.redis.serializer.RedisSerializationContext.SerializationPair
                        .fromSerializer(createJsonSerializer()));
        
        // 不同缓存区域的个性化配置
        Map<String, RedisCacheConfiguration> cacheConfigurations = new HashMap<>();
        
        // 用户缓存 - 30分钟
        cacheConfigurations.put("userCache", defaultConfig
                .entryTtl(Duration.ofMinutes(30))
                .prefixCacheNameWith("dlmp:user:"));
        
        // 案件缓存 - 2小时
        cacheConfigurations.put("caseCache", defaultConfig
                .entryTtl(Duration.ofHours(2))
                .prefixCacheNameWith("dlmp:case:"));
        
        // 系统配置缓存 - 24小时
        cacheConfigurations.put("systemCache", defaultConfig
                .entryTtl(Duration.ofHours(24))
                .prefixCacheNameWith("dlmp:system:"));
        
        // 字典缓存 - 12小时
        cacheConfigurations.put("dictCache", defaultConfig
                .entryTtl(Duration.ofHours(12))
                .prefixCacheNameWith("dlmp:dict:"));
        
        // 权限缓存 - 1小时
        cacheConfigurations.put("permissionCache", defaultConfig
                .entryTtl(Duration.ofHours(1))
                .prefixCacheNameWith("dlmp:permission:"));
        
        // 会话缓存 - 2小时
        cacheConfigurations.put("sessionCache", defaultConfig
                .entryTtl(Duration.ofHours(2))
                .prefixCacheNameWith("dlmp:session:"));
        
        // 验证码缓存 - 5分钟
        cacheConfigurations.put("captchaCache", defaultConfig
                .entryTtl(Duration.ofMinutes(5))
                .prefixCacheNameWith("dlmp:captcha:"));
        
        // 限流缓存 - 1分钟
        cacheConfigurations.put("rateLimitCache", defaultConfig
                .entryTtl(Duration.ofMinutes(1))
                .prefixCacheNameWith("dlmp:ratelimit:"));
        
        // 统计缓存 - 6小时
        cacheConfigurations.put("statisticsCache", defaultConfig
                .entryTtl(Duration.ofHours(6))
                .prefixCacheNameWith("dlmp:stats:"));
        
        RedisCacheManager cacheManager = RedisCacheManager.builder(connectionFactory)
                .cacheDefaults(defaultConfig)
                .withInitialCacheConfigurations(cacheConfigurations)
                .transactionAware()  // 事务感知
                .build();
        
        logger.info("Redis缓存管理器配置完成，缓存区域数量: {}", cacheConfigurations.size());
        return cacheManager;
    }
    
    /**
     * 创建JSON序列化器
     */
    private Jackson2JsonRedisSerializer<Object> createJsonSerializer() {
        Jackson2JsonRedisSerializer<Object> serializer = new Jackson2JsonRedisSerializer<>(Object.class);
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.setVisibility(PropertyAccessor.ALL, JsonAutoDetect.Visibility.ANY);
        objectMapper.activateDefaultTyping(LaissezFaireSubTypeValidator.instance, ObjectMapper.DefaultTyping.NON_FINAL);
        serializer.setObjectMapper(objectMapper);
        return serializer;
    }
    
    /**
     * 缓存工具类
     */
    @Bean
    public RedisCacheUtil redisCacheUtil(RedisTemplate<String, Object> redisTemplate) {
        return new RedisCacheUtil(redisTemplate);
    }
}

/**
 * Redis缓存工具类
 */
class RedisCacheUtil {
    
    private static final Logger logger = LoggerFactory.getLogger(RedisCacheUtil.class);
    private final RedisTemplate<String, Object> redisTemplate;
    
    public RedisCacheUtil(RedisTemplate<String, Object> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }
    
    /**
     * 设置缓存
     */
    public void set(String key, Object value, Duration timeout) {
        try {
            redisTemplate.opsForValue().set(key, value, timeout);
            logger.debug("设置缓存成功: key={}, timeout={}", key, timeout);
        } catch (Exception e) {
            logger.error("设置缓存失败: key={}", key, e);
        }
    }
    
    /**
     * 获取缓存
     */
    public Object get(String key) {
        try {
            Object value = redisTemplate.opsForValue().get(key);
            logger.debug("获取缓存: key={}, value={}", key, value != null ? "存在" : "不存在");
            return value;
        } catch (Exception e) {
            logger.error("获取缓存失败: key={}", key, e);
            return null;
        }
    }
    
    /**
     * 删除缓存
     */
    public boolean delete(String key) {
        try {
            Boolean result = redisTemplate.delete(key);
            logger.debug("删除缓存: key={}, result={}", key, result);
            return Boolean.TRUE.equals(result);
        } catch (Exception e) {
            logger.error("删除缓存失败: key={}", key, e);
            return false;
        }
    }
    
    /**
     * 判断缓存是否存在
     */
    public boolean hasKey(String key) {
        try {
            Boolean result = redisTemplate.hasKey(key);
            return Boolean.TRUE.equals(result);
        } catch (Exception e) {
            logger.error("检查缓存存在性失败: key={}", key, e);
            return false;
        }
    }
    
    /**
     * 设置缓存过期时间
     */
    public boolean expire(String key, Duration timeout) {
        try {
            Boolean result = redisTemplate.expire(key, timeout);
            logger.debug("设置缓存过期时间: key={}, timeout={}, result={}", key, timeout, result);
            return Boolean.TRUE.equals(result);
        } catch (Exception e) {
            logger.error("设置缓存过期时间失败: key={}", key, e);
            return false;
        }
    }
    
    /**
     * 获取缓存剩余过期时间
     */
    public long getExpire(String key) {
        try {
            Long expire = redisTemplate.getExpire(key);
            return expire != null ? expire : -1;
        } catch (Exception e) {
            logger.error("获取缓存过期时间失败: key={}", key, e);
            return -1;
        }
    }
    
    /**
     * 批量删除缓存
     */
    public long deletePattern(String pattern) {
        try {
            var keys = redisTemplate.keys(pattern);
            if (keys != null && !keys.isEmpty()) {
                Long result = redisTemplate.delete(keys);
                logger.info("批量删除缓存: pattern={}, count={}", pattern, result);
                return result != null ? result : 0;
            }
            return 0;
        } catch (Exception e) {
            logger.error("批量删除缓存失败: pattern={}", pattern, e);
            return 0;
        }
    }
    
    /**
     * 递增
     */
    public long increment(String key, long delta) {
        try {
            Long result = redisTemplate.opsForValue().increment(key, delta);
            return result != null ? result : 0;
        } catch (Exception e) {
            logger.error("递增操作失败: key={}, delta={}", key, delta, e);
            return 0;
        }
    }
    
    /**
     * 递减
     */
    public long decrement(String key, long delta) {
        try {
            Long result = redisTemplate.opsForValue().decrement(key, delta);
            return result != null ? result : 0;
        } catch (Exception e) {
            logger.error("递减操作失败: key={}, delta={}", key, delta, e);
            return 0;
        }
    }
}
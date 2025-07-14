package com.dlmp.service;

import com.dlmp.config.RedisCacheUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.CachePut;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.TimeUnit;

/**
 * 缓存服务
 * 提供统一的缓存操作接口和策略管理
 */
@Service
public class CacheService {
    
    private static final Logger logger = LoggerFactory.getLogger(CacheService.class);
    
    @Autowired
    private RedisCacheUtil redisCacheUtil;
    
    @Autowired
    private RedisTemplate<String, Object> redisTemplate;
    
    // 缓存键前缀
    private static final String CACHE_PREFIX = "dlmp:";
    private static final String USER_PREFIX = CACHE_PREFIX + "user:";
    private static final String CASE_PREFIX = CACHE_PREFIX + "case:";
    private static final String DICT_PREFIX = CACHE_PREFIX + "dict:";
    private static final String PERMISSION_PREFIX = CACHE_PREFIX + "permission:";
    private static final String SESSION_PREFIX = CACHE_PREFIX + "session:";
    private static final String RATE_LIMIT_PREFIX = CACHE_PREFIX + "ratelimit:";
    private static final String STATISTICS_PREFIX = CACHE_PREFIX + "stats:";
    
    /**
     * 用户相关缓存
     */
    public static class UserCache {
        private final CacheService cacheService;
        
        public UserCache(CacheService cacheService) {
            this.cacheService = cacheService;
        }
        
        @Cacheable(value = "userCache", key = "#userId")
        public Object getUserInfo(Long userId) {
            return cacheService.get(USER_PREFIX + "info:" + userId);
        }
        
        @CachePut(value = "userCache", key = "#userId")
        public Object setUserInfo(Long userId, Object userInfo) {
            cacheService.set(USER_PREFIX + "info:" + userId, userInfo, Duration.ofMinutes(30));
            return userInfo;
        }
        
        @CacheEvict(value = "userCache", key = "#userId")
        public void removeUserInfo(Long userId) {
            cacheService.delete(USER_PREFIX + "info:" + userId);
        }
        
        public void setUserToken(Long userId, String token) {
            cacheService.set(USER_PREFIX + "token:" + userId, token, Duration.ofHours(2));
        }
        
        public String getUserToken(Long userId) {
            return (String) cacheService.get(USER_PREFIX + "token:" + userId);
        }
        
        public void removeUserToken(Long userId) {
            cacheService.delete(USER_PREFIX + "token:" + userId);
        }
        
        public void setUserPermissions(Long userId, Set<String> permissions) {
            cacheService.set(USER_PREFIX + "permissions:" + userId, permissions, Duration.ofHours(1));
        }
        
        @SuppressWarnings("unchecked")
        public Set<String> getUserPermissions(Long userId) {
            return (Set<String>) cacheService.get(USER_PREFIX + "permissions:" + userId);
        }
    }
    
    /**
     * 案件相关缓存
     */
    public static class CaseCache {
        private final CacheService cacheService;
        
        public CaseCache(CacheService cacheService) {
            this.cacheService = cacheService;
        }
        
        @Cacheable(value = "caseCache", key = "#caseId")
        public Object getCaseInfo(Long caseId) {
            return cacheService.get(CASE_PREFIX + "info:" + caseId);
        }
        
        @CachePut(value = "caseCache", key = "#caseId")
        public Object setCaseInfo(Long caseId, Object caseInfo) {
            cacheService.set(CASE_PREFIX + "info:" + caseId, caseInfo, Duration.ofHours(2));
            return caseInfo;
        }
        
        @CacheEvict(value = "caseCache", key = "#caseId")
        public void removeCaseInfo(Long caseId) {
            cacheService.delete(CASE_PREFIX + "info:" + caseId);
        }
        
        public void setCaseStatus(Long caseId, String status) {
            cacheService.set(CASE_PREFIX + "status:" + caseId, status, Duration.ofHours(1));
        }
        
        public String getCaseStatus(Long caseId) {
            return (String) cacheService.get(CASE_PREFIX + "status:" + caseId);
        }
        
        public void setCaseAssignment(Long caseId, Object assignment) {
            cacheService.set(CASE_PREFIX + "assignment:" + caseId, assignment, Duration.ofHours(4));
        }
        
        public Object getCaseAssignment(Long caseId) {
            return cacheService.get(CASE_PREFIX + "assignment:" + caseId);
        }
    }
    
    /**
     * 字典缓存
     */
    public static class DictCache {
        private final CacheService cacheService;
        
        public DictCache(CacheService cacheService) {
            this.cacheService = cacheService;
        }
        
        @Cacheable(value = "dictCache", key = "#dictType")
        public List<Object> getDictData(String dictType) {
            @SuppressWarnings("unchecked")
            List<Object> result = (List<Object>) cacheService.get(DICT_PREFIX + dictType);
            return result;
        }
        
        @CachePut(value = "dictCache", key = "#dictType")
        public List<Object> setDictData(String dictType, List<Object> dictData) {
            cacheService.set(DICT_PREFIX + dictType, dictData, Duration.ofHours(12));
            return dictData;
        }
        
        @CacheEvict(value = "dictCache", key = "#dictType")
        public void removeDictData(String dictType) {
            cacheService.delete(DICT_PREFIX + dictType);
        }
        
        @CacheEvict(value = "dictCache", allEntries = true)
        public void clearAllDictCache() {
            cacheService.deletePattern(DICT_PREFIX + "*");
        }
    }
    
    /**
     * 会话缓存
     */
    public static class SessionCache {
        private final CacheService cacheService;
        
        public SessionCache(CacheService cacheService) {
            this.cacheService = cacheService;
        }
        
        public void setSession(String sessionId, Object sessionData) {
            cacheService.set(SESSION_PREFIX + sessionId, sessionData, Duration.ofHours(2));
        }
        
        public Object getSession(String sessionId) {
            return cacheService.get(SESSION_PREFIX + sessionId);
        }
        
        public void removeSession(String sessionId) {
            cacheService.delete(SESSION_PREFIX + sessionId);
        }
        
        public boolean isSessionValid(String sessionId) {
            return cacheService.hasKey(SESSION_PREFIX + sessionId);
        }
        
        public void extendSession(String sessionId) {
            if (isSessionValid(sessionId)) {
                cacheService.expire(SESSION_PREFIX + sessionId, Duration.ofHours(2));
            }
        }
    }
    
    /**
     * 限流缓存
     */
    public static class RateLimitCache {
        private final CacheService cacheService;
        
        public RateLimitCache(CacheService cacheService) {
            this.cacheService = cacheService;
        }
        
        public boolean isAllowed(String key, int maxRequests, Duration window) {
            String rateLimitKey = RATE_LIMIT_PREFIX + key;
            Long currentCount = cacheService.increment(rateLimitKey, 1);
            
            if (currentCount == 1) {
                // 首次访问，设置过期时间
                cacheService.expire(rateLimitKey, window);
            }
            
            return currentCount <= maxRequests;
        }
        
        public long getCurrentCount(String key) {
            Object count = cacheService.get(RATE_LIMIT_PREFIX + key);
            return count != null ? Long.parseLong(count.toString()) : 0;
        }
        
        public long getRemainingTime(String key) {
            return cacheService.getExpire(RATE_LIMIT_PREFIX + key);
        }
    }
    
    /**
     * 统计缓存
     */
    public static class StatisticsCache {
        private final CacheService cacheService;
        
        public StatisticsCache(CacheService cacheService) {
            this.cacheService = cacheService;
        }
        
        public void setDashboardStats(Object stats) {
            cacheService.set(STATISTICS_PREFIX + "dashboard", stats, Duration.ofMinutes(10));
        }
        
        public Object getDashboardStats() {
            return cacheService.get(STATISTICS_PREFIX + "dashboard");
        }
        
        public void setCaseStats(String period, Object stats) {
            cacheService.set(STATISTICS_PREFIX + "case:" + period, stats, Duration.ofHours(1));
        }
        
        public Object getCaseStats(String period) {
            return cacheService.get(STATISTICS_PREFIX + "case:" + period);
        }
        
        public void setUserStats(String period, Object stats) {
            cacheService.set(STATISTICS_PREFIX + "user:" + period, stats, Duration.ofHours(6));
        }
        
        public Object getUserStats(String period) {
            return cacheService.get(STATISTICS_PREFIX + "user:" + period);
        }
    }
    
    // 缓存管理器实例
    private UserCache userCache;
    private CaseCache caseCache;
    private DictCache dictCache;
    private SessionCache sessionCache;
    private RateLimitCache rateLimitCache;
    private StatisticsCache statisticsCache;
    
    /**
     * 初始化缓存管理器
     */
    public void init() {
        this.userCache = new UserCache(this);
        this.caseCache = new CaseCache(this);
        this.dictCache = new DictCache(this);
        this.sessionCache = new SessionCache(this);
        this.rateLimitCache = new RateLimitCache(this);
        this.statisticsCache = new StatisticsCache(this);
        
        logger.info("缓存服务初始化完成");
    }
    
    // Getter方法
    public UserCache user() {
        if (userCache == null) {
            userCache = new UserCache(this);
        }
        return userCache;
    }
    
    public CaseCache cases() {
        if (caseCache == null) {
            caseCache = new CaseCache(this);
        }
        return caseCache;
    }
    
    public DictCache dict() {
        if (dictCache == null) {
            dictCache = new DictCache(this);
        }
        return dictCache;
    }
    
    public SessionCache session() {
        if (sessionCache == null) {
            sessionCache = new SessionCache(this);
        }
        return sessionCache;
    }
    
    public RateLimitCache rateLimit() {
        if (rateLimitCache == null) {
            rateLimitCache = new RateLimitCache(this);
        }
        return rateLimitCache;
    }
    
    public StatisticsCache statistics() {
        if (statisticsCache == null) {
            statisticsCache = new StatisticsCache(this);
        }
        return statisticsCache;
    }
    
    // 基础缓存操作方法
    public void set(String key, Object value, Duration timeout) {
        redisCacheUtil.set(key, value, timeout);
    }
    
    public Object get(String key) {
        return redisCacheUtil.get(key);
    }
    
    public boolean delete(String key) {
        return redisCacheUtil.delete(key);
    }
    
    public boolean hasKey(String key) {
        return redisCacheUtil.hasKey(key);
    }
    
    public boolean expire(String key, Duration timeout) {
        return redisCacheUtil.expire(key, timeout);
    }
    
    public long getExpire(String key) {
        return redisCacheUtil.getExpire(key);
    }
    
    public long deletePattern(String pattern) {
        return redisCacheUtil.deletePattern(pattern);
    }
    
    public long increment(String key, long delta) {
        return redisCacheUtil.increment(key, delta);
    }
    
    public long decrement(String key, long delta) {
        return redisCacheUtil.decrement(key, delta);
    }
    
    /**
     * 预热缓存
     */
    public void warmUp() {
        logger.info("开始预热缓存...");
        
        try {
            // 预热字典数据
            // dict().setDictData("case_status", getDictDataFromDB("case_status"));
            // dict().setDictData("case_type", getDictDataFromDB("case_type"));
            
            // 预热系统配置
            // setSystemConfig();
            
            logger.info("缓存预热完成");
        } catch (Exception e) {
            logger.error("缓存预热失败", e);
        }
    }
    
    /**
     * 清理过期缓存
     */
    public void cleanup() {
        logger.info("开始清理过期缓存...");
        
        try {
            // 清理过期的会话
            deletePattern(SESSION_PREFIX + "*:expired");
            
            // 清理过期的临时数据
            deletePattern(CACHE_PREFIX + "temp:*");
            
            logger.info("过期缓存清理完成");
        } catch (Exception e) {
            logger.error("缓存清理失败", e);
        }
    }
    
    /**
     * 获取缓存统计信息
     */
    public Map<String, Object> getCacheStats() {
        try {
            // 使用Redis INFO命令获取统计信息
            return redisTemplate.execute(connection -> {
                java.util.Properties info = connection.info();
                Map<String, Object> stats = new java.util.HashMap<>();
                
                // 内存使用情况
                stats.put("used_memory", info.getProperty("used_memory"));
                stats.put("used_memory_human", info.getProperty("used_memory_human"));
                stats.put("used_memory_peak", info.getProperty("used_memory_peak"));
                
                // 连接信息
                stats.put("connected_clients", info.getProperty("connected_clients"));
                stats.put("total_connections_received", info.getProperty("total_connections_received"));
                
                // 命令统计
                stats.put("total_commands_processed", info.getProperty("total_commands_processed"));
                stats.put("instantaneous_ops_per_sec", info.getProperty("instantaneous_ops_per_sec"));
                
                // 键空间信息
                for (String key : info.stringPropertyNames()) {
                    if (key.startsWith("db")) {
                        stats.put(key, info.getProperty(key));
                    }
                }
                
                return stats;
            });
        } catch (Exception e) {
            logger.error("获取缓存统计信息失败", e);
            return new java.util.HashMap<>();
        }
    }
}
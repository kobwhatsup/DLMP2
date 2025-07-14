package com.dlmp.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.actuate.metrics.MetricsEndpoint;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.web.servlet.config.annotation.AsyncSupportConfigurer;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import javax.annotation.PreDestroy;
import java.util.concurrent.Executor;
import java.util.concurrent.ThreadPoolExecutor;

/**
 * 性能优化配置
 * 包含线程池、异步处理、缓存等性能相关配置
 */
@Configuration
@EnableAsync
@EnableScheduling
public class PerformanceConfig implements WebMvcConfigurer {
    
    private static final Logger logger = LoggerFactory.getLogger(PerformanceConfig.class);
    
    /**
     * 主要异步任务执行器
     */
    @Bean(name = "taskExecutor")
    public ThreadPoolTaskExecutor taskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        
        // 核心线程数
        executor.setCorePoolSize(20);
        // 最大线程数
        executor.setMaxPoolSize(100);
        // 队列容量
        executor.setQueueCapacity(1000);
        // 线程空闲时间
        executor.setKeepAliveSeconds(60);
        // 线程名前缀
        executor.setThreadNamePrefix("dlmp-task-");
        
        // 拒绝策略 - 调用者运行
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
        
        // 等待所有任务完成后再关闭线程池
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(30);
        
        // 初始化
        executor.initialize();
        
        logger.info("主任务执行器初始化完成: core={}, max={}, queue={}", 
                   executor.getCorePoolSize(), 
                   executor.getMaxPoolSize(), 
                   executor.getQueueCapacity());
        
        return executor;
    }
    
    /**
     * 业务处理异步执行器 - 用于重要业务逻辑
     */
    @Bean(name = "businessExecutor")
    public ThreadPoolTaskExecutor businessExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        
        executor.setCorePoolSize(10);
        executor.setMaxPoolSize(50);
        executor.setQueueCapacity(500);
        executor.setKeepAliveSeconds(60);
        executor.setThreadNamePrefix("dlmp-business-");
        
        // 业务重要，使用AbortPolicy确保不丢失任务
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.AbortPolicy());
        
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(60);
        
        executor.initialize();
        
        logger.info("业务执行器初始化完成: core={}, max={}, queue={}", 
                   executor.getCorePoolSize(), 
                   executor.getMaxPoolSize(), 
                   executor.getQueueCapacity());
        
        return executor;
    }
    
    /**
     * 消息处理异步执行器 - 用于MQ消息处理
     */
    @Bean(name = "messageExecutor")
    public ThreadPoolTaskExecutor messageExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        
        executor.setCorePoolSize(15);
        executor.setMaxPoolSize(30);
        executor.setQueueCapacity(200);
        executor.setKeepAliveSeconds(120);
        executor.setThreadNamePrefix("dlmp-message-");
        
        // 消息处理使用CallerRunsPolicy保证处理
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
        
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(30);
        
        executor.initialize();
        
        logger.info("消息执行器初始化完成: core={}, max={}, queue={}", 
                   executor.getCorePoolSize(), 
                   executor.getMaxPoolSize(), 
                   executor.getQueueCapacity());
        
        return executor;
    }
    
    /**
     * 文件处理异步执行器 - 用于文件上传下载等IO密集操作
     */
    @Bean(name = "fileExecutor")
    public ThreadPoolTaskExecutor fileExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        
        // IO密集型，线程数可以多一些
        executor.setCorePoolSize(20);
        executor.setMaxPoolSize(50);
        executor.setQueueCapacity(100);
        executor.setKeepAliveSeconds(300);
        executor.setThreadNamePrefix("dlmp-file-");
        
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
        
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(60);
        
        executor.initialize();
        
        logger.info("文件执行器初始化完成: core={}, max={}, queue={}", 
                   executor.getCorePoolSize(), 
                   executor.getMaxPoolSize(), 
                   executor.getQueueCapacity());
        
        return executor;
    }
    
    /**
     * 定时任务执行器
     */
    @Bean(name = "scheduledExecutor")
    public ThreadPoolTaskExecutor scheduledExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        
        executor.setCorePoolSize(5);
        executor.setMaxPoolSize(10);
        executor.setQueueCapacity(50);
        executor.setKeepAliveSeconds(60);
        executor.setThreadNamePrefix("dlmp-scheduled-");
        
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
        
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(30);
        
        executor.initialize();
        
        logger.info("定时任务执行器初始化完成: core={}, max={}, queue={}", 
                   executor.getCorePoolSize(), 
                   executor.getMaxPoolSize(), 
                   executor.getQueueCapacity());
        
        return executor;
    }
    
    /**
     * 配置Web异步支持
     */
    @Override
    public void configureAsyncSupport(AsyncSupportConfigurer configurer) {
        // 设置异步请求超时时间
        configurer.setDefaultTimeout(30000L);
        // 设置异步请求处理的任务执行器
        configurer.setTaskExecutor(taskExecutor());
    }
    
    /**
     * 性能监控器
     */
    @Bean
    @Profile("production")
    public PerformanceMonitor performanceMonitor() {
        return new PerformanceMonitor();
    }
    
    /**
     * 清理资源
     */
    @PreDestroy
    public void cleanup() {
        logger.info("开始清理性能配置资源...");
        
        // 执行器会在Spring容器销毁时自动清理
        // 这里可以添加其他需要清理的资源
        
        logger.info("性能配置资源清理完成");
    }
}

/**
 * 性能监控器
 */
class PerformanceMonitor {
    
    private static final Logger performanceLogger = LoggerFactory.getLogger("performance");
    private static final Logger logger = LoggerFactory.getLogger(PerformanceMonitor.class);
    
    /**
     * 记录方法执行时间
     */
    public void recordMethodTime(String methodName, long executionTime) {
        performanceLogger.info("方法执行时间统计 - 方法: {}, 耗时: {}ms", methodName, executionTime);
        
        // 超过阈值的方法记录警告
        if (executionTime > 1000) {
            logger.warn("方法执行时间过长: {} - {}ms", methodName, executionTime);
        }
    }
    
    /**
     * 记录数据库操作时间
     */
    public void recordDatabaseTime(String operation, long executionTime) {
        performanceLogger.info("数据库操作时间统计 - 操作: {}, 耗时: {}ms", operation, executionTime);
        
        if (executionTime > 500) {
            logger.warn("数据库操作时间过长: {} - {}ms", operation, executionTime);
        }
    }
    
    /**
     * 记录缓存操作时间
     */
    public void recordCacheTime(String operation, String key, long executionTime) {
        performanceLogger.info("缓存操作时间统计 - 操作: {}, 键: {}, 耗时: {}ms", operation, key, executionTime);
        
        if (executionTime > 100) {
            logger.warn("缓存操作时间过长: {} - {} - {}ms", operation, key, executionTime);
        }
    }
    
    /**
     * 记录API调用时间
     */
    public void recordApiTime(String api, String method, long executionTime) {
        performanceLogger.info("API调用时间统计 - API: {} {}, 耗时: {}ms", method, api, executionTime);
        
        if (executionTime > 3000) {
            logger.warn("API响应时间过长: {} {} - {}ms", method, api, executionTime);
        }
    }
    
    /**
     * 记录内存使用情况
     */
    public void recordMemoryUsage() {
        Runtime runtime = Runtime.getRuntime();
        long totalMemory = runtime.totalMemory();
        long freeMemory = runtime.freeMemory();
        long usedMemory = totalMemory - freeMemory;
        long maxMemory = runtime.maxMemory();
        
        double usagePercent = (double) usedMemory / maxMemory * 100;
        
        performanceLogger.info("内存使用统计 - 已用: {}MB, 总计: {}MB, 最大: {}MB, 使用率: {:.2f}%",
                               usedMemory / 1024 / 1024,
                               totalMemory / 1024 / 1024,
                               maxMemory / 1024 / 1024,
                               usagePercent);
        
        if (usagePercent > 80) {
            logger.warn("内存使用率过高: {:.2f}%", usagePercent);
        }
    }
    
    /**
     * 记录线程池使用情况
     */
    public void recordThreadPoolUsage(String poolName, int activeCount, int poolSize, int queueSize) {
        performanceLogger.info("线程池使用统计 - 池: {}, 活跃: {}, 总数: {}, 队列: {}", 
                               poolName, activeCount, poolSize, queueSize);
        
        if (activeCount >= poolSize * 0.8) {
            logger.warn("线程池使用率过高: {} - {}/{}", poolName, activeCount, poolSize);
        }
    }
}
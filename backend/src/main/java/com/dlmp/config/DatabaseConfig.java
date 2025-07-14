package com.dlmp.config;

import com.alibaba.druid.pool.DruidDataSource;
import com.alibaba.druid.support.http.StatViewServlet;
import com.alibaba.druid.support.http.WebStatFilter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.boot.web.servlet.ServletRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.transaction.PlatformTransactionManager;

import javax.sql.DataSource;
import java.sql.SQLException;
import java.util.HashMap;
import java.util.Map;

/**
 * 数据库配置 - 针对生产环境的性能优化
 * 包含主从数据源配置、连接池优化、监控配置等
 */
@Configuration
public class DatabaseConfig {
    
    private static final Logger logger = LoggerFactory.getLogger(DatabaseConfig.class);
    
    /**
     * 主数据源配置
     */
    @Bean(name = "masterDataSource")
    @ConfigurationProperties(prefix = "spring.datasource.master")
    @Primary
    public DataSource masterDataSource() {
        DruidDataSource dataSource = new DruidDataSource();
        
        // 基础配置
        dataSource.setDriverClassName("com.mysql.cj.jdbc.Driver");
        
        // 连接池配置 - 性能优化
        dataSource.setInitialSize(10);                    // 初始连接数
        dataSource.setMinIdle(10);                        // 最小空闲连接数
        dataSource.setMaxActive(100);                     // 最大活跃连接数
        dataSource.setMaxWait(60000);                     // 获取连接等待超时时间
        
        // 连接保活配置
        dataSource.setTimeBetweenEvictionRunsMillis(60000);   // 配置间隔多久进行一次检测
        dataSource.setMinEvictableIdleTimeMillis(300000);     // 配置连接在池中最小生存时间
        dataSource.setMaxEvictableIdleTimeMillis(900000);     // 配置连接在池中最大生存时间
        
        // 连接检测配置
        dataSource.setValidationQuery("SELECT 1");
        dataSource.setValidationQueryTimeout(3);
        dataSource.setTestWhileIdle(true);
        dataSource.setTestOnBorrow(false);
        dataSource.setTestOnReturn(false);
        
        // 性能优化配置
        dataSource.setPoolPreparedStatements(true);          // 开启PSCache
        dataSource.setMaxPoolPreparedStatementPerConnectionSize(50);  // PSCache大小
        dataSource.setUseGlobalDataSourceStat(true);         // 启用全局监控
        
        // 连接泄漏检测
        dataSource.setRemoveAbandoned(true);
        dataSource.setRemoveAbandonedTimeout(1800);          // 30分钟
        dataSource.setLogAbandoned(true);
        
        // 其他优化配置
        dataSource.setKeepAlive(true);
        dataSource.setPhyTimeoutMillis(120000);              // 物理连接超时时间
        dataSource.setBreakAfterAcquireFailure(true);        // 连接失败后中断
        dataSource.setConnectionErrorRetryAttempts(0);       // 连接失败重试次数
        
        try {
            // 配置监控统计用的filter
            dataSource.setFilters("stat,wall,slf4j");
            dataSource.init();
            logger.info("主数据源初始化成功");
        } catch (SQLException e) {
            logger.error("主数据源初始化失败", e);
            throw new RuntimeException("主数据源初始化失败", e);
        }
        
        return dataSource;
    }
    
    /**
     * 从数据源配置（只读）
     */
    @Bean(name = "slaveDataSource")
    @ConfigurationProperties(prefix = "spring.datasource.slave")
    @Profile("production")
    public DataSource slaveDataSource() {
        DruidDataSource dataSource = new DruidDataSource();
        
        dataSource.setDriverClassName("com.mysql.cj.jdbc.Driver");
        
        // 从数据源连接池配置（读多写少，可以配置更多连接）
        dataSource.setInitialSize(15);
        dataSource.setMinIdle(15);
        dataSource.setMaxActive(150);
        dataSource.setMaxWait(60000);
        
        // 连接保活配置
        dataSource.setTimeBetweenEvictionRunsMillis(60000);
        dataSource.setMinEvictableIdleTimeMillis(300000);
        dataSource.setMaxEvictableIdleTimeMillis(900000);
        
        // 连接检测配置
        dataSource.setValidationQuery("SELECT 1");
        dataSource.setValidationQueryTimeout(3);
        dataSource.setTestWhileIdle(true);
        dataSource.setTestOnBorrow(false);
        dataSource.setTestOnReturn(false);
        
        // 性能优化配置
        dataSource.setPoolPreparedStatements(true);
        dataSource.setMaxPoolPreparedStatementPerConnectionSize(50);
        dataSource.setUseGlobalDataSourceStat(true);
        
        // 连接泄漏检测
        dataSource.setRemoveAbandoned(true);
        dataSource.setRemoveAbandonedTimeout(1800);
        dataSource.setLogAbandoned(true);
        
        dataSource.setKeepAlive(true);
        dataSource.setPhyTimeoutMillis(120000);
        dataSource.setBreakAfterAcquireFailure(true);
        dataSource.setConnectionErrorRetryAttempts(0);
        
        try {
            dataSource.setFilters("stat,wall,slf4j");
            dataSource.init();
            logger.info("从数据源初始化成功");
        } catch (SQLException e) {
            logger.error("从数据源初始化失败", e);
            throw new RuntimeException("从数据源初始化失败", e);
        }
        
        return dataSource;
    }
    
    /**
     * 动态数据源 - 实现读写分离
     */
    @Bean(name = "dynamicDataSource")
    @Profile("production")
    public DynamicDataSource dynamicDataSource(@Qualifier("masterDataSource") DataSource masterDataSource,
                                                @Qualifier("slaveDataSource") DataSource slaveDataSource) {
        DynamicDataSource dynamicDataSource = new DynamicDataSource();
        
        Map<Object, Object> targetDataSources = new HashMap<>();
        targetDataSources.put("master", masterDataSource);
        targetDataSources.put("slave", slaveDataSource);
        
        dynamicDataSource.setTargetDataSources(targetDataSources);
        dynamicDataSource.setDefaultTargetDataSource(masterDataSource);
        
        logger.info("动态数据源配置完成 - 主从数据源");
        
        return dynamicDataSource;
    }
    
    /**
     * 事务管理器
     */
    @Bean
    public PlatformTransactionManager transactionManager(@Qualifier("masterDataSource") DataSource dataSource) {
        return new DataSourceTransactionManager(dataSource);
    }
    
    /**
     * Druid监控页面配置
     */
    @Bean
    @Profile({"development", "staging"})  // 生产环境不启用Web监控
    public ServletRegistrationBean<StatViewServlet> druidStatViewServlet() {
        ServletRegistrationBean<StatViewServlet> registrationBean = new ServletRegistrationBean<>();
        registrationBean.setServlet(new StatViewServlet());
        registrationBean.addUrlMappings("/druid/*");
        
        // 监控页面登录用户名和密码
        registrationBean.addInitParameter("loginUsername", "admin");
        registrationBean.addInitParameter("loginPassword", "admin123");
        
        // IP白名单
        registrationBean.addInitParameter("allow", "127.0.0.1,192.168.1.0/24");
        
        // IP黑名单
        registrationBean.addInitParameter("deny", "");
        
        // 禁用HTML页面上的"Reset All"功能
        registrationBean.addInitParameter("resetEnable", "false");
        
        logger.info("Druid监控页面配置完成: /druid/");
        
        return registrationBean;
    }
    
    /**
     * Druid Web统计过滤器配置
     */
    @Bean
    @Profile({"development", "staging"})
    public FilterRegistrationBean<WebStatFilter> druidWebStatFilter() {
        FilterRegistrationBean<WebStatFilter> registrationBean = new FilterRegistrationBean<>();
        registrationBean.setFilter(new WebStatFilter());
        
        // 过滤所有请求
        registrationBean.addUrlPatterns("/*");
        
        // 排除静态资源
        registrationBean.addInitParameter("exclusions", "*.js,*.gif,*.jpg,*.png,*.css,*.ico,/druid/*");
        
        // 开启session统计
        registrationBean.addInitParameter("sessionStatEnable", "true");
        registrationBean.addInitParameter("sessionStatMaxCount", "1000");
        
        logger.info("Druid Web统计过滤器配置完成");
        
        return registrationBean;
    }
}

/**
 * 动态数据源实现
 */
class DynamicDataSource extends org.springframework.jdbc.datasource.lookup.AbstractRoutingDataSource {
    
    private static final ThreadLocal<String> CONTEXT_HOLDER = new ThreadLocal<>();
    
    @Override
    protected Object determineCurrentLookupKey() {
        return getDataSourceType();
    }
    
    public static void setDataSourceType(String dataSourceType) {
        CONTEXT_HOLDER.set(dataSourceType);
    }
    
    public static String getDataSourceType() {
        return CONTEXT_HOLDER.get();
    }
    
    public static void clearDataSourceType() {
        CONTEXT_HOLDER.remove();
    }
}
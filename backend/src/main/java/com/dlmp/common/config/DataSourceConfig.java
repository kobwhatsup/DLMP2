package com.dlmp.common.config;

import com.alibaba.druid.pool.DruidDataSource;
import com.alibaba.druid.support.http.StatViewServlet;
import com.alibaba.druid.support.http.WebStatFilter;
import lombok.extern.slf4j.Slf4j;
import org.apache.shardingsphere.driver.api.ShardingSphereDataSourceFactory;
import org.apache.shardingsphere.infra.config.algorithm.ShardingSphereAlgorithmConfiguration;
import org.apache.shardingsphere.readwritesplitting.api.ReadwriteSplittingRuleConfiguration;
import org.apache.shardingsphere.readwritesplitting.api.rule.ReadwriteSplittingDataSourceRuleConfiguration;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.boot.web.servlet.ServletRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;

import javax.sql.DataSource;
import java.sql.SQLException;
import java.util.*;

/**
 * 数据源配置
 * 支持读写分离、连接池优化
 * 
 * @author DLMP Team
 */
@Slf4j
@Configuration
public class DataSourceConfig {

    /**
     * 主数据源配置
     */
    @Bean
    @ConfigurationProperties(prefix = "spring.datasource.master")
    public DruidDataSource masterDataSource() {
        DruidDataSource dataSource = new DruidDataSource();
        configureDataSource(dataSource, "master");
        return dataSource;
    }

    /**
     * 从数据源配置
     */
    @Bean
    @ConfigurationProperties(prefix = "spring.datasource.slave")
    @Profile("!test")
    public DruidDataSource slaveDataSource() {
        DruidDataSource dataSource = new DruidDataSource();
        configureDataSource(dataSource, "slave");
        return dataSource;
    }

    /**
     * 读写分离数据源
     */
    @Bean
    @Primary
    @Profile("!test")
    public DataSource shardingSphereDataSource() throws SQLException {
        Map<String, DataSource> dataSourceMap = new HashMap<>();
        dataSourceMap.put("master", masterDataSource());
        dataSourceMap.put("slave", slaveDataSource());

        // 读写分离规则配置
        ReadwriteSplittingDataSourceRuleConfiguration dataSourceConfig = 
            new ReadwriteSplittingDataSourceRuleConfiguration(
                "dlmp_rw_ds", 
                "master", 
                Arrays.asList("slave"), 
                "round_robin"
            );

        ReadwriteSplittingRuleConfiguration ruleConfig = 
            new ReadwriteSplittingRuleConfiguration(
                Arrays.asList(dataSourceConfig),
                Map.of("round_robin", new ShardingSphereAlgorithmConfiguration("ROUND_ROBIN", new Properties()))
            );

        Properties props = new Properties();
        props.setProperty("sql-show", "false");
        props.setProperty("check-table-metadata-enabled", "false");

        return ShardingSphereDataSourceFactory.createDataSource(
            dataSourceMap, 
            Arrays.asList(ruleConfig), 
            props
        );
    }

    /**
     * 测试环境单数据源
     */
    @Bean
    @Primary
    @Profile("test")
    public DataSource testDataSource() {
        return masterDataSource();
    }

    /**
     * 配置Druid数据源
     */
    private void configureDataSource(DruidDataSource dataSource, String name) {
        try {
            // 基础配置
            dataSource.setDriverClassName("com.mysql.cj.jdbc.Driver");
            
            // 连接池配置
            dataSource.setInitialSize(5);
            dataSource.setMinIdle(5);
            dataSource.setMaxActive(100);
            dataSource.setMaxWait(60000);
            dataSource.setTimeBetweenEvictionRunsMillis(60000);
            dataSource.setMinEvictableIdleTimeMillis(300000);
            dataSource.setMaxEvictableIdleTimeMillis(900000);
            
            // 连接检测
            dataSource.setValidationQuery("SELECT 1");
            dataSource.setValidationQueryTimeout(3);
            dataSource.setTestWhileIdle(true);
            dataSource.setTestOnBorrow(false);
            dataSource.setTestOnReturn(false);
            
            // 连接泄漏检测
            dataSource.setRemoveAbandoned(true);
            dataSource.setRemoveAbandonedTimeout(1800);
            dataSource.setLogAbandoned(true);
            
            // 预处理语句缓存
            dataSource.setPoolPreparedStatements(true);
            dataSource.setMaxPoolPreparedStatementPerConnectionSize(20);
            
            // 监控配置
            dataSource.setFilters("stat,wall,slf4j");
            
            // 连接属性
            Properties connectProperties = new Properties();
            connectProperties.setProperty("druid.stat.mergeSql", "true");
            connectProperties.setProperty("druid.stat.slowSqlMillis", "1000");
            connectProperties.setProperty("characterEncoding", "utf8mb4");
            connectProperties.setProperty("useUnicode", "true");
            connectProperties.setProperty("useSSL", "false");
            connectProperties.setProperty("allowPublicKeyRetrieval", "true");
            connectProperties.setProperty("serverTimezone", "Asia/Shanghai");
            connectProperties.setProperty("rewriteBatchedStatements", "true");
            connectProperties.setProperty("cachePrepStmts", "true");
            connectProperties.setProperty("prepStmtCacheSize", "250");
            connectProperties.setProperty("prepStmtCacheSqlLimit", "2048");
            dataSource.setConnectProperties(connectProperties);
            
            log.info("Druid数据源[{}]配置完成", name);
            
        } catch (SQLException e) {
            log.error("配置Druid数据源[{}]失败", name, e);
            throw new RuntimeException("数据源配置失败", e);
        }
    }

    /**
     * 配置Druid监控页面
     */
    @Bean
    public ServletRegistrationBean<StatViewServlet> druidStatViewServlet() {
        ServletRegistrationBean<StatViewServlet> registrationBean = 
            new ServletRegistrationBean<>(new StatViewServlet(), "/druid/*");
        
        // 监控页面登录用户名和密码
        registrationBean.addInitParameter("loginUsername", "admin");
        registrationBean.addInitParameter("loginPassword", "admin123");
        
        // 允许访问的IP（为空或null表示允许所有）
        registrationBean.addInitParameter("allow", "");
        
        // 禁止访问的IP
        registrationBean.addInitParameter("deny", "");
        
        return registrationBean;
    }

    /**
     * 配置Druid监控过滤器
     */
    @Bean
    public FilterRegistrationBean<WebStatFilter> druidWebStatFilter() {
        FilterRegistrationBean<WebStatFilter> registrationBean = 
            new FilterRegistrationBean<>(new WebStatFilter());
        
        // 过滤所有请求
        registrationBean.addUrlPatterns("/*");
        
        // 排除的资源
        registrationBean.addInitParameter("exclusions", 
            "*.js,*.gif,*.jpg,*.png,*.css,*.ico,/druid/*");
        
        return registrationBean;
    }
}
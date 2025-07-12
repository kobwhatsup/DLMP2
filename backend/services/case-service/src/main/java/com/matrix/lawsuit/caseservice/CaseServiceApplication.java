package com.matrix.lawsuit.caseservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

/**
 * 案件管理服务启动类
 */
@SpringBootApplication(scanBasePackages = {"com.matrix.lawsuit"})
@EnableDiscoveryClient
public class CaseServiceApplication {
    
    public static void main(String[] args) {
        SpringApplication.run(CaseServiceApplication.class, args);
        System.out.println("===============================================");
        System.out.println("(♥◠‿◠)ﾉﾞ  案件管理服务启动成功   ლ(´ڡ`ლ)ﾞ");
        System.out.println("===============================================");
    }
}
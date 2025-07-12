package com.matrix.lawsuit.litigation;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

/**
 * 诉讼管理服务启动类
 */
@SpringBootApplication(scanBasePackages = {"com.matrix.lawsuit"})
@EnableDiscoveryClient
public class LitigationServiceApplication {
    
    public static void main(String[] args) {
        SpringApplication.run(LitigationServiceApplication.class, args);
        System.out.println("===============================================");
        System.out.println("(♥◠‿◠)ﾉﾞ  诉讼管理服务启动成功   ლ(´ඡ`ლ)ﾞ");
        System.out.println("===============================================");
    }
}
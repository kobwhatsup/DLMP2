package com.matrix.lawsuit.settlement;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

/**
 * 结算管理服务启动类
 */
@SpringBootApplication(scanBasePackages = {"com.matrix.lawsuit"})
@EnableDiscoveryClient
public class SettlementServiceApplication {
    
    public static void main(String[] args) {
        SpringApplication.run(SettlementServiceApplication.class, args);
        System.out.println("===============================================");
        System.out.println("(♥◠‿◠)ﾉﾞ  结算管理服务启动成功   ლ(´ඡ`ლ)ﾞ");
        System.out.println("===============================================");
    }
}
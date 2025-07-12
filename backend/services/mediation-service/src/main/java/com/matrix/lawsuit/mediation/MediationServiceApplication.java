package com.matrix.lawsuit.mediation;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

/**
 * 调解管理服务启动类
 */
@SpringBootApplication(scanBasePackages = {"com.matrix.lawsuit"})
@EnableDiscoveryClient
public class MediationServiceApplication {
    
    public static void main(String[] args) {
        SpringApplication.run(MediationServiceApplication.class, args);
        System.out.println("===============================================");
        System.out.println("(♥◠‿◠)ﾉﾞ  调解管理服务启动成功   ლ(´ඡ`ლ)ﾞ");
        System.out.println("===============================================");
    }
}
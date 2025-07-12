package com.matrix.lawsuit.notification;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

/**
 * 通知服务启动类
 */
@SpringBootApplication(scanBasePackages = {"com.matrix.lawsuit"})
@EnableDiscoveryClient
public class NotificationServiceApplication {
    
    public static void main(String[] args) {
        SpringApplication.run(NotificationServiceApplication.class, args);
        System.out.println("===============================================");
        System.out.println("(♥◠‿◠)ﾉﾞ  通知服务启动成功   ლ(´ඡ`ლ)ﾞ");
        System.out.println("===============================================");
    }
}
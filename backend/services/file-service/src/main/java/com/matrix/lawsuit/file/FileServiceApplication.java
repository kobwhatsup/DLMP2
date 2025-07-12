package com.matrix.lawsuit.file;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

/**
 * 文件管理服务启动类
 */
@SpringBootApplication(scanBasePackages = {"com.matrix.lawsuit"})
@EnableDiscoveryClient
public class FileServiceApplication {
    
    public static void main(String[] args) {
        SpringApplication.run(FileServiceApplication.class, args);
        System.out.println("===============================================");
        System.out.println("(♥◠‿◠)ﾉﾞ  文件管理服务启动成功   ლ(´ඡ`ლ)ﾞ");
        System.out.println("===============================================");
    }
}
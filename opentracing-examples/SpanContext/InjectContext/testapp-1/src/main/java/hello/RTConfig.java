package hello;

import org.springframework.web.client.RestTemplate;
import org.springframework.boot.web.client.RestTemplateBuilder;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;

@Configuration
@EnableAutoConfiguration
public class RTConfig {

    //This RestTemplate approach will not work in versions of Spring Boot older than 1.4, but the ot-spring-cloud package has legacy support
    //If using 1.4 don't need to reference restTemplateBuilder as best as we can tell
    @Bean   
    public RestTemplate restTemplate(RestTemplateBuilder restTemplateBuilder) {
        return restTemplateBuilder.build();
    }
}

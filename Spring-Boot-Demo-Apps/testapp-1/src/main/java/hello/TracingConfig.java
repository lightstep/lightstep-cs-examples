package hello;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;

import io.opentracing.Tracer;

@Configuration                  //Setup tracer to be available for ot-spring-cloud / globally within the Spring container
@EnableAutoConfiguration
public class TracingConfig {

    @Bean
    public Tracer lightstepTracer() throws Exception {
        return new com.lightstep.tracer.jre.JRETracer(
                new com.lightstep.tracer.shared.Options.OptionsBuilder()
                        .withComponentName("autowired-spring-1")
                        .withAccessToken("s1j2ga0gaLO0+SbDjhnXeF0T6UYq/Y9p5rxkQudIw4iqIGmr8yASmG0do+0CJKjTQHt1XjPOMFy8bdg5do5s/8NuBlvYINvWIEnYTx6l")
                        .withVerbosity(4)
                        .build());
    }
}

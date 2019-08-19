package hello;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;

import io.opentracing.Tracer;

@Configuration
@EnableAutoConfiguration
public class TracingConfig {

    @Bean
    public Tracer lightstepTracer() throws Exception {
        return new com.lightstep.tracer.jre.JRETracer(
                new com.lightstep.tracer.shared.Options.OptionsBuilder()
                        .withComponentName("forrest-spring-2")
                        .withAccessToken("project-key")
                        .withVerbosity(4)
                        .build());
    }
}

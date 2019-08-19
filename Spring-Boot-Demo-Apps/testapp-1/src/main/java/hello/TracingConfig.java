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
                        .withComponentName("forrest-spring-1")
                        .withAccessToken("project-key")
                        .withVerbosity(4)
                        .build());
    }
}

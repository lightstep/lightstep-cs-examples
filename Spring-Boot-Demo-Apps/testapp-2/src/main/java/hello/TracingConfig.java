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
                        .withComponentName("test-spring-2")
                        .withAccessToken("YOUR-ACCES-TOKEN")
                        .withVerbosity(4)
                        .build());
    }
}

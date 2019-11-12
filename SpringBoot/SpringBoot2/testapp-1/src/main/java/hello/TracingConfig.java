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
                        .withComponentName("forrest-spring-latest-dependencies-1")
                        .withAccessToken("BxY7tSC/XSvTcQzdU1UfF1dclB94Kqr8cjDtQ8yg2k85qzJUKe11Qagumnceb4adPmX18UG7eTeNHpLdXIusfioTtqX8GnPoePB3z1Gs")
                        .withVerbosity(4)
                        .build());
    }
}

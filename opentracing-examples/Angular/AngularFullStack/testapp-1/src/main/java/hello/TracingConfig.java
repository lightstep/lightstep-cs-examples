package hello;

import org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration;
import org.springframework.boot.autoconfigure.orm.jpa.HibernateJpaAutoConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;

import io.opentracing.Tracer;


@Configuration                  //Setup tracer to be available for ot-spring-cloud / globally within the Spring container
@EnableAutoConfiguration (exclude={DataSourceAutoConfiguration.class, HibernateJpaAutoConfiguration.class})

public class TracingConfig {

    @Bean
    public Tracer lightstepTracer() throws Exception {
        return new com.lightstep.tracer.jre.JRETracer(
                new com.lightstep.tracer.shared.Options.OptionsBuilder()
                        .withComponentName("forrest-spring-1-test")
                        .withAccessToken("YOUR_ACCESS_TOKEN")
//                        .withAccessToken("developer")
                        .withVerbosity(4)
//                        .withCollectorHost("localhost")
//                        .withCollectorPort(8360)
//                        .withCollectorProtocol("http")
                        .build());
    }
}

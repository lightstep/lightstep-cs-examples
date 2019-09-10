package hello;

import org.springframework.beans.factory.annotation.Autowired;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.client.RestTemplate;

import io.opentracing.Tracer;
import io.opentracing.Span;
import io.opentracing.Scope;

import java.util.concurrent.atomic.AtomicLong;


//@CrossOrigin(origins = "http://localhost:4200")
@RestController
public class HelloController {
        
    @Autowired
    private RestTemplate restTemplate;  //Bring in the @Bean-annotated RestTemplate from RTConfig

    @Autowired
    private Tracer tracer;              //Bring in the @Bean-annotated Tracer from TracingConfig
    private final AtomicLong counter = new AtomicLong();


    @RequestMapping("/")
    @CrossOrigin(origins = "http://localhost:4200")
    public ResponsePojo index() {
    
        String uri = "http://localhost:8081/";
        Span testspan = tracer.scopeManager().active().span();          //Create new custom span using Tracer attached to the Spring container via @Bean
        testspan.setTag("Downstream-URI",uri);                          //Add custom tag to new span
        String result = restTemplate.getForObject(uri, String.class);   //Make outbound call to second service using restTemplate attached to Spring
                                                                        // container via @Bean ()
        try (Scope scope = tracer.buildSpan("anotherSpan").startActive(true)) {
            System.out.println(result);
        } catch (Exception ex) {

        }

        return new ResponsePojo("Greetings from test-app-1 using Spring Boot 1.5", counter.incrementAndGet());
    }
    
}

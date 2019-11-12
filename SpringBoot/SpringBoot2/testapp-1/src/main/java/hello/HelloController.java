package hello;

import io.opentracing.ScopeManager;
import org.springframework.beans.factory.annotation.Autowired;

import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.client.RestTemplate;

import io.opentracing.Tracer;
import io.opentracing.Span;
import io.opentracing.Scope;


@RestController
public class HelloController {
        
    @Autowired
    private RestTemplate restTemplate;  //Bring in the @Bean-annotated RestTemplate from RTConfig

    @Autowired
    private Tracer tracer;              //Bring in the @Bean-annotated Tracer from TracingConfig

    @RequestMapping("/")
    public String index() {
        Span span = tracer.buildSpan("rootMappingSpan").start();
        tracer.scopeManager().activate(span);
        span.setTag("type","1");
        String uri = "http://localhost:8081/";
        String result = restTemplate.getForObject(uri, String.class);   //Make outbound call to second service using restTemplate attached to Spring
                                                                        // container via @Bean ()
        System.out.println(result);
        span.log(result);
        span.finish();

        return "Greetings from test-app-1";
    }
    
}

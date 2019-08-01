package hello;

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
    private RestTemplate restTemplate;

    @RequestMapping("/")
    public String index() {
    
        String uri = "http://localhost:8081/";
        String result = restTemplate.getForObject(uri, String.class);   //Make outbound call to second service using restTemplate attached to Spring
        System.out.println(result);

        return "Top Level Service";
    }
    
}

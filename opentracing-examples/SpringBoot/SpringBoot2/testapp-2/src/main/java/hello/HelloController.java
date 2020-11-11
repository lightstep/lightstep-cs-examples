package hello;

import org.springframework.beans.factory.annotation.Autowired;

import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestMapping;

import io.opentracing.Tracer;
import io.opentracing.Span;


@RestController
public class HelloController {

    @Autowired
    private Tracer tracer;

    @RequestMapping("/")
    public String index() {
    
        Span testspan = tracer.scopeManager().active().span();
        testspan.setTag("Hello", "World");

        return "Greetings from testp-app-2!";
    }
    
}

package hello;

import org.springframework.beans.factory.annotation.Autowired;

import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestMapping;

import io.opentracing.Tracer;
import io.opentracing.Span;


@RestController
public class HelloController {

    @RequestMapping("/")
    public String index() {
        return "Greetings from Application 2!";
    }
    
}

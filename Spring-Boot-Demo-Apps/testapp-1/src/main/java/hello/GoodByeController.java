package hello;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

@RestController
public class GoodByeController {
    @Autowired
    private RestTemplate restTemplate;  //Bring in the @Bean-annotated RestTemplate from RTConfig

    @RequestMapping("/bye")
    public String index() {

        String uri = "http://localhost:8081/";
        String result = restTemplate.getForObject(uri, String.class);   //Make outbound call to second service using restTemplate attached to Spring
        System.out.println(result);

        return "Greetings from App 1!";
    }
}

package hello;

public class ResponsePojo {

    private String response;
    private final long id;

    ResponsePojo(String response, long id){
        this.response = response;
        this.id = id;
    }

    public String getResponse() {
        return response;
    }


    public long getId() {
        return id;
    }


}

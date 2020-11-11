import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response

fun main(){
//    print("will it run")
    var client = OkHttpClient();

    var request = Request.Builder()
        .url("http://localhost:8080")
        .build()

    var response : Response = client.newCall(request).execute()

    print(response.body?.string())
}
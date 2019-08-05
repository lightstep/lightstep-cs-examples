package routes

import com.lightstep.tracer.jre.JRETracer
import io.javalin.Javalin
import io.javalin.apibuilder.ApiBuilder.get
import io.javalin.http.Context
import io.opentracing.Tracer


data class Move (val description: String ="", val type: String = "")

val tracer: Tracer = (getTracer("Kotlin Test"))

fun getTracer(service: String): JRETracer {
    val key = KeyService()
    return JRETracer(
        com.lightstep.tracer.shared.Options.OptionsBuilder()
            .withComponentName(service)
            .withAccessToken(key.getProjectKey("/key.txt"))
            .build()
    )
}
fun createRoutes(){

    val handler = MoveRequestHandler(tracer)

    val app = Javalin.create { config ->
        config.defaultContentType = "application/json"
        config.dynamicGzip = true
        config.contextPath = "/api/v1"
    }.routes{
       get("/moves/:move"){ctx: Context -> ctx.json(handler.getMoveByName(ctx))}
        get("/moves/"){ctx: Context -> ctx.json(handler.getAllMoves())}
    }

    app.before { ctx ->
        val span = tracer.buildSpan("api entered").start()
        tracer.scopeManager().activate(span)
        span.setTag("component","javalin.io")
    }

    app.after{ ctx->
        tracer.activeSpan().finish()
    }

    app.error(404) { ctx->
        val span = tracer.buildSpan("404").start()
        tracer.scopeManager().activate(span)
        span.setTag("error", true)
        ctx.json("404, route doesn't exist. Try http://localhost:1991/api/v1/moves")
    }.start(1991)
}

class KeyService{

    fun  getProjectKey(resourcePath:String): String{
    return object {}.javaClass.getResource(resourcePath).readText()
    }
}

class MoveRequestHandler(tracer: Tracer) {

    private val moveDAO = MoveDAO(tracer)

    fun getMoveByName(ctx: Context):Move {
        val span = tracer.buildSpan("getMoveByName").start()
        span.setTag("controller","getmovebyname")

        tracer.scopeManager().activate(span)
        val moveName = ctx.pathParam("move")
        return moveDAO.getMoveByName(moveName)
    }

    fun getAllMoves(): HashMap<String, Move> {
        val span = tracer.buildSpan("getAllMovesHandler").start()
        span.setTag("controller","getallmoves")
        tracer.scopeManager().activate(span)
        return moveDAO.moves
    }

}

class MoveDAO (tracer: Tracer)  {

     val moves = hashMapOf(
        "windmill" to Move(
            "A classic bboy move where the dancer spins around the crown of their head with their legs out",
            "Power Move"
        ),
        "flare" to Move("A classic power move where the dancer throws both legs out in a circle similar to gymnast circles, but with the legs open", "Air Power"),
        "toprock" to Move("The Top Rock is all movement where the breaker is still standing. Set's are typically started with top rock.", "Rocking")
    )

    fun getMoveByName(moveName: String): Move {
        val span = tracer.buildSpan("getMoveByName").start()
        span.setTag("dao","getmovebyname")
        tracer.scopeManager().activate(span)
        return moves.getValue(moveName)
    }
}




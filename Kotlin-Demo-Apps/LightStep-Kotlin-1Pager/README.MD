# Kotlin and LightStep
###### How to instrument a Kotlin app with LightStep/Opentracing - By Forrest Anthony Knight Jr


## Overview
Before we get started we should probably cover some basics. Distributed Tracing refers to the concept of collecting trace data from applications in software architectures that are microservice oriented or similar. It provides information about the state of complex architectures in ways previously impossible. Standard API implementations to get up and running are being developed by the OpenTracing project(https://opentracing.io). Go check it out!

LightStep is a SaSS platform that provides best in industry analysis and insight into distributed trace data. (https://lightstep.com/) Go check it out!

Cool.

## Admin Work
First, make sure you have a LightStep account created and know where your access token is. Instructions here ->(https://docs.lightstep.com/docs/lightstep-tracing-quickstart)

Anyhow..

## Set Up
We are going to instrument a Kotlin REST service built using the Javalin framework. Javalin is lightweight, read up on it here. (https://javalin.io/) I’m a dancer, so my service serves up dance moves.

If you want to see what the api does run dev.sh. It will build everything and run it locally. You will need Docker installed locally.

Here is our starting code:
```` kotlin
package routes

import io.javalin.Javalin
import io.javalin.apibuilder.ApiBuilder.get
import io.javalin.http.Context

data class Move (val description: String ="", val type: String = "")

fun createRoutes(){

   val handler = MoveRequestHandler()

   val app = Javalin.create { config ->
       config.defaultContentType = "application/json"
       config.dynamicGzip = true
       config.contextPath = "/api/v1"
   }.routes{
      get("/moves/:move"){ctx: Context -> ctx.json(handler.getMoveByName(ctx))}
       get("/moves/"){ctx: Context -> ctx.json(handler.getAllMoves())}
   }

   app.before { ctx ->
   }

   app.after{ ctx->
   }

   app.error(404) { ctx->
       ctx.json("404, route doesn't exist. Try http://localhost:1991/api/v1/moves")
   }.start(1991)
}

class MoveRequestHandler {

   private val moveDAO = MoveDAO()

   fun getMoveByName(ctx: Context):Move {
       val moveName = ctx.pathParam("move")
       return moveDAO.getMoveByName(moveName)
   }

   fun getAllMoves(): HashMap<String, Move> {
       return moveDAO.moves
   }

}

class MoveDAO {
    val moves = hashMapOf(
       "windmill" to Move(
           "A classic bboy move where the dancer spins around the crown of their head with their legs out",
           "Power Move"
       ),
       "flare" to Move("A classic power move where the dancer throws both legs out in a circle similar to gymnast circles, but with the legs open", "Air Power"),
       "toprock" to Move("The Top Rock is all movement where the breaker is still standing. Set's are typically started with top rock.", "Rocking")
   )
   fun getMoveByName(moveName: String): Move {

       return moves.getValue(moveName)
   }
}
````


## Dependencies
Add the OpenTracing and  LightStep tracer dependencies to your project.

Just copy these into your gradle file.
```` gradle
compile 'com.lightstep.tracer:lightstep-tracer-jre:0.14.6'
compile 'com.lightstep.tracer:tracer-okhttp:0.17.2'
compile group: 'org.slf4j', name: 'slf4j-simple', version: '1.7.25'

compile 'io.opentracing:opentracing-api:0.33.0'
````

## Create an init function for a global tracer
Kotlin is interesting in that we can create functions outside of classes and use them loosely. If you know how Kotlin in the JVM works, you know what happens once it compiles, but for now, lets throw this at the top of our file.

```` kotlin
val tracer:Tracer = getTracer("Kotlin Test")

fun getTracer(service: String): Tracer {
   return JRETracer(
       com.lightstep.tracer.shared.Options.OptionsBuilder()
           .withAccessToken("YOUR_ACCESS_TOKEN")
           .withClockSkewCorrection(false)
           .build()
   )
}
````

## Instrumentation - Adding the Tracer
Javalin has some cool route level handlers we can use such as before() and after(). Add the following to the createRoutes() function so we can create spans and send data to LightStep everytime an endpoint is hit.
```` kotlin
app.before { ctx ->
   val span = tracer.buildSpan("api entered").start()
   tracer.scopeManager().activate(span)
   span.setTag("api","entry")
}

app.after{ ctx->
   tracer.activeSpan().finish()
}
````
## Tracing our controllers and DAO
We need to trace the specific handlers and DAO for this mini service. 

## Handler/controller
```` kotlin
class MoveRequestHandler(tracer: Tracer) {

   private val moveDAO = MoveDAO(tracer)

   fun getMoveByName(ctx: Context):Move {
       val span = tracer.buildSpan("getMoveByNameHANDLER").start()
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
````

## DAO
```` kotlin
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
       val span = tracer.buildSpan("getMoveByNameDAO").start()
       span.setTag("dao","getmovebyname")
       tracer.scopeManager().activate(span)
       return moves.getValue(moveName)
   }
}
````

## And we are done!

Complete example source here:
https://github.com/Mrfoofums/LightStep-Kotlin-1Pager

## Full App Code
Typically we wouldn’t put request controllers and DAO in the same file, but I did here for the sake of example.
package routes

```` kotlin
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




````









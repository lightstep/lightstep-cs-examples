package Propagation

import io.opentracing.tag.Tags
import routes.tracer


fun setup(){

    Tags.SPAN_KIND.set(tracer.activeSpan(), Tags.SPAN_KIND_SERVER)

}
# Introduction
There are two Spring Boot applications in this directory, both instrumented using the [OpenTracing Spring Cloud](https://github.com/opentracing-contrib/java-spring-cloud) plugin. It is built using the [Spring Boot starter project](https://github.com/spring-projects/spring-boot/tree/master/spring-boot-project/spring-boot-starters) and is intended to be used as an example for three primary OpenTracing concepts:

1. Doing automatic SpanContext propagation through the plugin's RestController instrumentation which handles inject/extract automatically
2. Creating new spans in Java using the ScopeManager interface, and creating child spans explicitly
3. Adding tags to spans

# Getting Started
1. Add your LightStep access token (generated at https://app.lightstep.com/<project-name>/project) to the `TracingConfig.java` file (replacing `access-token-here` with your project token).
2. Build and run both applications (`testapp-1` and `testapp-2`) using Gradle (*note: as of 6/2019 the OpenTracing plugins have not been added to the `pom.xml` for Maven support. This can be ported over from tthe `build.gradle` as needed*)
```
gradle bootRun
```
3. Curl or visit `localhost:8080` to send a request to `testapp-1`. This will trigger a second, traced request to `testapp-2`.
import { Injectable } from '@angular/core';
import * as lightstepTracer from 'lightstep-tracer';
import * as opentracing from 'opentracing';

@Injectable({
  providedIn: 'root'
})
export class TracerService {

  constructor() {
    // Put your Access/Project Token in your env config for prod
    this.initGlobalTracer('84614595d97865a0dc71229ff7f50d1e', 'FullStackAngular');
   }

   // Due to the xhr_instrumentation flag being true, all http calls will be traced
   initGlobalTracer(accessToken: string, componentName: string) {
    const options: lightstepTracer.TracerOptions = {
      access_token: accessToken,
      component_name: componentName,
      xhr_instrumentation: true
    };

    opentracing.initGlobalTracer( new lightstepTracer.Tracer(options));
   }


}

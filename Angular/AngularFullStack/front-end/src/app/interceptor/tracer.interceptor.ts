import { Injectable } from '@angular/core';
import {
  HttpEvent, HttpInterceptor, HttpHandler, HttpRequest, HttpResponse, HttpErrorResponse
} from '@angular/common/http';

import { Observable } from 'rxjs';
import { finalize, tap } from 'rxjs/operators';
import * as opentracing from 'opentracing';
import * as lightstepTracer from 'lightstep-tracer';

@Injectable()
export class TracerInterceptor implements HttpInterceptor {

  constructor() {
    this.initGlobalTracer('YOUR_ACCESS_TOKEN', 'TraceInterceptor');
   }

   initGlobalTracer(accessToken: string, componentName: string) {
    const options: lightstepTracer.TracerOptions = {
      access_token: accessToken,
      component_name: componentName
    };
    opentracing.initGlobalTracer( new lightstepTracer.Tracer(options));
   }

  intercept(req: HttpRequest<any>, next: HttpHandler):
    Observable<HttpEvent<any>> {
    const span = opentracing.globalTracer().startSpan(this.getName(req));
    const tracedReq = this.injectContext(span, req);
    return next.handle(tracedReq)
    .pipe(
        tap(
            (event: HttpEvent<any>) => {
                if (event instanceof HttpResponse) {
                    span.log(event.body);
                }
            },
            (event: HttpErrorResponse) => {
                if (event instanceof HttpErrorResponse) {
                    span.setTag('error', true);
                    span.log(event);
                }
            }
          ),
        finalize(() => {
            span.finish();
        })
    );
  }

  injectContext(span: opentracing.Span, req: HttpRequest<any> ): HttpRequest<any> {
    const carrier = {};
    opentracing.globalTracer().inject(span.context(), opentracing.FORMAT_TEXT_MAP, carrier);
    const clone = req.clone({
      headers: req.headers
      .set('ot-tracer-sampled', carrier['ot-tracer-sampled'])
      .set('ot-tracer-spanid', carrier['ot-tracer-spanid'])
      .set('ot-tracer-traceid', carrier['ot-tracer-traceid'])
    });
    return clone;
  }

  getName(req: HttpRequest<any>): string {
    if (req.headers.has('traceOperationName')) {
        return req.headers.get('traceOperationName');
    } else {
        return req.url;
    }
  }
}

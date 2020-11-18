import { Component, OnInit } from '@angular/core';
import { TracerService } from '../tracer.service';
import { Observable, Observer } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import * as opentracing from 'opentracing';
import { TracerInterceptor } from '../interceptor/tracer.interceptor';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

  result: any;
  url = 'http://localhost:8080';
  constructor(private http: HttpClient) {



    // const span = opentracing.globalTracer().startSpan('Get:80');
    this.http.get(this.url).subscribe((data) => {
      this.result = data;
    },
    error => {
      this.result = error;
    });
  }

  ngOnInit() {
  }

}

import { TestBed } from '@angular/core/testing';

import { TracerService } from './tracer.service';

describe('TracerService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: TracerService = TestBed.get(TracerService);
    expect(service).toBeTruthy();
  });
});

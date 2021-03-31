# Super Service Diagram

## Flow

### Scheduler

1. Get all services
2. Get all streams
3. Filter streams on a service
4. Get last 10 minutes of traces for stream
5. Process a service diagram per trace, timestamping edges
6. Also process attributes and their values, with timestamps

### API

1. GET /services
2. GET /services?attribute=example
3. GET /services/diagram
4. GET /attributes

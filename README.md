# Event Dashboard mini project

I am implementing a simple angular app presenting a chart of sensor metrics using Kafka, Nodejs, Expressjs and websocket.
The architecture looks like the diagram below:
![](docs/hlview.png)

## Prerequisites
* Install Angular 7.0+
* Under the UI folder run `npm install`
* Build the user interface with `ng build`
* Under the Server run also `npm install`
* Have a Kafka Broker accessible.

## Server code
The nodejs server code is listening to a kafka topic to get sensor metrics and propagate those events to the angular app via websocket.
The code mix standard nodejs express to expose REST api for the UI and websocket connection.


## Client Code
### Charting data
Simple Angular app created with the last CLI 7.1 and with the [Chart](http://www.chartjs.org) library.
The app.module is modified:
```js
import { ChartsModule } from 'ng2-charts';
// ...
imports: [
  BrowserModule,
  ChartsModule
],
```

Then we configure the data and options in the app.components. See [chart documentation](http://www.chartjs.org/docs/latest/configuration/) for options.

### Get real time events
For the connection to the backend via websocket: The best way to implement WebSockets in our angular applications would be to encapsulate our WebSockets and events in a service and then call that service in whatever components we wish to interact with a websocket.

To avoid an issue with socket.io and Angular 7, we need to define the global variable to the active window using the following line of code in polyfills.ts
```
 (window as any).global = window;
```

/*
Server responsible to support websocket connection, connect to a kafka topic and then
broadcast AssetMetrics coming from kafka to the connected dashboard.
*/

import * as express from 'express';
import * as http from 'http';
import * as WebSocket from 'ws';
import * as kafka from 'kafka-node';
import * as path from 'path';

// const kafka = require('kafka-node');
const app = express();

//initialize a simple http server
const server = http.createServer(app);

// use kafka client to subscribe to events to push to UI
const topicName = 'asset-topic';
// setup Kafka client
const client = new kafka.KafkaClient({
    kafkaHost: 'gc-kafka-0.gc-kafka-hl-svc.greencompute.svc.cluster.local:32224',
    connectTimeout: 15000,
    autoConnect: true
});


// start Kafka consumer
function startConsumer(socket: WebSocket) {
    const consumer = new kafka.Consumer(client,
      // array of FetchRequest
      [{ topic: topicName }],
      // options
       {groupId: 'asset-dashboard-group',
         autoCommit: true,
         autoCommitIntervalMs: 5000,
         fetchMaxWaitMs: 10,
         fetchMinBytes: 1,
          // The maximum bytes to include in the message set for this partition. This helps bound the size of the response.
          fetchMaxBytes: 1024 * 1024,
          // If set true, consumer will fetch message from the given offset in the payloads
          fromOffset: false,
          // If set to 'buffer', values will be returned as raw buffer objects.
          encoding: 'utf8',
          keyEncoding: 'utf8'});

    consumer.on('message', (message) => {

        console.log('Asset Metric Event received: ' + JSON.stringify(message, null, 4));
        // push the dashboard via socket
        socket.send(JSON.stringify(message));
    });
    console.log('Kafka consumer is ready');
}

//initialize the WebSocket server instance
const wss = new WebSocket.Server({ server });

interface ExtWebSocket extends WebSocket {
    isAlive: boolean;
}

export class AssetMetric {
  assetId: string = '';
  rotation?: number = 0;
  current?: number = 0;
  pressure?: number = 0;
  flowRate?: number = 0;
  temperature?: number = 0;
  timeStamp?: any;
}

wss.on('connection', (ws: WebSocket) => {

    const extWs = ws as ExtWebSocket;
    console.warn(`Client connected`);
    extWs.isAlive = true;
    startConsumer(ws);
    ws.on('message', () => {
        extWs.isAlive = true;
        ws.send('ping');
    });
    ws.on('error', (err) => {
        console.warn(`Client disconnected - reason: ${err}`);
    })
  });

  // Point static path to dist
  app.use(express.static(path.join(__dirname, './static')));
  // Catch all other routes and return the index file
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, './static/index.html'));
  });

//start our server
server.listen(process.env.PORT || 3000, () => {
    let addr: string = JSON.stringify(server.address());
    console.log(`Server started on port ${addr} :)`);
});

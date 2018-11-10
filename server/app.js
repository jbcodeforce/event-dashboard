/*
Server responsible to support websocket connection, connect to a kafka topic and then
broadcast AssetMetrics coming from kafka to the connected dashboard. 
*/

// use kafka client to subscribe to events to push to UI
const kafka = require('kafka-node');
const topicName = 'asset-topic';
// setup Kafka client
const client = new kafka.KafkaClient({
    kafkaHost: 'gc-kafka-0.gc-kafka-hl-svc.greencompute.svc.cluster.local:32224'
});


// Setup Express server
const express = require('express');
const app = express();
const path = require('path');

// use socket io for bidirectional communication with Angular app
var http = require('http').Server(app);
// listen on the connection event for incoming sockets
var io = require('socket.io')(http);

// start Kafka consumer
function startConsumer(socket) {
    const consumer = new kafka.Consumer(client, [{
        topic: topicName
    }]);

    consumer.on('message', (message) => {
        console.log('Asset Metric Event received: ' + JSON.stringify(message, null, 4));
        // push the dashboard via socket
        socket.emit('assetmetric',message);
    });
    console.log('Kafka consumer is ready');
}

// Define end point for socket
io.on('connection', function(socket){
  console.log('a dashboard is connected....start getting events');
  startConsumer(socket);
  socket.on('disconnect', function(){
    console.log('dashboard disconnected');
  });
});





// Start Web Server to serve Angular app
const port = 3000;
// Point static path to dist
app.use(express.static(path.join(__dirname, './static')));
// Catch all other routes and return the index file
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, './static/index.html'));
});


http.listen(port, () => {
     console.log('Express server started on port: ' + port);

});

var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var ids = [];

function shuffle(array) {
  for (let i = array.length - 1; i >= 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

var card = [1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,10];
var yamahuda = shuffle(card);
var tensei = yamahuda.shift();
var first_turn = Math.floor(Math.random() * 2);
var first = '<h3> first turn </h3>';

 
app.set('port', (process.env.PORT || 5000));
app.use(express.static(__dirname + '/public'));
 
app.get('/', function(request, response) {
  res.sendFile(__dirname + '/public/index.html')
});
 
http.listen(app.get('port'), function(){
  console.log('listening on *:' + app.get('port'));
})
// app.listen(app.get('port'), function() {
//   console.log("Node app is running at localhost:" + app.get('port'));
// });
//
io.sockets.on('connection', function(socket) {
    var room = '';
    var name = '';

    
    // card を場に出す
    socket.on('client_to_server_card_drop', function(data){
      io.to(socket.id).emit('server_to_client_card_drop_player', {value : data.value});
      socket.broadcast.to(room).emit('server_to_client_card_drop_aite',{value : data.value});
    });

 
    // roomへの入室は、「socket.join(room名)」
    socket.on('client_to_server_join', function(data) {
        room = data.value;
        socket.join(room);
    });
    // S05. client_to_serverイベント・データを受信する
    socket.on('client_to_server', function(data) {
        // S06. server_to_clientイベント・データを送信する
        io.to(room).emit('server_to_client', {value : data.value});
    });
    // S07. client_to_server_broadcastイベント・データを受信し、送信元以外に送信する
    socket.on('client_to_server_broadcast', function(data) {
        socket.broadcast.to(room).emit('server_to_client', {value : data.value});
    });
    // S08. client_to_server_personalイベント・データを受信し、送信元のみに送信する
    socket.on('client_to_server_personal', function(data) {
        var id = socket.id;
        ids.push(id);
        name = data.value;
        var personalMessage = "あなたは、" + name + "さんとして入室しました。"
        io.to(id).emit('server_to_client', {value : personalMessage});

        // first turn step
        if(ids.length == 2){

          if(first_turn == 0){
            io.to(ids[0]).emit('server_to_client_card',{value : yamahuda.shift()});
            io.to(ids[0]).emit('server_to_client', {value : first});
            io.to(ids[1]).emit('server_to_client_card',{value : yamahuda.shift()});
          }else{
            io.to(ids[0]).emit('server_to_client_card',{value : yamahuda.shift()});
            io.to(ids[1]).emit('server_to_client_card',{value : yamahuda.shift()});
            io.to(ids[1]).emit('server_to_client',{value : first});
          }

          console.log(yamahuda);
        } 
    });
    // S09. dicconnectイベントを受信し、退出メッセージを送信する
    socket.on('disconnect', function() {
        if (name == '') {
            console.log("未入室のまま、どこかへ去っていきました。");
        } else {
            var endMessage = name + "さんが退出しました。"
            io.to(room).emit('server_to_client', {value : endMessage});
            for(var i=0; i<ids.length; i++){
              if(ids[i] == socket.id){
                ids.splice(i,1);
              }
            }
        }
    });
});

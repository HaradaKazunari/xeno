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

//xeno用変数
var yamahuda;
var sutehuda = [];
var tehuda = [];
var turn;
var drow;
var tensei;
var set_number = [1,2,3,4,5,6,7,8,9,10];
var turn_text = "<h3> Your turn </h3>";

var efecto = false;
var efecto_4 = false;
var efecto_4_check;
var efecto_6_check;
var efecto_7;
var efecto_7_check = false;
var efecto_7_1;
var efecto_7_2;
var efecto_7_3;

function set(){
  yamahuda = shuffle([1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,10]);
  sutehuda = [];
  tehuda = [];
  turn = Math.floor(Math.random() * 2);
  tensei = yamahuda.shift();
  efecto = false;
  efecto_4 = false;
  efecto_4_check = 0;
  efecto_6_check = 0;
  efecto_7 = [];
  efecto_7_check = false;
}
 
app.set('port', (process.env.PORT || 5000));
app.use(express.static(__dirname + '/public'));
 
app.get('/', function(request, response) {
  res.sendFile(__dirname + '/public/index.html')
});
 
http.listen(app.get('port'), function(){
  console.log('listening on *:' + app.get('port'));
})

io.sockets.on('connection', function(socket) {
    var name;
    var room;

    function fin(){
      var t = turn == 0 ? 1:0;
      io.to(ids[turn]).emit('server_to_client_2_comp',{value : tehuda[t]});
      io.to(ids[t]).emit('server_to_client_2_comp',{value : tehuda[turn]});

      if(tehuda[0] == tehuda[1]){
        io.to(room).emit('server_to_client_finish',{value : 'drow'})
      }else{
        var player1 = tehuda[0] > tehuda[1] ? 'your win':'your lose';
        var player2 = tehuda[0] < tehuda[1] ? 'your win':'your lose';

        io.to(ids[0]).emit('server_to_client_finish',{value : player1});
        io.to(ids[1]).emit('server_to_client_finish',{value : player2});
      }
    }


    function turn_draw(){
      turn = turn == 0 ? 1 : 0;
      if( efecto_7[0] == turn ){
        efecto_7_1 = yamahuda.shift();
        efecto_7_2 = yamahuda.shift();
        efecto_7_3 = yamahuda.shift();

        efecto_7 = {efecto_7_1,efecto_7_2,efecto_7_3};
        io.to(ids[turn]).emit('server_to_client_7',{value : efecto_7});

      }else{
        drow = yamahuda.shift();

        socket.broadcast.to(room).emit('server_to_client_drow_enemy');
        io.to(ids[turn]).emit('server_to_client_drow',{value : drow});
        io.to(ids[turn]).emit('server_to_client_turn',{value : turn_text});
        io.to(room).emit('server_to_client_number_of_yamahuda',{value : yamahuda.length });
      }
    }

    function sutehuda_card_check(card_id){
      var card_count = 0;
      for(var i=0; i<sutehuda.length; i++){
        if(sutehuda[i] == card_id){
          card_count += 1;
        }
      }  
      if(card_count == 2){
        return true;
      }else{
        return false;
      }
    }

    //カードを場に出す
    socket.on('client_to_server_drop',function(data){
      if(ids[turn] == socket.id && data.value != 10 && efecto == false){
        var drop_id = data.value;

        if(drop_id == tehuda[turn]){
          tehuda[turn] = drow;
        }

        sutehuda.push(drop_id);


        var t = turn == 0 ? 1:0;
        io.to(ids[turn]).emit('server_to_client_my_card_drop',{value : drop_id, tehuda : tehuda[turn]});
        io.to(ids[t]).emit('server_to_client_drop',{value : drop_id});

        if(efecto_4 == true){
          efecto_4_check += 1;
          if(efecto_4_check == 2){
            efecto_4 = false;
            efecto_4_check = 0;
          }
        }

        if(yamahuda.length != 0){
          if(drop_id == 1 && efecto_4 == false){
            //皇帝
            var jud = sutehuda_card_check(drop_id);
              if(jud == true){
                drow = yamahuda.shift();

                var t = turn == 0 ? 1:0;
                io.to(socket.id).emit('server_to_client_1',{tehuda1 : tehuda[t], tehuda2 : drow})
                io.to(ids[t]).emit('server_to_client_drow',{value : drow});
                
                efecto = true;
              }

          }else if(drop_id == 2 && efecto_4 == false){
            //捜査
            io.to(ids[turn]).emit('server_to_client_2');
            efecto = true;

          }else if(drop_id == 3 && efecto_4 == false){
            //透視
            var i = turn == 0 ? 1:0;
            io.to(ids[turn]).emit('server_to_client_3',{value : tehuda[i]});
            efecto = true;
            
          }else if(drop_id == 4){
            //守護
            efecto_4 = true;
            efecto_4_check = 0;

          }else if(drop_id == 5 && efecto_4 == false){
            //疫病
            drow = yamahuda.shift();

            var t = turn == 0 ? 1:0;
            io.to(socket.id).emit('server_to_client_5',{tehuda1 : tehuda[t], tehuda2 : drow})
            io.to(ids[t]).emit('server_to_client_drow',{value : drow});
            
            efecto = true;

          }else if(drop_id == 6 && efecto_4 == false){
            //対決
            var drop_6 = 1;
            var jud = sutehuda_card_check(drop_id);
            if(jud == true){
              yamahuda = []
              drop_6 = 2;
            }

            var t = turn == 0 ? 1:0;
            io.to(ids[turn]).emit('server_to_client_6',{value : tehuda[t], hantei:drop_6})
            io.to(ids[t]).emit('server_to_client_6',{value : tehuda[turn], hantei:drop_6});
            efecto = true;

          }else if(drop_id == 7){
            //賢者
            efecto_7 = [turn];


          }else if(drop_id == 8 && efecto_4 == false){
            //精霊
            tehuda.push(tehuda.shift());
            var i = turn == 0 ? 1:0;
            io.to(ids[turn]).emit('server_to_client_8',{value : tehuda[turn]});
            io.to(ids[i]).emit('server_to_client_8',{value : tehuda[i]});

          }else if(drop_id == 9 && efecto_4 == false){
            //皇帝
            drow = yamahuda.shift();

            var t = turn == 0 ? 1:0;
            io.to(socket.id).emit('server_to_client_9',{tehuda1 : tehuda[t], tehuda2 : drow})
            io.to(ids[t]).emit('server_to_client_drow',{value : drow});
            
            efecto = true;

          }

          if(efecto == false){
            turn_draw();
          }

        }else if(yamahuda.length == 0){
            fin();
        }
      }
    });

    //カード効果1,5終了
    socket.on('client_to_server_1', function(data){
      efecto = false;
      var drop_id = data.value;
      var i = turn == 0 ? 1:0;

      function drop(drop){
        sutehuda.push(drop);
        io.to(ids[i]).emit('server_to_client_my_card_drop',{value : drop, tehuda : tehuda[i]});
        io.to(ids[turn]).emit('server_to_client_drop',{value : drop});
      }

      if(drop_id == tehuda[i]){
        tehuda[i] = drow;
      }
      drop(drop_id);

      if(drop_id == 10){
        drop(tehuda[i]);
        tehuda[i] = tensei;
        io.to(ids[i]).emit('server_to_client_tensei',{value : tensei});
      }

      io.to(ids[turn]).emit('server_to_client_1_comp');
      if(yamahuda.length > 0){
        turn_draw();
      }
    });

    socket.on('client_to_server_2',function(data){
      efecto = false;
      var select = data.value;
      var i = turn == 0 ? 1:0;

      function drop(drop){
        sutehuda.push(drop);
      }
      

      if(tehuda[i] == select){
        if(select == 10){
          drop(tehuda[i]);
          tehuda[i] = tensei;
          io.to(ids[i]).emit('server_to_client_tensei',{value : tensei});
        }else{
          yamahuda = [];
          io.to(ids[turn]).emit('server_to_client_2_comp',{value : tehuda[i]});
          io.to(ids[i]).emit('server_to_client_2_comp',{value : tehuda[turn]});

          io.to(ids[turn]).emit('server_to_client_finish',{value : 'your win'});
          io.to(ids[i]).emit('server_to_client_finish',{value : 'your lose'});
        }
      }

      if(yamahuda.length > 0){
        turn_draw();
      }

    });

     //カード効果3終了
    socket.on('client_to_server_3',function(){
      efecto = false;
      turn_draw();
    });

    //カード効果6終了
    socket.on('client_to_server_6',function(){
      efecto_6_check += 1;
      if(efecto_6_check == 2){
        efecto = false;
        turn_draw();
      }else(efecto_6_check == 4)
        fin();
    });

    //カード効果7終了
    socket.on('client_to_server_7',function(data){
      efecto_7_check = true;
      var selected = data.value;
      var t;
      

      if(selected == 1){
        drow = efecto_7.efecto_7_1;
        t = Math.floor(Math.random() * yamahuda.length);
        yamahuda.splice(t,0,efecto_7.efecto_7_2);
        t = Math.floor(Math.random() * yamahuda.length);
        yamahuda.splice(t,0,efecto_7.efecto_7_3);
      }else if(selected == 2){
        drow = efecto_7.efecto_7_2;
        t = Math.floor(Math.random() * yamahuda.length);
        yamahuda.splice(efecto_7.efecto_7_3);
        t = Math.floor(Math.random() * yamahuda.length);
        yamahuda.splice(efecto_7.efecto_7_1);
      }else if(selected == 3){
        drow = efecto_7.efecto_7_3;
        t = Math.floor(Math.random() * yamahuda.length);
        yamahuda.splice(efecto_7.efecto_7_2);
        t = Math.floor(Math.random() * yamahuda.length);
        yamahuda.splice(efecto_7.efecto_7_1);
      }


      socket.broadcast.to(room).emit('server_to_client_drowi_enemy');
      io.to(ids[turn]).emit('server_to_client_drow',{value : drow});
      io.to(ids[turn]).emit('server_to_client_turn',{value : turn_text});
      io.to(room).emit('server_to_client_number_of_yamahuda',{value : yamahuda.length});

    });

    //カード効果9終了
    socket.on('client_to_server_9', function(data){
      efecto = false;
      var drop_id = data.value;
      var i = turn == 0 ? 1:0;

      function drop(drop){
        sutehuda.push(drop);
        io.to(ids[i]).emit('server_to_client_my_card_drop',{value : drop, tehuda : tehuda[i]});
        io.to(ids[turn]).emit('server_to_client_drop',{value : drop});
      }

      if(drop_id == tehuda[i]){
        tehuda[i] = drow;
      }
      drop(drop_id);

      if(drop_id == 10){
        yamahuda = [];
        io.to(ids[turn]).emit('server_to_client_2_comp',{value : tehuda[i]});
        io.to(ids[i]).emit('server_to_client_2_comp',{value : tehuda[turn]});

        io.to(ids[turn]).emit('server_to_client_finish',{value : 'your win'});
        io.to(ids[i]).emit('server_to_client_finish',{value : 'your lose'});
      }

      io.to(ids[turn]).emit('server_to_client_1_comp');
      if(yamahuda.length > 0){
        turn_draw();
      }
    });
    
    // roomへの入室は、「socket.join(room名)」
    // 2人入ったらgame start
    socket.on('client_to_server_join', function(data) {
        room = data.value;
        socket.join(room);

        if(ids.length == 2){
          set();

          var p1 = yamahuda.shift();
          tehuda.push(p1);
          var p2 = yamahuda.shift();
          tehuda.push(p2);

          io.to(ids[0]).emit('server_to_client_set_up',{value : tehuda[0]});
          io.to(ids[1]).emit('server_to_client_set_up',{value : tehuda[1]});

          //game start
          drow = yamahuda.shift();
          
          if(turn == 0){
            io.to(ids[0]).emit('server_to_client_drow',{value : drow});
            io.to(ids[0]).emit('server_to_client_turn',{value : turn_text});
            io.to(ids[1]).emit('server_to_client_drow_enemy');
          }else{
            io.to(ids[1]).emit('server_to_client_drow',{value : drow});
            io.to(ids[1]).emit('server_to_client_turn',{value : turn_text});
            io.to(ids[0]).emit('server_to_client_drow_enemy');
          }

          // turn = turn == 0 ? 1 : 0;
        }

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

    });
    // S09. dicconnectイベントを受信し、退出メッセージを送信する
    socket.on('disconnect', function() {
        if (name == null) {
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

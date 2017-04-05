
/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = *
 * HTTPサーバの構築
 * = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */

// Load module & Create HTTP Server
var fs = require('fs'); // ファイル取扱いモジュールの読み込み
var http = require('http'); // HTTPサーバモジュールの読み込み
var server = http.createServer(); 

// Get method
server.on('request', function(req,res){ // サーバへHTTPリクエストが来たとき
  fs.readFile('global_test.html',function(err, data){ // global_test.htmlを読み取る
    if(err){ // ファイルが存在しない場合
      res.writeHead(500, {'Content-Type': 'text/plane'});
      return res.end('Error loading client.html');
    } 
    res.writeHead(200, { // ファイルが存在する場合
      'Content-Type': 'text/html; charset=UTF-8'
    }); 

    res.end(data); // データを返す
  });
});
server.listen(8081); // サーバの8081番ポートでサーバを稼働


/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = *
 * Socket.IOの処理
 * = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */

// Load module & Create WebSocket Server
var io = require('/usr/lib/node_modules/socket.io').listen(server); // socket.ioモジュールの読み込み

// グローバル変数定義
var peerId = {}; // ID管理用の配列を定義
var roomList = {}; // ルーム一覧を管理する配列の定義
var key,verify;

var chat = io.sockets.on('connect',function(socket_client){　// クライアントからWebSocket接続を受信した時

  // connectedをクライアントへ送信(サーバへ接続できたことをクライアントへ通知)
  socket_client.emit("connected");

  // クライアントからのIDとルーム名を受け取る
  socket_client.on('init', function(req) {

	console.log("=== " + req.name + " さんがルーム " + req.room + " に入室 ==="); // デバッグメッセージ
	socket_client.join(req.room); // socket.ioのルーム機能でユーザをルームへ追加
	// req.name == クライアントのpeerid

	// ユーザの所属するルームとユーザIDの取得
	var myInfo = io.sockets.adapter.sids[socket_client.id];

	// [Debug] console.log("ユーザID　ルーム名");
	// [Debug] console.log(myInfo); 

    // 接続してきたクライアントのユーザIDの出力
	for(key in myInfo){
		console.log('my-id: ' + key); // my-idはクライアントのpeerid
		break;
	}

	// 配列のルーム内が空,未定義の時に初期化（新規にルームを作成する場合）
	if(!peerId[req.room]) {
		// [Debug] console.log("Reset array"); 
		peerId[req.room] = {}; // peerid管理用配列の2次元目を初期化
	}
	// クライアントのpeerIDを配列 peerId[ ルーム名 ][ ユーザID ]へ代入する（クライアントをpeerid管理用配列へ追加する）
	peerId[req.room][key] = req.name;

	// [Debug] console.log("ユーザID");
	// console.log(io.sockets.adapter.rooms[socket_client.id]);

	// ルームに所属するユーザ一覧
	var roomName = req.room; // メンバーリストの取得
	var yourNamespace = '/'; // サーバ設置ディレクトリの設定
	roomList = io.nsps[yourNamespace].adapter.rooms[roomName]; // socket.ioのルーム機能でルーム内のユーザ一覧を取得(socket.io 1.0以降で動作)

	// [Debug] console.log("同じルームの他のユーザ");
	// console.log(roomList); 

	// peerId配列の重複を削除(WebSocketではセッションが切れる場合、peeridが同じユーザ別のWebSocketでアクセスした場合に重複を削除
	for(verify in peerId[req.room]){
		for(key in roomList){
			if(verify == key){ // 連想配列のクライアントIDと同じクライアントIDがルーム機能にあるか
				// [Debug] console.log("同じクライアントIDを発見");
				break; // 見つかれば終了
			}
		}
		if(verify != key){ // クライアントIDが見つからない場合
			delete peerId[req.room][verify]; // 配列の値を削除
			// [Debug] console.log("クライントをpeerid配列から削除");
		}
        } 
	
	// ルーム機能とpeerid配列の両方をリンクして出力(ユーザが入室したルームのユーザ一覧)
	for(key in roomList){
        console.log('id-list: ' + key + ', peerID: ' + peerId[req.room][key] );
	}

	// クライアントにroomListを返す
    // console.log(peerId[req.room]); // [memo] クライアントに渡すデータの中身
	socket_client.emit('user_lists', {member: peerId[req.room]});
	// [Debug] console.log('ユーザリストを返す');

	console.log(" - - - - - - - - - - - - - - - - - - - - - - - - - - - "); // デバッグメッセージ
  });

  socket_client.on('disconnect', function () { // 切断時に切断を検知
	console.log('切断');
  });

});


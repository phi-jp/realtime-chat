
tm.define("Dialog", {
    init: function(options) {
        this._element = $( '#dialog_simple' ).clone();
        this._element.dialog(options);

        this.input = $(".input", this._element);
    },
    close: function() {
        this._element.dialog("close");
    },
    setPosition: function(left, top) {
        this._element.parent().css({
            left: left,
            top: top,
        });
    },
    getPosition: function() {
        return this._element.parent().position();
    },

    getLeft: function() {
        return this._element.parent().position().left;
    },

    getTop: function() {
        return this._element.parent().position().top;
    },
});

;(function() {
    var socket  = null;
    var input   = null;
    var output  = null;
    var myDialog = null;
    var userDialogMap = {};

    var initSocketIO = function() {
        var host = "http://" + ( (location.port)?location.host:location.host+':'+port );
        socket  = io.connect(host);

        socket.on('connect', function() {
            socket.emit("myconnect");
        });

        socket.on('myconnect', function(data) {
            console.log('Cliant-connect: ' + data.userId);

            var dialog = myDialog = Dialog({
                title: "*anonymous " + data.userId
            });
            dialog.setPosition(Math.rand(0, innerWidth-200), Math.rand(0, innerHeight-200));

            dialog._element.on("dialogdrag", function( event, ui ) {
                socket.emit("drag", {
                    left: ui.position.left,
                    top: ui.position.top
                });
            });

            dialog.input.on("keyup", function() {
                socket.emit("change message", {
                    message: this.value
                });
            });
        });

        socket.on('disconnect', function(data) {
            console.log('Cliant-disconnect: ' + data.userId);
        });

        // 他ユーザー接続
        socket.on('other connect', function(data) {
            console.log('Other-connect: ' + data.userId);
        });
        // 他ユーザーの更新
        socket.on('other update', function(data) {
            if(userDialogMap[data.userId] === undefined){
                var dialog = Dialog({
                    title: "anonymous " + data.userId,
                    draggable: false
                });

                dialog.setPosition(data.data.left, data.data.top);
                userDialogMap[data.userId] = dialog;
            }
        });
        // 他ユーザー削除
        socket.on('other disconnect', function(data) {
            console.log('Other-disconnect: ' + data.userId);
            userDialogMap[data.userId].close();
            delete userDialogMap[data.userId];
            userDialogMap[data.userId] = null;
        });
        socket.on('other dialogdrag', function(data) {
            var dialog = userDialogMap[data.userId];
            dialog.setPosition(data.data.left, data.data.top);
        });
        socket.on('other send message', function(e) {
            console.log(e.data)
        });
        socket.on('other change message', function(data) {
            userDialogMap[data.userId].input.val(data.data.message);
        });
    };

    tm.main(function() {
        initSocketIO();
        
        input  = tm.dom.Element("#input");
        output = tm.dom.Element("#output");
        
        input.event.add("change", function() {
            socket.emit("change message", {
                message: this.value
            });
        });

        tm.setLoop(function() {
            if (myDialog) {
                socket.emit('update', {
                    left: myDialog.getLeft(),
                    top: myDialog.getTop(),
                });
            }
        }, 1000);
    });

})();

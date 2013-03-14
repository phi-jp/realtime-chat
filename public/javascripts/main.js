
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
            var dialog = $( '#dialog_simple' ).clone();
            dialog.dialog({ title: "*anonymous " + data.userId });
            myDialog = dialog;

            dialog.parent().css({
                left: Math.rand(0, innerWidth-200),
                top: Math.rand(0, innerHeight-200),
            });

            myDialog.on( "dialogdrag", function( event, ui ) {
                socket.emit("drag", {
                    left: ui.position.left,
                    top: ui.position.top
                });
            });

            $("input", myDialog).on("keydown", function() {
                socket.emit("change message", {
                    message: this.value
                });
            });
        });

        socket.on('disconnect', function(data) {
            console.log('Cliant-disconnect: ' + data.userId);
        });

        socket.on('other connect', function(data) {
            console.log('Other-connect: ' + data.userId);
        });
        socket.on('other disconnect', function(data) {
            console.log('Other-disconnect: ' + data.userId);
            userDialogMap[data.userId].dialog("close");
            delete userDialogMap[data.userId];
            userDialogMap[data.userId] = null;
        });
        socket.on('other dialogdrag', function(data) {
            var dialog = userDialogMap[data.userId];
            dialog.parent().css({
                left: data.data.left,
                top: data.data.top,
            });
        });
        // 他ユーザーの更新
        socket.on('other update', function(data) {
            if(userDialogMap[data.userId] === undefined){
                var dialog = $( '#dialog_simple' ).clone();
                dialog.dialog({
                    title: "anonymous " + data.userId,
                    draggable: false
                });
                dialog.parent().css({
                    left: data.data.left,
                    top: data.data.top,
                });
                userDialogMap[data.userId] = dialog;
            }
        });
        socket.on('other send message', function(e) {
            console.log(e.data)
        });
        socket.on('other change message', function(data) {
            $("input", userDialogMap[data.userId]).val(data.data.message);
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
                    left: myDialog.parent().position().left,
                    top: myDialog.parent().position().top,
                });
            }
        }, 1000);
    });

})();

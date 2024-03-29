
tm.define("Dialog", {
    superClass: "tm.dom.Element",

    init: function(options) {
        this._initJQueryDialog(options);
        this.superInit(this._jqeryElement.parent()[0]);

        this.input = this.query(".input");
        
        var color = "hsla({0}, 100%, 95%, 1.0)".format(Math.rand(0, 360));
        this.color = color;
        this.style.set("background", color);
    },

    _initJQueryDialog: function(options) {
        this._jqeryElement = $( '#dialog_simple' ).clone();
        options.$extend({
            autoOpen: false,
            width: 400,
        });
        this._jqeryElement.dialog(options);
        this._jqeryElement.dialog("open");
    },

    close: function() {
        this._jqeryElement.dialog("close");
    },
    setPosition: function(x, y) {
        this.x = x;
        this.y = y;
    },
    setBackground: function(color) {
        this.style.set("background", color);
    },
    getBackground: function() {
        return this.style.get("background");
    },

    getInputText: function() {
        return this.input.value;
    },
    setInputText: function(text) {
        this.input.value = text;
        return this;
    },
    clearInputText: function() {
        this.setInputText("");
        return this;
    },
});

;(function() {
    var socket  = null;
    var input   = null;
    var output  = null;
    var myDialog = null;
    var myUserId = null;
    var userDialogMap = {};

    var initSocketIO = function() {
        var host = "http://" + ( (location.port)?location.host:location.host+':'+port );
        socket  = io.connect(host);

        socket.on('connect', function() {
            socket.emit("myconnect");
        });

        socket.on('myconnect', function(data) {
            console.log('Cliant-connect: ' + data.userId);
            myUserId = data.userId;

            var dialog = myDialog = Dialog({
                title: "*anonymous " + data.userId,
                buttons: {
                    "Send (Shift+Enter)": function () {
                        socket.emit("send message", {
                            message: myDialog.getInputText(),
                            color: myDialog.color,
                        });
                        myDialog.clearInputText();
                    },
                    // "Cancel": function () {
                    //    $(this).dialog("close");
                    // },
                }
            });
            dialog.classList.add("my-dialog");
            dialog.setPosition(Math.rand(0, innerWidth-200), Math.rand(0, innerHeight-200));

            dialog._jqeryElement.on("dialogdrag", function( event, ui ) {
                socket.emit("drag", {
                    left: ui.position.left,
                    top: ui.position.top
                });
            });

            dialog.input.event.add("keyup", function() {
                socket.emit("change message", {
                    message: this.value
                });
            });
            dialog.input.event.add("keyup", function(e) {
                if (e.shiftKey && e.which === 13) {
                    socket.emit("send message", {
                        message: myDialog.getInputText(),
                        color: myDialog.color,
                    });
                    myDialog.clearInputText();
                    return false;
                }
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
                dialog.setBackground(data.data.background);
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
            userDialogMap[data.userId].input.value = data.data.message;
        });

        // メッセージ受信
        socket.on('send message', function(data) {
            var $scope = angular.element('#talk-list').scope();
            $scope.talkList.push({
                id: (data.userId === myUserId) ? "Mine" : "Gest " + data.userId,
                msg: data.data.message,
                color: data.data.color,
            });
            angular.element('#talk-list').scope().updateTalkList();

            window.scrollTo(0, 1000000);
        });
    };

    tm.main(function() {
        initSocketIO();
        
        tm.setLoop(function() {
            if (myDialog) {
                socket.emit('update', {
                    left: myDialog.x,
                    top: myDialog.y,
                    background: myDialog.getBackground()
                });
            }
        }, 1000);
    });

})();


var TalkListCtrl = function($scope) {
    $scope.talkList = [];
    $scope.updateTalkList = function() {
        $scope.$apply();
    };
};





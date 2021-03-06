"use strict";
var Player = require('./player.js').Player;
var Avatar = require('./avatar.js').Avatar;

class Client {
    constructor(scene, library, animationfield, symbol) {
        this.library = library;
        this.animationfield = animationfield;
        this.symbol = symbol;
        this.scene = scene;
        this.users = {};
    }

    connect(location) {
        let c = this;
        this.ws = new WebSocket(location);
        this.ws.onopen = function(event) { c.onOpen(event); };
        this.ws.onmessage = function(event) { c.onMessage(event); };
    }

    send(...args) {
        this.ws.send(JSON.stringify(args));
    }

    initPing() {
        let c = this;
        this.time = 0;
        this.ticker = new PIXI.ticker.Ticker;
        this.ticker.add(function(delta) { c.onDelta(delta) });
        this.ticker.start();
    }

    onDelta(delta) {
        this.time += delta;
        if (this.time >= 2000) {
            this.time = 0;
            console.log("ping");
            this.send("ping");
        }
    }

    onOpen(event) {
        let client = this;
        let player = new Player(this.library, this.animationfield, this.symbol);

        let hat = Math.floor(Math.random() * 23);
        let gear = Math.floor(Math.random() * 19);
        let x = Math.floor(Math.random() * 800);
        let y = 400 + Math.floor(Math.random() * 400);

        player.ID = "me";
        player.x = x;
        player.y = y;
        player.setHat(hat);
        player.setGear(gear);
        player.onAnimationChange = function(label) {
            client.send("animation", label, player.x, player.y);
        };
        this.users["me"] = player;

        this.send("join", gear, hat, x, y);
        this.scene.ac(player);

        this.initPing();
    }

    onMessage(event) {
        let data = JSON.parse(event.data);
        let method = data[0].charAt(0).toUpperCase() + data[0].slice(1);
        let args = data.slice(1);

        this["on"+method](...args);
    }

    onJoin(ID, gear, hat, x, y) {
        let user = new Avatar(this.library, this.animationfield, this.symbol);

        user.ID = ID;
        user.x = x;
        user.y = y;

        user.setHat(hat);
        user.setGear(gear);
        user.setAnimation("inactive");
        this.users[ID] = user;

        this.scene.ac(user);
    }

    onPong() {
        console.log("pong");
    }

    onAnimation(ID, label, x, y) {
        if (!(ID in this.users)) {
            return;
        }

        this.users[ID].x = x;
        this.users[ID].y = y;
        this.users[ID].setAnimation(label);
    }

    onQuit(ID) {
        if (!(ID in this.users)) {
            return;
        }

        this.scene.removeChild(this.users[ID]);
        delete this.users[ID];
    }

}

exports.Client = Client;

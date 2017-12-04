'use strict';

var options = {
    'skin': 'psx',
    'deadzone': 0.25,
};

var skins = {
    'gamecube': {
        name: "GameCube",
        styles: {
            "indigo": { name: "Indigo" },
        },
    },
    'genesis': {
        name: "Genesis",
        styles: {
            "na": { name: "North America" },
        },
    },
    'n64': {
        name: "N64",
        styles: {
            "solidgrey": { name: "Solid Grey" },
        },
    },
    'nes': {
        name: "NES",
        styles: {
            "na": { name: "North America/Europe" },
            "jp": { name: "Japan" },
        },
    },
    'psx': {
        name: "PlayStation",
        styles: {
            "grey": { name: "Grey" },
        },
    },
    'saturn': {
        name: "Saturn",
        styles: {
            "na": { name: "North America" },
        },
    },
    'snes': {
        name: "SNES",
        styles: {
            "na": { name: "North America" },
            "eu": { name: "Europe/Japan" }
        },
    },
};

var buttonMap = {
    0: 'b0',
    1: 'b1',
    2: 'b2',
    3: 'b3',
    4: 'l1',
    5: 'r1',
    6: 'l2',
    7: 'r2',
    8: 'select',
    9: 'start',
    10: 'l3',
    11: 'r3',
    12: 'du',
    13: 'dd',
    14: 'dl',
    15: 'dr',
    16: 'vendor',
};

var axisMap = {
    0: 'ls-x',
    1: 'ls-y',
    2: 'rs-x',
    3: 'rs-y',
};

var skinTemplate = undefined;

function getGamepads() {
    return("function" == typeof navigator.getGamepads ? navigator.getGamepads() :
           ("function" == typeof navigator.webkitGetGamepads ? navigator.getGamepads() :
            null));
}

function translate(element, x, y) {
    element.setAttribute("transform", "translate(" + x + " " + y + ")");
}

function rotateStick(id, transforms) {
    var stick = document.getElementById(id);
    if (stick) {
        var hilight = document.getElementById(id + '-hilight');
        var magnitude = 0;
        if (hilight) {
            magnitude = hilight.r.baseVal.value * 0.75;
            hilight.setAttribute("style", "fill-opacity:" + Math.sqrt(transforms.x * transforms.x + transforms.y * transforms.y));
        }

        translate(stick, transforms.x * magnitude, transforms.y * magnitude);
    }
}

function redrawGamepad(gamepad) {
    var buttons = gamepad.buttons;
    var axisButtons = {};
    var axes = gamepad.axes;
    var transforms = {'ls':{'x':0,'y':0},'rs':{'x':0,'y':0}};
    var i;

    for (i = 0; i < axes.length; ++i) {
        var map = axisMap[i].split('-');
        var id = map[0];
        var dir = map[1];
        var value = axes[i];
        var offset;

        /* dead zone */
        if (value < options['deadzone'] && value > -options['deadzone'])
            value = 0.0;

        transforms[id][dir] = value;

        /* translate axis values to button presses */
        if (dir == 'y') {
            axisButtons[id + 'u'] = (-value > 0 ? -value : 0)
            axisButtons[id + 'd'] = (value > 0 ? value : 0);
        } else if (dir == 'x') {
            axisButtons[id + 'l'] = (-value > 0 ? -value : 0);
            axisButtons[id + 'r'] = (value > 0 ? value : 0);
        }
    }

    for (i = 0; i < buttons.length; ++i) {
        var elm = document.getElementById(buttonMap[i] + "-hilight");
        if (!elm)
            continue;

        elm.setAttribute("style", "fill-opacity:" + buttons[i].value);
    }

    for (var ab in axisButtons) {
        if (axisButtons.hasOwnProperty(ab)) {
            var elm = document.getElementById(ab + "-hilight");
            if (!elm)
                continue;

            elm.setAttribute("style", "fill-opacity:" + axisButtons[ab]);
        }
    }

    rotateStick('ls', transforms['ls']);
    rotateStick('rs', transforms['rs']);
}

function redraw(timestamp) {
    var gamepads = getGamepads();
    if (gamepads) {
        var i;
        for (i = 0; i < gamepads.length; ++i) {
            if (gamepads[i])
                redrawGamepad(gamepads[i]);
        }
    }

    window.requestAnimationFrame(redraw);
}

function splitSkinId(str) {
    var map = str.split('_');
    return { skin: map[0], style: (map[1] || "") }
}

function changeSkin(identifier) {
    var id = splitSkinId(identifier);

    fetchSVG("skins/" + id.skin + ".svg", function (svg) {
        skinTemplate = document.importNode(svg.documentElement, true);
        skinTemplate.setAttribute("class", "gamepad");

        removeAllGamepads();
        addConnectedGamepads();
    });

    /* remove old style, if it exists */
    var l = document.getElementById("skinStylesheet");
    if (l) {
        l.parentNode.removeChild(l);
    }

    if (id.style) {
        var extcss = document.createElement("link");
        extcss.setAttribute("id", "skinStylesheet");
        extcss.setAttribute("rel", "stylesheet");
        extcss.setAttribute("type", "text/css");
        extcss.setAttribute("href", "skins/" + id.skin + "_" + id.style + ".css");
        document.getElementsByTagName("head")[0].appendChild(extcss);
    }

    /* update the querystring */
    var paramsString = window.location.hash.substring(2);
    var params = new URLSearchParams(paramsString);
    params.set("skin", identifier);
    window.location.hash = "#!" + params.toString();
}

function fetchSVG(url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.onreadystatechange = function(evt) {
        if (xhr.readyState === 4) {
            callback(xhr.responseXML);
        }
    };
    xhr.send(null);
}

function addGamepad(gamepad) {
    document.getElementById("nocon").style.display = "none";

    if (skinTemplate) {
        var gp = skinTemplate.cloneNode(true);
        gp.id = "gamepad-" + gamepad.index;
        document.body.appendChild(gp);
        window.requestAnimationFrame(redraw);
    } else {
        /* we have to wait until we've loaded it */        
    }
}

function removeGamepad(gamepad)
{
   var gp = document.getElementById("gamepad-" + gamepad.index);
   if (gp) {
       gp.parentNode.removeChild(gp);
   }
}

function removeAllGamepads() {
    var gamepads = getGamepads();
    if (gamepads) {
        var i;
        for (i = 0; i < gamepads.length; ++i) {
            if (gamepads[i])
                removeGamepad(gamepads[i]);
        }
    }
}

function addConnectedGamepads() {
    var gamepads = getGamepads();
    if (gamepads) {
        var i;
        for (i = 0; i < gamepads.length; ++i) {
            if (gamepads[i])
                addGamepad(gamepads[i]);
        }
    }
}

function parseOptions() {
    var paramsString = window.location.hash.substring(2);
    var params = new URLSearchParams(paramsString);

    if (params.has("skin")) {
        var skinId = params.get("skin");
        var id = splitSkinId(skinId);

        if (skins.hasOwnProperty(id.skin) &&
            (id.style == "" || skins[id.skin].styles.hasOwnProperty(id.style))) {
            options["skin"] = skinId;
        }
    }

    if (params.has("deadzone")) {
        options["deadzone"] = parseFloat(value);
    }
}

// Add event listener for newly-attached gamepads
window.addEventListener("gamepadconnected", function(e) {
    addGamepad(e.gamepad);
});

// Attach all gamepads the browser already knows about
window.addEventListener("load", function(e) {
    parseOptions();

    var settingsButton = document.getElementById("settingsButton");
    settingsButton.onclick = showSettings;

    var skinSelector = document.getElementById("skinSelector");
    skinSelector.onchange = function() { changeSkin(this.options[this.selectedIndex].value); };
    skinSelector.onfocus = function() { this.selectedIndex = -1; this.blur(); };
    var index = 0;
    for (var sk in skins) {
        if (skins.hasOwnProperty(sk)) {
            var styles = skins[sk].styles;
            var opt = document.createElement("option");
            opt.value = sk;
            opt.innerText = skins[sk].name;
            skinSelector.appendChild(opt);
            if (opt.value == options['skin']) {
                skinSelector.options.selectedIndex = index;
            }
            index++;

            for (var st in styles) {
                if (styles.hasOwnProperty(st)) {
                    opt = document.createElement("option");
                    opt.value = sk + "_" + st;
                    opt.innerText = skins[sk].name + " (" + styles[st].name + ")";
                    skinSelector.appendChild(opt);
                    if (opt.value == options['skin']) {
                        skinSelector.options.selectedIndex = index;
                    }
                    index++;
                }
            }
        }
    }

    changeSkin(options['skin']);
});

// Settings config
function showSettings() {
    var button = document.getElementById("settingsButton");
    var panel = document.getElementById("settings");
    if (!panel.style.display || panel.style.display === 'none') {
        panel.style.display = 'initial';
        button.innerHTML = 'X';
    } else {
        panel.style.display = 'none';
        button.innerHTML = 'Config';
    }
}

/* LITTLE HOLLYWOOD — engine.js
 * Core game loop, 12-turn low-to-high tide cycle, day/night clock,
 * earned HUD (tide gauge + compass), danger/push-on system,
 * localStorage save/load, auto-journal, and input history.
 */

window.LH = window.LH || {};

window.LH.Engine = (function () {
  var SAVE_KEY = "littlehollywood_save_v1";
  var MAX_TIDE = 12;
  var RAID_TURN = 90; // Day 1 9:00 AM (turn 0) -> Day 3 6:00 AM (turn 90)

  var state = null;
  var outputEl = null;
  var inputEl = null;
  var cmdHistory = [];
  var historyIdx = -1;
  var rng = Math.random;

  function cloneInitialItems() {
    var out = {};
    var src = window.LH.ITEMS;
    Object.keys(src).forEach(function (id) {
      out[id] = { location: src[id].location };
    });
    return out;
  }

  function createFreshState() {
    return {
      room: "float_house",
      turn: 0,
      tideLevel: 0,
      tideDir: 1,
      inSkiff: false,
      skiffRoom: "gus_porch",
      ended: false,
      endingId: null,
      pendingDanger: null,
      visited: { float_house: true },
      standing: {
        mae: 0,
        voss: 0,
        neighbors: 0
      },
      flags: {
        lanternLit: false,
        floorPried: false,
        whiskyTaken: false,
        whiskyHidden: false,
        valveBoxOpened: false,
        chestUnlocked: false,
        springFixed: false,
        bucketFull: false,
        peteWarmed: false,
        peteWatered: false,
        peteWarned: false,
        halvorsenWarned: false,
        stankoWarned: false,
        compassGiven: false,
        walkCGapFixed: false,
        rottenPlankFixed: false,
        skiffBailed: false,
        skiffHasOars: false,
        housesLashed: false,
        maePaid: false,
        vossDealDone: false,
        sawNotice: false,
        talkedVoss: false,
        gaveLedgerMae: false,
        gaveLedgerVoss: false,
        extraPlankTaken: false
      },
      items: cloneInitialItems(),
      journal: [
        "Day 1, 9:00 AM — Inherited Uncle Gus's float house on the Deschutes tide flats. Word is the city will raid and burn Little Hollywood at dawn on Day 3."
      ]
    };
  }

  function attachStateMethods(s) {
    s.isAfloat = function () {
      return s.tideLevel >= 9;
    };
    s.getClock = function () {
      var totalMin = 9 * 60 + s.turn * 30;
      var day = Math.floor(totalMin / 1440) + 1;
      var dayMin = totalMin % 1440;
      var hour24 = Math.floor(dayMin / 60);
      var min = dayMin % 60;
      var ampm = hour24 >= 12 ? "PM" : "AM";
      var hour12 = hour24 % 12;
      if (hour12 === 0) hour12 = 12;
      var minStr = min < 10 ? "0" + min : "" + min;
      return {
        day: day,
        hour24: hour24,
        min: min,
        label: "DAY " + day + " · " + hour12 + ":" + minStr + " " + ampm,
        short: "Day " + day + ", " + hour12 + ":" + minStr + " " + ampm
      };
    };
    s.isNight = function () {
      var h = s.getClock().hour24;
      return h >= 19 || h < 6;
    };
    s.isEscapeWindow = function () {
      var c = s.getClock();
      return c.day === 3 && c.hour24 >= 2 && c.hour24 <= 4 && s.tideLevel >= 9;
    };
    s.tidePhaseLabel = function () {
      if (s.tideLevel <= 3) return s.tideDir > 0 ? "Low, rising" : "Low, falling";
      if (s.tideLevel >= 9) return s.tideDir > 0 ? "High, rising" : "High, falling";
      return s.tideDir > 0 ? "Mid-tide, rising" : "Mid-tide, falling";
    };
    s.hasItem = function (id) {
      return !!(s.items[id] && s.items[id].location === "player");
    };
    s.itemAt = function (id, roomId) {
      return !!(s.items[id] && s.items[id].location === roomId);
    };
    s.giveItemToPlayer = function (id) {
      if (s.items[id]) s.items[id].location = "player";
    };
    s.hasLight = function () {
      var room = window.LH.WORLD[s.room];
      var lanternHere = s.hasItem("lantern") || s.itemAt("lantern", s.room);
      if (room && room.dark) {
        return !!(s.flags.lanternLit && lanternHere);
      }
      if (s.isNight()) {
        return !!(s.flags.lanternLit && lanternHere);
      }
      return true;
    };
    s.addJournal = function (text) {
      var entry = s.getClock().short + " — " + text;
      if (s.journal[s.journal.length - 1] !== entry) {
        s.journal.push(entry);
      }
    };
    s.changeStanding = function (faction, delta, reason) {
      if (typeof s.standing[faction] !== "number") return;
      s.standing[faction] += delta;
      if (reason) s.addJournal(reason);
    };
    return s;
  }

  function updateTideFromTurn() {
    var pos = state.turn % 24;
    state.tideLevel = pos <= 12 ? pos : 24 - pos;
    state.tideDir = pos < 12 ? 1 : -1;
  }

  // --- Output helpers ---
  var transcriptBuffer = [];

  function print(text, cls) {
    transcriptBuffer.push({ text: text, cls: cls || "" });
    if (!outputEl) return;
    var div = document.createElement("div");
    div.className = "entry" + (cls ? " " + cls : "");
    div.textContent = text;
    outputEl.appendChild(div);
    outputEl.scrollTop = outputEl.scrollHeight;
  }

  function updateHUD() {
    if (typeof document === "undefined") return;
    var roomEl = document.getElementById("hud-room");
    var clockEl = document.getElementById("hud-clock");
    var barEl = document.getElementById("tide-bar");
    var dirEl = document.getElementById("tide-dir");
    var stateEl = document.getElementById("tide-state");
    var compHud = document.getElementById("compass-hud");
    var compDirs = document.getElementById("compass-dirs");

    if (!roomEl) return;
    var room = window.LH.WORLD[state.room];
    roomEl.textContent = (room ? room.name : "LITTLE HOLLYWOOD").toUpperCase() + (state.inSkiff ? " [SKIFF]" : "");
    clockEl.textContent = state.getClock().label;

    var filled = "";
    var empty = "";
    for (var i = 0; i < MAX_TIDE; i++) {
      if (i < state.tideLevel) filled += "~";
      else empty += ".";
    }
    barEl.textContent = "[" + filled + empty + "]";
    dirEl.textContent = state.tideDir > 0 ? "↑" : "↓";

    stateEl.classList.remove("afloat", "escape-window");
    if (state.isEscapeWindow()) {
      stateEl.textContent = "3AM FLOOD";
      stateEl.classList.add("escape-window");
    } else if (state.isAfloat()) {
      stateEl.textContent = "AFLOAT";
      stateEl.classList.add("afloat");
    } else {
      stateEl.textContent = "GROUNDED";
    }

    // Earned Compass HUD
    if (state.hasItem("compass")) {
      compHud.classList.remove("hidden");
      var passable = getPassableDirectionCodes(room);
      compDirs.textContent = passable.length ? passable.join(" ") : "NONE";
    } else {
      compHud.classList.add("hidden");
    }
  }

  var DIR_ABBR = {
    north: "N", south: "S", east: "E", west: "W",
    up: "U", down: "D", in: "IN", out: "OUT",
    northeast: "NE", northwest: "NW", southeast: "SE", southwest: "SW"
  };

  function isExitPassable(exitObj) {
    if (!exitObj) return false;
    var mode = exitObj.mode;
    if (mode === "always") return !state.inSkiff;
    if (mode === "walk_low") return !state.inSkiff && state.tideLevel <= 8;
    if (mode === "flats_low") return !state.inSkiff && state.tideLevel <= 7;
    if (mode === "plank_gap") {
      if (state.inSkiff && state.isAfloat()) return true;
      return !state.inSkiff && state.flags.walkCGapFixed && state.tideLevel <= 8;
    }
    if (mode === "skiff_or_walk") {
      if (state.inSkiff) return state.isAfloat();
      return state.tideLevel <= 8;
    }
    if (mode === "water_high") {
      return state.inSkiff && state.isAfloat();
    }
    return false;
  }

  function getPassableDirectionCodes(room) {
    if (!room || !room.exits) return [];
    var codes = [];
    Object.keys(room.exits).forEach(function (d) {
      if (isExitPassable(room.exits[d])) {
        var abbr = DIR_ABBR[d] || d.toUpperCase();
        if (codes.indexOf(abbr) === -1) codes.push(abbr);
      }
    });
    return codes;
  }

  // --- Room rendering ---
  function getVisibleItemsInRoom(roomId) {
    var list = [];
    var room = window.LH.WORLD[roomId];
    Object.keys(window.LH.ITEMS).forEach(function (id) {
      if (id === "skiff") {
        if (state.skiffRoom === roomId) list.push(window.LH.ITEMS[id]);
        return;
      }
      if (state.items[id] && state.items[id].location === roomId) {
        if (window.LH.ITEMS[id].hiddenUntilLit && room && room.dark && !state.hasLight()) return;
        list.push(window.LH.ITEMS[id]);
      }
    });
    return list;
  }

  function getNPCsInRoom(roomId) {
    var list = [];
    Object.keys(window.LH.NPCS).forEach(function (id) {
      if (window.LH.NPCS[id].location === roomId) {
        list.push(window.LH.NPCS[id]);
      }
    });
    return list;
  }

  function describeRoom() {
    var room = window.LH.WORLD[state.room];
    print(room.name.toUpperCase() + (state.inSkiff ? " (Aboard Gus's Skiff)" : ""), "room-title");
    var text = typeof room.desc === "function" ? room.desc(state) : room.desc;
    print(text);

    if (room.zone !== "upland" && state.isNight() && !state.hasLight() && !room.dark) {
      print("Night fog lies thick over the flats. A lit lantern would make footing safer.", "system");
    }

    var npcs = getNPCsInRoom(state.room);
    npcs.forEach(function (npc) {
      print(npc.name + " is here.", "dialogue");
    });

    var items = getVisibleItemsInRoom(state.room);
    if (items.length) {
      var names = items.map(function (it) { return it.name; }).join(", ");
      print("You see here: " + names + ".", "system");
    }

    if (state.room === "armory_edge" && !state.flags.sawNotice) {
      state.flags.sawNotice = true;
      state.addJournal("Read the city abatement notice at the Armory Edge: Little Hollywood burns at 6:00 AM on Day 3.");
    }

    if (state.room === "road_above" && state.flags.maePaid) {
      print("Big Mae's $400 is heavy in your pocket. The Tacoma stage road runs east—type 'leave' (or 'push on') to walk out and cash in, or head back down to the flats.", "warn");
    }

    updateHUD();
  }

  // --- Time & Tide Advancement ---
  function advanceTime(turns, silent) {
    var prevAfloat = state.isAfloat();
    var prevWindow = state.isEscapeWindow();

    for (var t = 0; t < turns; t++) {
      if (state.ended) return;
      state.turn += 1;
      updateTideFromTurn();

      // Check Day 3 Dawn Raid timeout
      if (state.turn >= RAID_TURN) {
        triggerEnding("fail_raid_timeout");
        return;
      }

      // If in open water and tide drops below float level, drift safely to landing/mooring
      var curRoom = window.LH.WORLD[state.room];
      if (state.inSkiff && !state.isAfloat() && curRoom.zone === "water") {
        state.inSkiff = false;
        state.room = (state.room === "budd_inlet_landing" || state.room === "east_bay_mouth") ? "budd_inlet_landing" : "gus_porch";
        state.skiffRoom = state.room;
        if (!silent) {
          print("The ebbing tide drops fast. You pull hard for shelter and ground Gus's skiff at " + window.LH.WORLD[state.room].name + " before the mudbars bare.", "tide-note");
        }
      }

      // If standing on low mudflats when water floods high, wade back to nearest plank/dry spot
      if (!state.inSkiff && curRoom.zone === "flats" && state.tideLevel >= 8 && state.room !== "abandoned_hulk" && state.room !== "hulk_hold") {
        state.room = "plank_walk_b";
        if (!silent) {
          print("Cold flood water surges over your boot tops! You scramble east onto Plank Walk B before the flats vanish under the tide.", "warn");
        }
      }
    }

    if (!silent) {
      var nowAfloat = state.isAfloat();
      var nowWindow = state.isEscapeWindow();
      if (!prevAfloat && nowAfloat) {
        print("The rising tide lifts the float houses free of the mud—plank walks are awash, and the skiff rides afloat.", "tide-note");
      } else if (prevAfloat && !nowAfloat) {
        print("The ebbing tide settles the float houses back onto the mud—the flats and plank walks are walkable again.", "tide-note");
      }
      if (!prevWindow && nowWindow) {
        print("NIGHT 3, 2:00 AM–4:30 AM: The 3 a.m. spring high tide is here! This is the escape window to tow the float houses out to Budd Inlet before dawn.", "good");
      }
    }
    updateHUD();
  }

  // --- Candidates builder for noun resolution ---
  function getLocalCandidates(includeInventory) {
    var list = [];
    var room = window.LH.WORLD[state.room];

    // Inventory items
    if (includeInventory !== false) {
      Object.keys(window.LH.ITEMS).forEach(function (id) {
        if (state.hasItem(id)) {
          var it = window.LH.ITEMS[id];
          list.push({ kind: "item", id: id, name: it.name, aliases: it.aliases, data: it, held: true });
        }
      });
    }

    // Room items
    getVisibleItemsInRoom(state.room).forEach(function (it) {
      list.push({ kind: "item", id: it.id, name: it.name, aliases: it.aliases, data: it, held: false });
    });

    // NPCs in room
    getNPCsInRoom(state.room).forEach(function (npc) {
      list.push({ kind: "npc", id: npc.id, name: npc.name, aliases: npc.aliases, data: npc });
    });

    // Room scenery
    if (room && room.scenery) {
      Object.keys(room.scenery).forEach(function (sid) {
        var sc = room.scenery[sid];
        list.push({ kind: "scenery", id: sid, name: sid.replace(/_/g, " "), aliases: sc.aliases || [], data: sc });
      });
    }

    return list;
  }

  function resolveLocal(phrase, filterKind) {
    var cands = getLocalCandidates(true);
    if (filterKind) {
      cands = cands.filter(function (c) { return c.kind === filterKind; });
    }
    var res = window.LH.Parser.resolveNoun(phrase, cands);
    if (res.corrected) {
      print("(Assuming you meant \"" + res.corrected.to + "\".)", "system");
    }
    return res.match;
  }

  // --- Danger & Push On ---
  function checkDangerBeforeMove(dir, exitObj) {
    var dest = exitObj.to;

    // 1. Rising tide on Outer Clam Flats
    if (dest === "clam_flats" && state.tideLevel >= 5 && !state.inSkiff) {
      state.pendingDanger = {
        type: "mud",
        dir: dir,
        to: dest
      };
      print("WARNING: Cold tidewater is creeping across the Outer Clam Flats and the blue silt is turning boot-deep. Going out now risks getting mired as the tide returns.\nType 'push on' to risk it anyway, or head back to higher ground.", "warn");
      return true;
    }

    // 2. Unrepaired rotten plank on Plank Walk A when carrying heavy load (>= 4 items)
    if (state.room === "plank_walk_a" && dir === "south" && !state.flags.rottenPlankFixed && !state.inSkiff) {
      var invCount = Object.keys(state.items).filter(function (id) { return state.hasItem(id); }).length;
      if (invCount >= 4) {
        state.pendingDanger = {
          type: "plank",
          dir: dir,
          to: dest
        };
        print("WARNING: The worm-eaten plank on Plank Walk A groans sharply under your heavy load. One wrong step could snap it clean.\nType 'push on' to cross anyway, drop some weight, or fix it with a stout plank.", "warn");
        return true;
      }
    }

    // 3. Uncovered whisky at Armory Edge (Captain Voss)
    if (dest === "armory_edge" && state.hasItem("whisky") && !state.flags.whiskyHidden) {
      state.pendingDanger = {
        type: "arrest",
        dir: dir,
        to: dest
      };
      print("WARNING: Ahead by the brick Armory wall, Captain Voss and two deputies are watching the road. Carrying an uncovered crate of Canadian rye straight up to them is asking to be collared.\nWrap the whisky in gunnysacks first—or type 'push on' to walk right in anyway.", "warn");
      return true;
    }

    // 4. Outer flats at night without lit lantern
    if ((dest === "clam_flats" || dest === "abandoned_hulk") && state.isNight() && !state.hasLight() && !state.inSkiff) {
      state.pendingDanger = {
        type: "night_mud",
        dir: dir,
        to: dest
      };
      print("WARNING: Pitch-dark mist hides the tide channels on the outer flats. Stepping out without a lit lantern risks slipping into a silt pocket.\nLight your lantern first, or type 'push on' to chance it in the dark.", "warn");
      return true;
    }

    return false;
  }

  function handlePushOn() {
    // Allow "push on" at Bluff Road with Mae's cash to trigger Ending 1
    if (!state.pendingDanger && state.room === "road_above" && state.flags.maePaid) {
      triggerEnding("ending_mae");
      return;
    }
    if (!state.pendingDanger) {
      print("There's no hazard blocking you right now—just pick a direction or command.", "system");
      return;
    }
    var d = state.pendingDanger;
    state.pendingDanger = null;
    var odds = window.LH.DANGER_ODDS;
    var roll = rng();

    if (d.type === "mud") {
      if (roll < odds.mudStuckDeathChance) {
        triggerEnding("fail_mud");
        return;
      }
      print("Your boot sucks deep into the clay, then pulls free with a wet pop. You stagger onto firmer eelgrass—that was close.", "warn");
      completeMove(d.to);
      return;
    }

    if (d.type === "plank") {
      if (roll < odds.rottenPlankFallChance) {
        triggerEnding("fail_plank");
        return;
      }
      print("The rotted fir cracks half through under your heel as you lunge forward onto solid stringers. Your heart hammers.", "warn");
      completeMove(d.to);
      return;
    }

    if (d.type === "arrest") {
      if (roll < odds.arrestOnUncoveredWhisky) {
        triggerEnding("fail_arrested");
        return;
      }
      print("Voss glances away toward a passing Model A just long enough for you to slip into the shadow of the brick wall with the crate.", "warn");
      completeMove(d.to);
      return;
    }

    if (d.type === "night_mud") {
      if (roll < odds.nightFlatsSlipChance) {
        triggerEnding("fail_mud");
        return;
      }
      print("You stumble twice in the dark fog, shin-deep in cold silt, before finding footing.", "warn");
      completeMove(d.to);
    }
  }

  function completeMove(destId) {
    state.room = destId;
    state.visited[destId] = true;
    if (state.inSkiff) {
      state.skiffRoom = destId;
    }
    advanceTime(1, false);
    if (!state.ended) {
      describeRoom();
      // Check if player just rowed to east_bay_mouth during Night 3 3am window with everything ready!
      if (state.room === "east_bay_mouth" && canTriggerTideEnding()) {
        triggerEnding("ending_tide");
      }
    }
  }

  function handleGo(dir) {
    if (!dir) {
      print("Which way? Try north, south, east, west, up, down, or 'go to <place>'.", "system");
      return;
    }
    var room = window.LH.WORLD[state.room];
    var exitObj = room.exits[dir];
    if (!exitObj) {
      print("There is no way " + dir + " from " + room.name + ".");
      return;
    }

    // Check tide / skiff / gap rules
    if (exitObj.mode === "always" && state.inSkiff) {
      print("You can't row a cedar skiff up dry stairs or through a cabin door. Type 'disembark' first.");
      return;
    }
    if (exitObj.mode === "walk_low") {
      if (state.inSkiff) {
        print("The pilings are too tight there to row through; try the open channel or disembark.");
        return;
      }
      if (state.tideLevel > 8) {
        print("The high tide has submerged that plank walk under cold bay water. Wait for low tide, or row around in Gus's skiff.");
        return;
      }
    }
    if (exitObj.mode === "flats_low") {
      if (state.inSkiff) {
        print("Too shallow for the skiff over those flats right now—try the channel or log booms.");
        return;
      }
      if (state.tideLevel > 7) {
        print("The tide is too high—those mudflats lie underwater. Wait for low tide to walk across.");
        return;
      }
    }
    if (exitObj.mode === "plank_gap") {
      if (state.inSkiff) {
        if (!state.isAfloat()) {
          print("The skiff is grounded in mud until high tide.");
          return;
        }
      } else {
        if (state.tideLevel > 8) {
          print("Plank Walk C is underwater at high tide. Wait for low tide or use the skiff.");
          return;
        }
        if (!state.flags.walkCGapFixed) {
          print("An eight-foot gap yawns where the stringers washed out. Lay a stout fir plank across the gap first (or row around at high tide).");
          return;
        }
      }
    }
    if (exitObj.mode === "skiff_or_walk") {
      if (state.inSkiff && !state.isAfloat()) {
        print("The skiff sits grounded in the mud. Disembark to walk, or wait for high tide.");
        return;
      }
      if (!state.inSkiff && state.tideLevel > 8) {
        print("High water covers the connecting planks! Board Gus's skiff to row between float houses, or wait for low tide.");
        return;
      }
    }
    if (exitObj.mode === "water_high") {
      if (!state.isAfloat()) {
        print("At this low tide, that channel is impassable mud and shoals. Wait for high tide to row there.");
        return;
      }
      if (!state.inSkiff) {
        print("Deep Puget Sound water lies that way. You'll need to board Gus's skiff (bailed and fitted with oars) to row out.");
        return;
      }
    }

    if (checkDangerBeforeMove(dir, exitObj)) return;
    completeMove(exitObj.to);
  }

  function handleGoTo(targetPhrase) {
    if (!targetPhrase) {
      print("Go where? Name a nearby place or a compass direction.", "system");
      return;
    }
    var clean = targetPhrase.toLowerCase().trim();
    if ((clean === "town" || clean === "tacoma" || clean === "stage" || clean === "away") && state.room === "road_above" && state.flags.maePaid) {
      triggerEnding("ending_mae");
      return;
    }

    var room = window.LH.WORLD[state.room];
    var exitDirs = Object.keys(room.exits);
    var adjCands = exitDirs.map(function (d) {
      var dest = window.LH.WORLD[room.exits[d].to];
      return { id: dest.id, dir: d, name: dest.name, aliases: dest.aliases || [] };
    });

    var res = window.LH.Parser.resolveNoun(targetPhrase, adjCands);
    if (res.match) {
      if (res.corrected) print("(Assuming you meant \"" + res.corrected.to + "\".)", "system");
      handleGo(res.match.dir);
      return;
    }

    // Check if it's a known room further away and give a helpful compass hint
    var allRooms = Object.keys(window.LH.WORLD).map(function (id) {
      var r = window.LH.WORLD[id];
      return { id: id, name: r.name, aliases: r.aliases || [] };
    });
    var far = window.LH.Parser.resolveNoun(targetPhrase, allRooms);
    if (far.match) {
      if (far.match.id === state.room) {
        print("You're already at " + far.match.name + ".");
        return;
      }
      var nextDir = findFirstStepBFS(state.room, far.match.id);
      if (nextDir) {
        print("Heading toward " + far.match.name + " (" + nextDir + ")...", "system");
        handleGo(nextDir);
      } else {
        print(far.match.name + " isn't reachable on foot at this tide level—check the tide gauge or take the skiff.");
      }
      return;
    }

    print("You don't know a place called \"" + targetPhrase + "\" from here.");
  }

  function findFirstStepBFS(startId, goalId) {
    var queue = [{ id: startId, firstDir: null }];
    var seen = {};
    seen[startId] = true;
    while (queue.length) {
      var cur = queue.shift();
      var r = window.LH.WORLD[cur.id];
      var dirs = Object.keys(r.exits);
      for (var i = 0; i < dirs.length; i++) {
        var d = dirs[i];
        var ex = r.exits[d];
        if (!isExitPassable(ex)) continue;
        var nextId = ex.to;
        if (nextId === goalId) return cur.firstDir || d;
        if (!seen[nextId]) {
          seen[nextId] = true;
          queue.push({ id: nextId, firstDir: cur.firstDir || d });
        }
      }
    }
    return null;
  }

  function handleLookDir(dir) {
    var room = window.LH.WORLD[state.room];
    var ex = room.exits[dir];
    if (!ex) {
      print("Looking " + dir + ", there's no passage that way—just weathered timber, mud, or open mist.");
      return;
    }
    var dest = window.LH.WORLD[ex.to];
    var pass = isExitPassable(ex) ? "Passable right now." : "Blocked right now by the tide, a gap, or needing the skiff.";
    print("To the " + dir + ": " + ex.desc + " (" + dest.name + "). " + pass);
  }

  // --- Examine ---
  function handleExamine(target) {
    if (!target) {
      describeRoom();
      return;
    }
    var match = resolveLocal(target);
    if (!match) {
      print("You don't see any \"" + target + "\" right here to examine.");
      return;
    }
    if (match.kind === "item") {
      var d = typeof match.data.desc === "function" ? match.data.desc(state) : match.data.desc;
      print(d);
      if (match.id === "tide_table") {
        state.addJournal("Studied the 1931 tide table: High tides hit at 3:00 PM and 3:00 AM; Night 3 3:00 AM is the escape flood.");
      }
      if (match.id === "ledger") {
        state.addJournal("Read Uncle Gus's oilcloth ledger: documents Big Mae's whisky runs and payoffs to a City Hall clerk.");
      }
      return;
    }
    if (match.kind === "npc") {
      print(match.data.desc);
      return;
    }
    if (match.kind === "scenery") {
      var sd = typeof match.data.desc === "function" ? match.data.desc(state) : match.data.desc;
      print(sd);
      if (state.room === "mill_yard_gate" && match.id === "lumber" && !state.hasItem("plank") && state.items.plank.location !== "mill_yard_gate" && !state.flags.extraPlankTaken) {
        state.flags.extraPlankTaken = true;
        state.items.plank.location = "mill_yard_gate";
        print("Digging through the off-cuts, you spot another sound ten-foot Douglas fir plank you could take.", "good");
      }
      return;
    }
  }

  // --- Take / Drop ---
  function handleTake(target) {
    if (!target) {
      print("Take what?");
      return;
    }
    var match = resolveLocal(target);
    if (!match) {
      print("You don't see any \"" + target + "\" here to take.");
      return;
    }
    if (match.kind === "item") {
      if (match.held) {
        print("You're already carrying the " + match.data.name + ".");
        return;
      }
      if (!match.data.takeable) {
        print("The " + match.data.name + " is far too heavy to tuck into your pockets. Try boarding it instead.");
        return;
      }
      state.items[match.id].location = "player";
      if (match.id === "whisky") {
        state.flags.whiskyTaken = true;
        state.addJournal("Pulled Uncle Gus's six-quart crate of Canadian rye from beneath the floorboards.");
      }
      print("Taken: " + match.data.name + ".");
      updateHUD();
      return;
    }
    print(window.LH.Parser.VERB_FALLBACKS.take);
  }

  function handleDrop(target) {
    if (!target) {
      print("Drop what?");
      return;
    }
    var inv = getLocalCandidates(true).filter(function (c) { return c.kind === "item" && c.held; });
    var res = window.LH.Parser.resolveNoun(target, inv);
    if (!res.match) {
      print("You aren't carrying any \"" + target + "\".");
      return;
    }
    state.items[res.match.id].location = state.room;
    print("Dropped: " + res.match.data.name + ".");
    updateHUD();
  }

  // --- Puzzle Verbs ---
  function handleLight(target) {
    var t = (target || "lantern").toLowerCase();
    if (t.indexOf("heat") !== -1 || t.indexOf("sterno") !== -1 || t.indexOf("stove") !== -1) {
      if (state.room === "drifters_shack" && state.hasItem("canned_heat")) {
        warmOldPete();
        return;
      }
    }
    if (state.hasItem("lantern") || state.itemAt("lantern", state.room)) {
      if (state.flags.lanternLit) {
        print("The brass storm lantern is already burning steady and bright.");
        return;
      }
      state.flags.lanternLit = true;
      print("You strike a lucifer match and touch it to the wick. The brass storm lantern flares warm and steady.", "good");
      if (state.room === "hulk_hold") {
        describeRoom();
      }
      return;
    }
    print(window.LH.Parser.VERB_FALLBACKS.light);
  }

  function handleExtinguish(target) {
    if (state.flags.lanternLit && (state.hasItem("lantern") || state.itemAt("lantern", state.room))) {
      state.flags.lanternLit = false;
      print("You turn down the brass wick and blow out the lantern. Smoke curls up into the damp air.");
      return;
    }
    print(window.LH.Parser.VERB_FALLBACKS.extinguish);
  }

  function handlePry(target) {
    var t = (target || "").toLowerCase();
    if (state.room === "float_house" && (!t || t.indexOf("floor") !== -1 || t.indexOf("board") !== -1 || t.indexOf("cache") !== -1 || t.indexOf("nail") !== -1)) {
      if (state.flags.floorPried) {
        print("The floorboards by the stove are already pried up.");
        return;
      }
      if (!state.hasItem("crowbar")) {
        print("Those fir floorboards are spiked down tight. Your fingernails won't budge them—you need an iron crowbar.");
        return;
      }
      state.flags.floorPried = true;
      state.items.whisky.location = "float_house";
      state.addJournal("Pried up Uncle Gus's floorboards with the crowbar and uncovered six quarts of Canadian rye whisky.");
      print("You hook the iron crowbar under the scarred fir boards and lean your weight on it. With a shriek of rusty nails, two boards lift clear—revealing a slatted crate of Canadian rye whisky packed in straw!", "good");
      advanceTime(1, false);
      return;
    }

    if (state.room === "hulk_hold" && (!t || t.indexOf("box") !== -1 || t.indexOf("valve") !== -1 || t.indexOf("latch") !== -1)) {
      if (!state.hasLight()) {
        print("It's pitch black in the engine room—light your lantern before swinging iron in the dark.");
        return;
      }
      if (state.flags.valveBoxOpened) {
        print("The rusted valve box already hangs open.");
        return;
      }
      if (!state.hasItem("crowbar")) {
        print("The iron latch is rusted solid. A crowbar would pop it right open.");
        return;
      }
      state.flags.valveBoxOpened = true;
      state.items.key.location = "hulk_hold";
      state.addJournal("Pried open the rusted valve box in the Cowlitz engine room and found Uncle Gus's brass chest key.");
      print("You wedge the crowbar behind the rusted latch and heave. The valve box pops open, spilling oily rags—and a small brass key tied with red string!", "good");
      advanceTime(1, false);
      return;
    }

    print(window.LH.Parser.VERB_FALLBACKS.pry);
  }

  function handleOpenOrUnlock(verb, target) {
    var t = (target || "").toLowerCase();
    if (state.room === "float_house" && (t.indexOf("chest") !== -1 || t.indexOf("trunk") !== -1 || t.indexOf("lock") !== -1 || t.indexOf("padlock") !== -1)) {
      if (state.flags.chestUnlocked) {
        print("Gus's sea chest is already unlocked and open.");
        return;
      }
      if (!state.hasItem("key")) {
        print("The brass padlock on Gus's sea chest is locked tight. You'll need his brass key.");
        return;
      }
      state.flags.chestUnlocked = true;
      state.items.ledger.location = "float_house";
      state.addJournal("Unlocked Uncle Gus's sea chest and found his oilcloth bootlegging ledger.");
      print("The small brass key turns with a dry click. Inside Gus's cedar chest, wrapped in flannel, lies his oilcloth-bound ledger!", "good");
      advanceTime(1, false);
      return;
    }
    if (state.room === "float_house" && (t.indexOf("floor") !== -1 || t.indexOf("board") !== -1)) {
      handlePry("floorboards");
      return;
    }
    if (state.room === "hulk_hold" && (t.indexOf("box") !== -1 || t.indexOf("valve") !== -1)) {
      handlePry("valve box");
      return;
    }
    print(window.LH.Parser.VERB_FALLBACKS[verb] || window.LH.Parser.VERB_FALLBACKS.open);
  }

  function handleFix(target, indirect) {
    var combo = ((target || "") + " " + (indirect || "")).toLowerCase();

    // Fix artesian spring
    if (state.room === "the_springs") {
      if (state.flags.springFixed) {
        print("The artesian standpipe is already mended and running clean.");
        return;
      }
      if (!state.hasItem("pipe") || !state.hasItem("fitting")) {
        print("You need both a replacement iron pipe length AND a threaded brass fitting to mend the split standpipe.");
        return;
      }
      state.flags.springFixed = true;
      state.items.pipe.location = null;
      state.items.fitting.location = null;
      state.changeStanding("neighbors", 3, "Repaired the artesian spring standpipe on the low-tide flats.");
      print("Working ankle-deep in cold gravel, you thread the brass union onto the fresh iron pipe and cinch it tight onto the artesian vein. Clear, sweet freshwater immediately gushes into the stone basin!", "good");
      advanceTime(1, false);
      return;
    }

    // Fix Plank Walk C gap
    if (state.room === "plank_walk_c" || combo.indexOf("gap") !== -1) {
      if (state.room !== "plank_walk_c") {
        print("You need to be standing at the broken gap on Plank Walk C to bridge it.");
        return;
      }
      if (state.flags.walkCGapFixed) {
        print("Plank Walk C is already bridged with a sturdy fir plank.");
        return;
      }
      if (!state.hasItem("plank")) {
        print("You need a stout ten-foot plank—try the scrap lumber pile up by the Olympia Veneer & Mill Gate.");
        return;
      }
      state.flags.walkCGapFixed = true;
      state.items.plank.location = null;
      state.addJournal("Bridged the storm-damaged gap on Plank Walk C with a fir plank.");
      print("You heave the stout Douglas fir plank across the eight-foot break and wedge its ends behind the iron spikes. Solid enough to cross east to the Croatian boardinghouse!", "good");
      advanceTime(1, false);
      return;
    }

    // Fix rotten plank on Plank Walk A
    if (state.room === "plank_walk_a") {
      if (state.flags.rottenPlankFixed) {
        print("The soft spot on Plank Walk A is already reinforced.");
        return;
      }
      if (!state.hasItem("plank")) {
        print("You'd need a sound fir plank to reinforce that rotted span.");
        return;
      }
      state.flags.rottenPlankFixed = true;
      state.items.plank.location = null;
      state.addJournal("Reinforced the rotten span on Plank Walk A.");
      print("You lay the sturdy Douglas fir plank squarely over the worm-eaten span on Plank Walk A. Safe to cross with any load now.", "good");
      advanceTime(1, false);
      return;
    }

    print(window.LH.Parser.VERB_FALLBACKS.fix);
  }

  function handleBail() {
    if (state.room !== state.skiffRoom) {
      print("Uncle Gus's skiff isn't moored here.");
      return;
    }
    if (state.flags.skiffBailed) {
      print("The skiff's bilge is already bailed clean and dry.");
      return;
    }
    if (!state.hasItem("bailer")) {
      print("Six inches of rainwater sit in the bottom of the skiff—you'll need a tin bailer to scoop it out.");
      return;
    }
    state.flags.skiffBailed = true;
    state.addJournal("Bailed the rainwater out of Uncle Gus's cedar skiff.");
    print("You work the tin bailer rhythmically, tossing gallon after gallon of cold rainwater over the gunwale until the cedar floorboards gleam dry.", "good");
    advanceTime(1, false);
  }

  function handleFill() {
    if (!state.hasItem("bucket")) {
      print("You need a bucket to carry fresh water.");
      return;
    }
    if (state.room !== "the_springs") {
      print("No clean drinking water here—head out to the artesian springs at low tide.");
      return;
    }
    if (!state.flags.springFixed) {
      print("The split standpipe wastes straight into the salt mud. Mend it with a pipe and brass fitting first.");
      return;
    }
    state.flags.bucketFull = true;
    print("You hold the galvanized bucket under the mended standpipe until it brims with cold, clear artesian water.", "good");
    advanceTime(1, false);
  }

  function handleHide() {
    if (!state.hasItem("whisky")) {
      print("You aren't carrying the whisky crate right now.");
      return;
    }
    if (state.flags.whiskyHidden) {
      print("The whisky crate is already wrapped tight in burlap gunnysacks.");
      return;
    }
    if (!state.hasItem("gunnysacks")) {
      print("You need burlap gunnysacks to disguise the slatted whisky crate—check the drying shed.");
      return;
    }
    state.flags.whiskyHidden = true;
    state.items.gunnysacks.location = null;
    state.addJournal("Wrapped the Canadian rye crate in burlap gunnysacks so patrolmen won't spot glass.");
    print("You lash the rough burlap gunnysacks tight around the slatted crate. From five paces off it looks like nothing more than wet turnips or salvage rags.", "good");
    updateHUD();
  }

  function handleTie() {
    if (state.room !== "gus_porch" && state.room !== "boardinghouse") {
      print("Tie the float houses together at Gus's catwalk cleats or Stanko's boardinghouse winch.");
      return;
    }
    if (state.flags.housesLashed) {
      print("The float houses are already lashed together with heavy Manila hemp hawser, ready for the 3 a.m. tide.");
      return;
    }
    if (!state.hasItem("rope")) {
      print("You need a heavy coil of Manila hemp tow rope—check Sweeney's salvage crib under the trestle.");
      return;
    }
    state.flags.housesLashed = true;
    state.items.rope.location = null;
    state.changeStanding("neighbors", 2, "Lashed the float houses together with heavy hemp hawser for the 3 a.m. tow.");
    print("Working along the cleats and Stanko's stern winch, you run the heavy hemp hawser in double-hitched bridle lines linking Gus's house, Halvorsen's store, Pete's shack, and the boardinghouse in tandem!", "good");
    advanceTime(1, false);
  }

  function warmOldPete() {
    if (state.flags.peteWarmed) {
      print("A tin of canned heat is already burning warm in Pete's stove.");
      return;
    }
    state.flags.peteWarmed = true;
    state.items.canned_heat.location = null;
    state.changeStanding("neighbors", 2, "Lit canned heat in Old Pete's stove to break his chill.");
    print("You pry the lid off a pink tin of Sterno canned heat, strike a match, and set the steady blue flame inside Pete's oil-tin stove. Warmth blooms across the damp shack; Pete exhales a long shaky breath.", "good");
    advanceTime(1, false);
  }

  function handlePut(target, prep, indirect) {
    var t = (target || "").toLowerCase();
    var ind = (indirect || "").toLowerCase();

    if (t.indexOf("oar") !== -1 && (ind.indexOf("skiff") !== -1 || ind.indexOf("boat") !== -1 || state.room === state.skiffRoom)) {
      if (!state.hasItem("oars")) {
        print("You aren't carrying any oars.");
        return;
      }
      if (state.room !== state.skiffRoom) {
        print("Bring the oars back to Gus's skiff first.");
        return;
      }
      state.flags.skiffHasOars = true;
      state.items.oars.location = null;
      state.addJournal("Fitted Gus's spruce oars into the skiff's oarlocks.");
      print("You set the pair of Sitka spruce oars snugly into the skiff's brass oarlocks.", "good");
      advanceTime(1, false);
      return;
    }

    if (t.indexOf("plank") !== -1 && (state.room === "plank_walk_c" || state.room === "plank_walk_a")) {
      handleFix(ind || "gap", t);
      return;
    }

    if ((t.indexOf("whisky") !== -1 || t.indexOf("whiskey") !== -1 || t.indexOf("rye") !== -1 || t.indexOf("crate") !== -1) &&
        (ind.indexOf("sack") !== -1 || ind.indexOf("burlap") !== -1 || ind.indexOf("bag") !== -1)) {
      handleHide();
      return;
    }

    if ((t.indexOf("heat") !== -1 || t.indexOf("sterno") !== -1 || t.indexOf("tin") !== -1) &&
        state.room === "drifters_shack" && state.hasItem("canned_heat")) {
      warmOldPete();
      return;
    }

    if ((t.indexOf("pipe") !== -1 || t.indexOf("fitting") !== -1) && state.room === "the_springs") {
      handleFix("spring", t);
      return;
    }

    if ((t.indexOf("rope") !== -1 || t.indexOf("hawser") !== -1) && (state.room === "gus_porch" || state.room === "boardinghouse")) {
      handleTie();
      return;
    }

    print(window.LH.Parser.VERB_FALLBACKS.put);
  }

  function handleUse(target, indirect) {
    var t = (target || "").toLowerCase();
    var ind = (indirect || "").toLowerCase();
    if (t.indexOf("crowbar") !== -1) { handlePry(ind); return; }
    if (t.indexOf("key") !== -1) { handleOpenOrUnlock("unlock", ind || "chest"); return; }
    if (t.indexOf("bailer") !== -1) { handleBail(); return; }
    if (t.indexOf("oar") !== -1) { handlePut("oars", "in", "skiff"); return; }
    if (t.indexOf("pipe") !== -1 || t.indexOf("fitting") !== -1) { handleFix("spring", t); return; }
    if (t.indexOf("plank") !== -1) { handleFix(ind || "gap", t); return; }
    if (t.indexOf("rope") !== -1 || t.indexOf("hawser") !== -1) { handleTie(); return; }
    if (t.indexOf("sack") !== -1 || t.indexOf("burlap") !== -1) { handleHide(); return; }
    if (t.indexOf("lantern") !== -1) { handleLight("lantern"); return; }
    if (t.indexOf("heat") !== -1 || t.indexOf("sterno") !== -1) {
      if (state.room === "drifters_shack" && state.hasItem("canned_heat")) { warmOldPete(); return; }
    }
    if (t.indexOf("bucket") !== -1) {
      if (state.room === "the_springs") { handleFill(); return; }
      if (state.room === "drifters_shack" && state.flags.bucketFull) { handleGive("bucket", "pete"); return; }
      if (state.room === "grocers_float" && state.flags.bucketFull) { handleGive("bucket", "halvorsen"); return; }
    }
    print(window.LH.Parser.VERB_FALLBACKS.use);
  }

  // --- Skiff & Tow ---
  function handleBoard() {
    if (state.inSkiff) {
      print("You're already sitting at the oars in Uncle Gus's skiff.");
      return;
    }
    if (state.room !== state.skiffRoom) {
      print("Uncle Gus's skiff is moored back at " + window.LH.WORLD[state.skiffRoom].name + ".");
      return;
    }
    if (!state.flags.skiffBailed) {
      print("Six inches of cold rainwater slosh in the bottom. Bail the skiff out with a bailer first.");
      return;
    }
    if (!state.flags.skiffHasOars) {
      print("The oarlocks are empty. Put Gus's spruce oars in the skiff before casting off.");
      return;
    }
    if (!state.isAfloat()) {
      print("At this low tide the skiff sits dead in the blue mud. Wait for high tide to float her.");
      return;
    }
    state.inSkiff = true;
    print("You step down into the bailed cedar skiff and take hold of the spruce oars. She rocks buoyant on the tide—row north, east, or south to navigate the water.", "good");
    updateHUD();
  }

  function handleDisembark() {
    if (!state.inSkiff) {
      print(window.LH.Parser.VERB_FALLBACKS.disembark);
      return;
    }
    var cur = window.LH.WORLD[state.room];
    if (cur.zone === "water" && state.room !== "budd_inlet_landing") {
      print("Only deep Puget Sound water around you here—row to a float house or Budd Inlet Landing before stepping out.");
      return;
    }
    state.inSkiff = false;
    state.skiffRoom = state.room;
    print("You loop the painter around a cleat and step out of the skiff onto " + cur.name + ".");
    updateHUD();
  }

  function canTriggerTideEnding() {
    return (
      state.isEscapeWindow() &&
      state.flags.halvorsenWarned &&
      state.flags.peteWarned &&
      state.flags.stankoWarned &&
      state.flags.housesLashed &&
      state.flags.skiffBailed &&
      state.flags.skiffHasOars
    );
  }

  function handleTow() {
    var missing = [];
    if (!state.flags.halvorsenWarned) missing.push("warn Mrs. Halvorsen");
    if (!state.flags.peteWarned) missing.push("help and warn Old Pete");
    if (!state.flags.stankoWarned) missing.push("warn Stanko at the boardinghouse");
    if (!state.flags.housesLashed) missing.push("lash the float houses with heavy rope");
    if (!state.flags.skiffBailed) missing.push("bail Gus's skiff");
    if (!state.flags.skiffHasOars) missing.push("put oars in Gus's skiff");

    if (missing.length) {
      print("You aren't ready to tow Little Hollywood out yet. Still needed: " + missing.join("; ") + ".", "warn");
      return;
    }
    if (!state.isEscapeWindow()) {
      print("Everything is lashed and ready, but the escape window is the 3:00 a.m. high tide on Night 3 (2:00 AM–4:30 AM Day 3). Type 'wait for 3am' when you're ready to catch the flood.", "tide-note");
      return;
    }
    if (!state.flags.lanternLit && state.hasItem("lantern")) {
      state.flags.lanternLit = true;
      print("You strike a match to light your brass storm lantern as the signal flame.", "system");
    }
    triggerEnding("ending_tide");
  }

  // --- NPC Interactions ---
  function findNPCInRoom(phrase) {
    var npcs = getNPCsInRoom(state.room);
    if (!npcs.length) return null;
    if (!phrase && npcs.length === 1) return npcs[0];
    var cands = npcs.map(function (n) { return { id: n.id, name: n.name, aliases: n.aliases, data: n }; });
    var res = window.LH.Parser.resolveNoun(phrase, cands);
    if (res.corrected) print("(Assuming you meant \"" + res.corrected.to + "\".)", "system");
    return res.match ? res.match.data : null;
  }

  function handleTalk(target) {
    var npc = findNPCInRoom(target);
    if (!npc) {
      print(window.LH.Parser.VERB_FALLBACKS.talk);
      return;
    }
    if (npc.id === "voss") state.flags.talkedVoss = true;
    print(npc.talk(state), "dialogue");

    // Auto-grant compass if talking to Halvorsen after fixing spring
    if (npc.id === "halvorsen" && state.flags.springFixed && !state.flags.compassGiven) {
      state.flags.compassGiven = true;
      state.giveItemToPlayer("compass");
      state.addJournal("Mrs. Halvorsen gave you the brass pocket compass from the Cowlitz.");
      print("Mrs. Halvorsen hands you the brass pocket compass! (Compass now visible in the HUD.)", "good");
      updateHUD();
    }
  }

  function handleAsk(target, topic) {
    var npc = findNPCInRoom(target);
    if (!npc) {
      print(window.LH.Parser.VERB_FALLBACKS.ask);
      return;
    }
    if (!topic) {
      handleTalk(target);
      return;
    }
    if (npc.id === "voss") state.flags.talkedVoss = true;
    var cleanTopic = topic.toLowerCase().trim();
    var keys = Object.keys(npc.topics || {});
    for (var i = 0; i < keys.length; i++) {
      if (cleanTopic.indexOf(keys[i]) !== -1 || keys[i].indexOf(cleanTopic) !== -1) {
        print(npc.name + ": " + npc.topics[keys[i]], "dialogue");
        return;
      }
    }
    print(npc.name + " shakes their head. \"Can't tell you much about " + topic + ". Ask me about the raid, the tide, Gus, the whisky, or the neighbors.\"", "dialogue");
  }

  function handleWarn(target) {
    var npc = findNPCInRoom(target);
    if (!npc) {
      print(window.LH.Parser.VERB_FALLBACKS.warn);
      return;
    }
    print(npc.warn(state), "dialogue");
    updateHUD();
  }

  function handleGive(itemPhrase, npcPhrase) {
    var npc = findNPCInRoom(npcPhrase);
    if (!npc) {
      print("Who are you trying to give that to? Stand by them and try 'give <item> to <name>'.");
      return;
    }
    var inv = getLocalCandidates(true).filter(function (c) { return c.kind === "item" && c.held; });
    var res = window.LH.Parser.resolveNoun(itemPhrase, inv);
    if (!res.match) {
      print("You aren't carrying any \"" + itemPhrase + "\" to give.");
      return;
    }
    var itemId = res.match.id;

    // Big Mae deals
    if (npc.id === "mae") {
      if (itemId === "whisky") {
        state.items.whisky.location = null;
        state.flags.maePaid = true;
        state.giveItemToPlayer("cash");
        state.changeStanding("mae", 4, "Sold Uncle Gus's whisky cache to Big Mae for $400 cash.");
        state.changeStanding("neighbors", -3);
        print("Big Mae pries one slat back, sniffs the Canadian cork, and grins wide. She unlocks her steel cashbox and counts twenty crisp twenty-dollar bills into your palm.\n\n\"Four hundred clean, kid. Take the Bluff Road east to town before dawn Day 3—and don't look back when the smoke rises.\"", "good");
        advanceTime(1, false);
        return;
      }
      if (itemId === "ledger") {
        state.items.ledger.location = null;
        state.flags.gaveLedgerMae = true;
        state.changeStanding("mae", 3, "Handed Uncle Gus's payoff ledger over to Big Mae.");
        print("Mae flips through the pencil columns, then drops the oilcloth book straight into her stove grate. \"Smartest thing you've done all week, kid. Voss won't pin a dime on me now.\"", "dialogue");
        advanceTime(1, false);
        return;
      }
    }

    // Captain Voss deals
    if (npc.id === "voss") {
      if (itemId === "whisky") {
        state.items.whisky.location = null;
        state.flags.vossDealDone = true;
        state.changeStanding("voss", 5, "Turned Uncle Gus's hidden whisky cache over to Captain Voss.");
        state.changeStanding("mae", -5);
        triggerEnding("ending_voss");
        return;
      }
      if (itemId === "ledger") {
        state.items.ledger.location = null;
        state.flags.gaveLedgerVoss = true;
        state.changeStanding("voss", 3, "Turned Uncle Gus's bootlegging ledger over to Captain Voss.");
        state.changeStanding("mae", -4);
        print("Voss's eyes light up as he reads the City Hall payoff dates. \"This puts Big Mae away for five years. Bring me Gus's whisky crate too, and I'll sign your clean release on the spot.\"", "dialogue");
        advanceTime(1, false);
        return;
      }
    }

    // Old Pete needs canned heat & spring water
    if (npc.id === "pete") {
      if (itemId === "canned_heat") {
        warmOldPete();
        return;
      }
      if (itemId === "bucket") {
        if (!state.flags.bucketFull) {
          print("The bucket is empty! Fill it at the repaired artesian spring first.");
          return;
        }
        state.flags.bucketFull = false;
        state.flags.peteWatered = true;
        state.changeStanding("neighbors", 2, "Brought Old Pete a bucket of clean artesian spring water.");
        print("Old Pete drinks two full dippers of the cold artesian water, color returning to his sunken cheeks. \"Sweetest water in Thurston County... If you've got word on that raid, warn me straight—I can stand on my own two boots now.\"", "good");
        advanceTime(1, false);
        return;
      }
    }

    // Mrs. Halvorsen loves fresh spring water -> gives compass
    if (npc.id === "halvorsen") {
      if (itemId === "bucket" && state.flags.bucketFull) {
        state.flags.bucketFull = false;
        state.changeStanding("neighbors", 2, "Brought Mrs. Halvorsen fresh artesian spring water.");
        var msg = "Mrs. Halvorsen fills her coffee kettle gratefully. \"Clean spring water at last! Thank you, dear.\"";
        if (!state.flags.compassGiven) {
          state.flags.compassGiven = true;
          state.giveItemToPlayer("compass");
          state.addJournal("Mrs. Halvorsen gifted you the brass pocket compass.");
          msg += "\n\nShe reaches behind the scale and hands you a heavy brass pocket compass. \"For the night tide—keep true bearings.\" (Compass added to HUD!)";
        }
        print(msg, "good");
        updateHUD();
        advanceTime(1, false);
        return;
      }
    }

    // Stanko accepts heavy tow rope or ledger proof
    if (npc.id === "stanko") {
      if (itemId === "rope") {
        handleTie();
        return;
      }
      if (itemId === "ledger") {
        state.changeStanding("neighbors", 2, "Showed Stanko proof of City Hall payoffs in Gus's ledger.");
        print("Stanko reads a page and hands the ledger back, jaw tight. \"Crooked all the way to City Hall. We're not letting them burn our roofs—warn me straight and lash the floats!\"", "dialogue");
        advanceTime(1, false);
        return;
      }
    }

    print(npc.name + " looks at the " + res.match.data.name + " and shakes their head. \"No need for that right now.\"");
  }

  function handleShow(itemPhrase, npcPhrase) {
    var npc = findNPCInRoom(npcPhrase);
    if (!npc) {
      print(window.LH.Parser.VERB_FALLBACKS.show);
      return;
    }
    var inv = getLocalCandidates(true).filter(function (c) { return c.kind === "item" && c.held; });
    var res = window.LH.Parser.resolveNoun(itemPhrase, inv);
    if (!res.match) {
      print("You aren't carrying any \"" + itemPhrase + "\" to show.");
      return;
    }
    if (res.match.id === "ledger") {
      if (npc.id === "stanko") {
        state.changeStanding("neighbors", 1);
        print("Stanko scans Gus's pencil entries and nods grimly. \"Figures—City Hall takes Mae's money while burning out mill hands.\"", "dialogue");
        return;
      }
      if (npc.id === "voss") {
        print("Voss reaches for the oilcloth book. \"That's state's evidence. Hand it over—give ledger to voss—and bring me the whisky.\"", "dialogue");
        return;
      }
      if (npc.id === "mae") {
        print("Mae's eyes narrow. \"Keep that book out of sight, kid—better yet, give it to me so it goes in my stove.\"", "dialogue");
        return;
      }
    }
    if (res.match.id === "whisky" && npc.id === "mae") {
      print("Mae grins. \"That's the genuine Canadian rye. Give it here and take my four hundred.\"", "dialogue");
      return;
    }
    if (res.match.id === "whisky" && npc.id === "voss") {
      print("Voss stiffens. \"Give that crate to me right now if you want clean hands.\"", "dialogue");
      return;
    }
    print(npc.name + " glances at your " + res.match.data.name + " and nods slowly.");
  }

  // --- Wait & Wait For Tide ---
  function handleWaitFor(target) {
    var t = (target || "").toLowerCase();
    var targetCondition = null;
    var label = "";

    if (t.indexOf("high") !== -1 || t.indexOf("afloat") !== -1 || t.indexOf("flood") !== -1) {
      if (state.isAfloat()) {
        print("The tide is already high (" + state.tideLevel + " ft, afloat).");
        return;
      }
      targetCondition = function () { return state.isAfloat(); };
      label = "high tide";
    } else if (t.indexOf("low") !== -1 || t.indexOf("ground") !== -1 || t.indexOf("flats") !== -1) {
      if (state.tideLevel <= 3) {
        print("The tide is already low (" + state.tideLevel + " ft, grounded).");
        return;
      }
      targetCondition = function () { return state.tideLevel <= 3; };
      label = "low tide";
    } else if (t.indexOf("3") !== -1 || t.indexOf("escape") !== -1 || t.indexOf("tow") !== -1) {
      if (state.isEscapeWindow()) {
        print("It is already the Night 3 escape tide (" + state.getClock().short + ")!");
        return;
      }
      targetCondition = function () { return state.isEscapeWindow(); };
      label = "the Night 3 3:00 AM high tide";
    } else if (t.indexOf("night") !== -1 || t.indexOf("dark") !== -1) {
      targetCondition = function () { return state.isNight(); };
      label = "nightfall";
    } else if (t.indexOf("morning") !== -1 || t.indexOf("day") !== -1 || t.indexOf("dawn") !== -1) {
      targetCondition = function () { return !state.isNight(); };
      label = "morning";
    } else {
      print("Wait for what? Try 'wait for high tide', 'wait for low tide', or 'wait for 3am'.");
      return;
    }

    var steps = 0;
    while (!state.ended && !targetCondition() && steps < 90) {
      advanceTime(1, true);
      steps++;
    }
    if (!state.ended) {
      print("You bide your time (" + (steps * 0.5) + " hours pass) until " + label + ". It is now " + state.getClock().short + " — tide at " + state.tideLevel + " ft (" + state.tidePhaseLabel() + ").", "tide-note");
      updateHUD();
    }
  }

  // --- Inventory, Log, Status, Save/Load ---
  function handleInventory() {
    var held = Object.keys(window.LH.ITEMS).filter(function (id) { return state.hasItem(id); });
    if (!held.length) {
      print("Your pockets are empty save for a bent nickel and damp lint.");
      return;
    }
    var lines = held.map(function (id) {
      var extra = "";
      if (id === "lantern" && state.flags.lanternLit) extra = " (lit)";
      if (id === "bucket" && state.flags.bucketFull) extra = " (full of spring water)";
      if (id === "whisky" && state.flags.whiskyHidden) extra = " (wrapped in gunnysacks)";
      return "  - " + window.LH.ITEMS[id].name + extra;
    });
    print("YOU ARE CARRYING:\n" + lines.join("\n"));
  }

  function handleStatus() {
    var hoursLeft = Math.max(0, (RAID_TURN - state.turn) * 0.5);
    print(
      "STATUS — " + state.getClock().label + "\n" +
      "  Tide: " + state.tideLevel + "/12 ft (" + state.tidePhaseLabel() + ", " + (state.isAfloat() ? "AFLOAT" : "GROUNDED") + ")\n" +
      "  Time until Day 3 Dawn Raid: " + hoursLeft.toFixed(1) + " hours\n" +
      "  Standing — Big Mae: " + state.standing.mae + " | Captain Voss: " + state.standing.voss + " | Neighbors: " + state.standing.neighbors
    );
  }

  function handleLog() {
    var lines = ["JOURNAL — LITTLE HOLLYWOOD (1931)"];
    state.journal.forEach(function (entry) {
      lines.push("  • " + entry);
    });
    lines.push("  [Standing — Mae: " + state.standing.mae + " | Voss: " + state.standing.voss + " | Neighbors: " + state.standing.neighbors + "]");
    print(lines.join("\n"), "journal");
  }

  function saveGame(silent) {
    try {
      if (typeof localStorage === "undefined") return false;
      var payload = JSON.stringify({
        room: state.room,
        turn: state.turn,
        tideLevel: state.tideLevel,
        tideDir: state.tideDir,
        inSkiff: state.inSkiff,
        skiffRoom: state.skiffRoom,
        ended: state.ended,
        endingId: state.endingId,
        visited: state.visited,
        standing: state.standing,
        flags: state.flags,
        items: state.items,
        journal: state.journal
      });
      localStorage.setItem(SAVE_KEY, payload);
      if (!silent) print("Progress saved to local storage.", "good");
      return true;
    } catch (e) {
      if (!silent) print("Could not save to local storage (" + e.message + ").", "warn");
      return false;
    }
  }

  function loadGame() {
    try {
      if (typeof localStorage === "undefined") {
        print("Local storage is not available here.", "warn");
        return false;
      }
      var raw = localStorage.getItem(SAVE_KEY);
      if (!raw) {
        print("No saved game found yet. Type 'save' anytime to save your place.");
        return false;
      }
      var parsed = JSON.parse(raw);
      parsed.pendingDanger = null;
      state = attachStateMethods(parsed);
      print("Saved game restored.", "good");
      describeRoom();
      return true;
    } catch (e) {
      print("Failed to load save: " + e.message, "warn");
      return false;
    }
  }

  // --- Endings ---
  function triggerEnding(endingId) {
    var end = window.LH.ENDINGS[endingId];
    if (!end) return;
    state.ended = true;
    state.endingId = endingId;
    print(end.title, "ending-title");
    print(end.text);
    print(end.epilogueLog.join("\n"), "journal");
    print("Type 'restart' to play again, or 'load' to restore your last save.", "system");
    updateHUD();
  }

  // --- Main Command Dispatcher ---
  function execute(rawInput) {
    var trimmed = (rawInput || "").trim();
    if (!trimmed) return;

    print("> " + trimmed, "cmd-echo");

    var cmd = window.LH.Parser.parse(trimmed);
    if (cmd.corrected) {
      print("(Assuming you meant \"" + cmd.corrected.to + "\".)", "system");
    }

    // If game has ended, only allow restart, load, log, status, help
    if (state.ended) {
      if (cmd.verb === "restart") { startNewGame(); return; }
      if (cmd.verb === "load") { loadGame(); return; }
      if (cmd.verb === "log") { handleLog(); return; }
      if (cmd.verb === "status") { handleStatus(); return; }
      print("This story has reached its end. Type 'restart' for a fresh start, 'load' to restore a save, or 'log' to review your journal.", "system");
      return;
    }

    // Any non-push_on command clears a pending danger warning
    if (cmd.verb !== "push_on") {
      state.pendingDanger = null;
    }

    // Special: "leave" at Bluff Road with Mae's cash -> Ending 1
    if (trimmed.toLowerCase() === "leave" && state.room === "road_above" && state.flags.maePaid) {
      triggerEnding("ending_mae");
      return;
    }

    switch (cmd.verb) {
      case "empty":
        return;
      case "unknown":
        print("I don't know the word \"" + cmd.rawVerb + "\".\n" + window.LH.Parser.getHelpText(), "system");
        return;
      case "help":
        print(window.LH.Parser.getHelpText(), "system");
        return;
      case "look":
        describeRoom();
        return;
      case "look_dir":
        handleLookDir(cmd.dir);
        return;
      case "examine":
        handleExamine(cmd.target);
        return;
      case "go":
        handleGo(cmd.dir);
        return;
      case "go_to":
        handleGoTo(cmd.target);
        return;
      case "push_on":
        handlePushOn();
        return;
      case "take":
        handleTake(cmd.target);
        return;
      case "drop":
        handleDrop(cmd.target);
        return;
      case "put":
        handlePut(cmd.target, cmd.prep, cmd.indirect);
        return;
      case "use":
        handleUse(cmd.target, cmd.indirect);
        return;
      case "pry":
        handlePry(cmd.target);
        return;
      case "open":
      case "unlock":
        handleOpenOrUnlock(cmd.verb, cmd.target);
        return;
      case "fix":
        handleFix(cmd.target, cmd.indirect);
        return;
      case "tie":
        handleTie();
        return;
      case "bail":
        handleBail();
        return;
      case "fill":
        handleFill();
        return;
      case "light":
        handleLight(cmd.target);
        return;
      case "extinguish":
        handleExtinguish(cmd.target);
        return;
      case "hide":
        handleHide();
        return;
      case "board":
        handleBoard();
        return;
      case "disembark":
        handleDisembark();
        return;
      case "row":
        if (!state.inSkiff) {
          print(window.LH.Parser.VERB_FALLBACKS.row);
        } else {
          print("Row which way? Try 'row north', 'row east', 'row south', or 'row west'.");
        }
        return;
      case "tow":
        handleTow();
        return;
      case "talk":
        handleTalk(cmd.target);
        return;
      case "ask":
        handleAsk(cmd.target, cmd.topic);
        return;
      case "tell":
        if (cmd.topic && cmd.topic.indexOf("raid") !== -1) {
          handleWarn(cmd.target);
        } else {
          handleAsk(cmd.target, cmd.topic);
        }
        return;
      case "give":
        handleGive(cmd.target, cmd.indirect);
        return;
      case "show":
        handleShow(cmd.target, cmd.indirect);
        return;
      case "warn":
        handleWarn(cmd.target);
        return;
      case "wait":
        var n = cmd.count || 1;
        advanceTime(n, false);
        if (!state.ended) {
          print("Time passes (" + (n * 0.5) + " hr). " + state.getClock().short + " — tide at " + state.tideLevel + "/12 ft (" + state.tidePhaseLabel() + ").", "tide-note");
        }
        return;
      case "wait_for":
        handleWaitFor(cmd.target);
        return;
      case "inventory":
        handleInventory();
        return;
      case "status":
        handleStatus();
        return;
      case "log":
        handleLog();
        return;
      case "save":
        saveGame(false);
        return;
      case "load":
        loadGame();
        return;
      case "restart":
        startNewGame();
        return;
      default:
        print(window.LH.Parser.VERB_FALLBACKS[cmd.verb] || window.LH.Parser.VERB_FALLBACKS.use);
        return;
    }
  }

  function startNewGame() {
    state = attachStateMethods(createFreshState());
    updateTideFromTurn();
    transcriptBuffer = [];
    if (outputEl) outputEl.innerHTML = "";

    print(window.LH.INTRO.title + " — " + window.LH.INTRO.subtitle, "banner");
    print(window.LH.INTRO.opening);
    describeRoom();
  }

  function initBrowser() {
    outputEl = document.getElementById("output");
    inputEl = document.getElementById("cmd");
    var form = document.getElementById("prompt-bar");

    if (form && inputEl) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var val = inputEl.value;
        if (val.trim()) {
          cmdHistory.push(val);
          historyIdx = cmdHistory.length;
        }
        inputEl.value = "";
        execute(val);
      });

      // Up/Down arrow recalls input history
      inputEl.addEventListener("keydown", function (e) {
        if (e.key === "ArrowUp") {
          e.preventDefault();
          if (cmdHistory.length && historyIdx > 0) {
            historyIdx -= 1;
            inputEl.value = cmdHistory[historyIdx];
          }
        } else if (e.key === "ArrowDown") {
          e.preventDefault();
          if (historyIdx < cmdHistory.length - 1) {
            historyIdx += 1;
            inputEl.value = cmdHistory[historyIdx];
          } else {
            historyIdx = cmdHistory.length;
            inputEl.value = "";
          }
        }
      });

      // Keep focus on the single input line when clicking anywhere on the black screen
      document.addEventListener("click", function () {
        if (window.getSelection && window.getSelection().toString()) return;
        inputEl.focus();
      });
    }

    startNewGame();
  }

  if (typeof window !== "undefined" && typeof document !== "undefined") {
    document.addEventListener("DOMContentLoaded", initBrowser);
  }

  return {
    startNewGame: startNewGame,
    execute: execute,
    getState: function () { return state; },
    getTranscript: function () { return transcriptBuffer; },
    setRng: function (fn) { rng = fn; }
  };
})();

/* LITTLE HOLLYWOOD — parser.js
 * Verb table with synonyms, plurals, one-match typo correction,
 * single-word-only shortcuts, "go to X", "look <dir>", "look in/at X",
 * "put X in/on Y", "wait for high tide", and per-verb fallbacks.
 */

window.LH = window.LH || {};

window.LH.Parser = (function () {
  var DIRECTIONS = {
    north: "north",
    south: "south",
    east: "east",
    west: "west",
    up: "up",
    down: "down",
    in: "in",
    inside: "in",
    out: "out",
    outside: "out",
    northeast: "northeast",
    northwest: "northwest",
    southeast: "southeast",
    southwest: "southwest"
  };

  var DIR_SHORTCUTS = {
    n: "north",
    s: "south",
    e: "east",
    w: "west",
    u: "up",
    d: "down",
    ne: "northeast",
    nw: "northwest",
    se: "southeast",
    sw: "southwest"
  };

  // Single-letter shortcuts ONLY honored when input is a single word
  var SINGLE_WORD_SHORTCUTS = {
    n: { verb: "go", dir: "north" },
    s: { verb: "go", dir: "south" },
    e: { verb: "go", dir: "east" },
    w: { verb: "go", dir: "west" },
    u: { verb: "go", dir: "up" },
    d: { verb: "go", dir: "down" },
    ne: { verb: "go", dir: "northeast" },
    nw: { verb: "go", dir: "northwest" },
    se: { verb: "go", dir: "southeast" },
    sw: { verb: "go", dir: "southwest" },
    l: { verb: "look" },
    i: { verb: "inventory" },
    z: { verb: "wait" },
    h: { verb: "help" },
    "?": { verb: "help" }
  };

  // Canonical verb -> synonyms (all lowercase, single words)
  var VERB_SYNONYMS = {
    look: ["look", "peer", "gaze", "survey"],
    examine: ["examine", "inspect", "check", "study", "read", "search", "view"],
    go: ["go", "walk", "move", "head", "climb", "step", "travel", "run", "leave", "exit", "enter"],
    take: ["take", "get", "grab", "fetch", "collect", "pickup", "steal", "lift", "carry"],
    drop: ["drop", "discard", "set"],
    put: ["put", "place", "insert", "lay", "stash", "pack", "fit"],
    use: ["use", "apply", "operate", "work"],
    open: ["open", "unlatch", "lift"],
    unlock: ["unlock"],
    pry: ["pry", "lever", "jimmy", "force", "break", "crowbar"],
    fix: ["fix", "repair", "mend", "attach", "screw", "install", "patch", "bridge"],
    tie: ["tie", "lash", "bind", "moor", "knot", "fasten", "secure", "hitch"],
    bail: ["bail", "scoop", "empty", "drain"],
    row: ["row", "paddle", "launch", "sail", "steer"],
    tow: ["tow", "pull", "cast"],
    board: ["board"],
    disembark: ["disembark", "unboard", "ashore"],
    fill: ["fill", "dip"],
    light: ["light", "ignite", "strike", "burn", "kindle"],
    extinguish: ["extinguish", "douse", "snuff", "quench"],
    hide: ["hide", "wrap", "conceal", "cover", "bundle", "disguise"],
    talk: ["talk", "speak", "chat", "greet", "converse"],
    ask: ["ask", "question", "inquire", "query"],
    tell: ["tell", "inform"],
    give: ["give", "hand", "offer", "pay", "trade", "bribe", "deliver", "sell", "surrender"],
    show: ["show", "display", "present", "flash"],
    warn: ["warn", "alert"],
    wait: ["wait", "rest", "sleep", "pass", "bide"],
    inventory: ["inventory", "inv", "pack", "pockets", "gear"],
    log: ["log", "journal", "notes", "diary"],
    status: ["status", "standing", "score", "reputation", "tide", "time", "clock"],
    save: ["save"],
    load: ["load", "restore"],
    restart: ["restart", "reset", "new"],
    help: ["help", "verbs", "commands", "hint", "hints"],
    listen: ["listen", "hear"],
    smell: ["smell", "sniff"],
    knock: ["knock", "rap", "bang"],
    drink: ["drink", "sip", "taste"],
    push: ["push", "shove", "press"]
  };

  // Build reverse lookup: synonym -> canonical verb
  var WORD_TO_VERB = {};
  var ALL_VERB_WORDS = [];
  Object.keys(VERB_SYNONYMS).forEach(function (canon) {
    VERB_SYNONYMS[canon].forEach(function (syn) {
      WORD_TO_VERB[syn] = canon;
      ALL_VERB_WORDS.push(syn);
    });
  });

  // Never reply "Nothing happens" — every verb has its own contextual fallback.
  var VERB_FALLBACKS = {
    examine: "You look it over closely, but see no hidden catch or useful detail beyond what's plain to the eye.",
    take: "That won't come loose, or it isn't yours to haul off.",
    drop: "You aren't carrying that right now.",
    put: "That doesn't fit or belong there.",
    use: "You try to make that work, but it isn't the right tool for the job here.",
    open: "It isn't something that opens, or it's already as open as it gets.",
    unlock: "There's no lock on that to turn a key in.",
    pry: "Prying at that won't get you anywhere—save your crowbar for nailed floorboards or a rusted latch.",
    fix: "That doesn't need mending, or you don't have the right parts to fix it.",
    tie: "There's no cleat or float timber there worth lashing a tow line to.",
    bail: "Nothing there needs bailing—save the bailer for a waterlogged skiff.",
    row: "You can't row unless you're aboard a bailed skiff with oars on high water.",
    tow: "You can't tow the float houses until they're lashed, the neighbors are warned, and the 3 a.m. high tide lifts the rafts.",
    board: "There's no floating skiff here to climb aboard.",
    disembark: "Your boots are already out of the skiff.",
    fill: "You need an empty bucket and clean running water—like a mended artesian spring.",
    light: "That won't take a flame, or it's already burning.",
    extinguish: "There's no flame on that to douse.",
    hide: "Wrap the whisky crate in burlap gunnysacks if you want to hide it from patrol eyes.",
    talk: "No one by that name is standing here to answer you.",
    ask: "They aren't here to answer questions—or try 'ask <name> about <topic>'.",
    tell: "Try 'warn <name>' or 'ask <name> about <topic>' when standing near them.",
    give: "They don't have a use for that, or you aren't holding it.",
    show: "They glance at it without much interest.",
    warn: "Nobody here needs warning—find Mrs. Halvorsen, Old Pete, or Stanko.",
    listen: "You pause and listen: gulls crying over Budd Inlet, timbers creaking, and the steady hiss of the Deschutes tide.",
    smell: "Cold salt mud, wet cedar bark, creosote pilings, and faint woodsmoke from the shacks.",
    knock: "Your knuckles rap hollow against wet cedar, drawing no answer.",
    drink: "Better not swallow bay water or mystery liquid—find the clean artesian spring.",
    push: "You lean a shoulder against it, but it stays put."
  };

  var STOP_WORDS = {
    the: true, a: true, an: true, my: true, some: true, this: true, that: true, these: true, those: true
  };

  function stripArticles(str) {
    if (!str) return "";
    return str
      .toLowerCase()
      .replace(/[^a-z0-9\s'-]/g, " ")
      .split(/\s+/)
      .filter(function (w) { return w && !STOP_WORDS[w]; })
      .join(" ")
      .trim();
  }

  function singularize(word) {
    if (!word || word.length <= 3) return word;
    if (word.endsWith("ies") && word.length > 4) return word.slice(0, -3) + "y";
    if (word.endsWith("es") && (word.endsWith("shes") || word.endsWith("ches") || word.endsWith("xes") || word.endsWith("zes"))) {
      return word.slice(0, -2);
    }
    if (word.endsWith("s") && !word.endsWith("ss")) return word.slice(0, -1);
    return word;
  }

  function levenshtein(a, b) {
    if (a === b) return 0;
    if (!a.length) return b.length;
    if (!b.length) return a.length;
    var prev = [];
    var curr = [];
    for (var j = 0; j <= b.length; j++) prev[j] = j;
    for (var i = 1; i <= a.length; i++) {
      curr[0] = i;
      for (var k = 1; k <= b.length; k++) {
        var cost = a[i - 1] === b[k - 1] ? 0 : 1;
        curr[k] = Math.min(prev[k] + 1, curr[k - 1] + 1, prev[k - 1] + cost);
      }
      var tmp = prev;
      prev = curr;
      curr = tmp;
    }
    return prev[b.length];
  }

  // Find ONE close typo match in a list of candidate words
  function findCloseWord(word, pool) {
    if (!word || word.length < 3) return null;
    var maxDist = word.length >= 6 ? 2 : 1;
    var bestDist = maxDist + 1;
    var matches = [];
    var seen = {};
    for (var i = 0; i < pool.length; i++) {
      var cand = pool[i];
      if (seen[cand]) continue;
      seen[cand] = true;
      var d = levenshtein(word, cand);
      if (d < bestDist) {
        bestDist = d;
        matches = [cand];
      } else if (d === bestDist) {
        matches.push(cand);
      }
    }
    if (bestDist <= maxDist && matches.length === 1) {
      return matches[0];
    }
    // If multiple synonyms map to the SAME canonical verb, still unambiguous!
    if (bestDist <= maxDist && matches.length > 1) {
      var canons = {};
      var allSame = true;
      for (var m = 0; m < matches.length; m++) {
        var c = WORD_TO_VERB[matches[m]];
        if (!c) { allSame = false; break; }
        canons[c] = true;
      }
      if (allSame && Object.keys(canons).length === 1) {
        return matches[0];
      }
    }
    return null;
  }

  // Resolve a noun phrase against candidates: [{ id, name, aliases: [...] }]
  function resolveNoun(phrase, candidates) {
    var clean = stripArticles(phrase);
    if (!clean) return { match: null };
    var cleanSing = clean.split(" ").map(singularize).join(" ");

    // 1. Exact id / name / alias match (and singularized)
    for (var i = 0; i < candidates.length; i++) {
      var c = candidates[i];
      var forms = [c.id.toLowerCase().replace(/_/g, " "), (c.name || "").toLowerCase()].concat(
        (c.aliases || []).map(function (a) { return a.toLowerCase(); })
      );
      for (var f = 0; f < forms.length; f++) {
        var form = stripArticles(forms[f]);
        var formSing = form.split(" ").map(singularize).join(" ");
        if (clean === form || cleanSing === formSing) {
          return { match: c };
        }
      }
    }

    // 2. Partial word overlap (e.g., "canned heat" matching "tins of canned heat")
    var overlapMatches = [];
    for (var j = 0; j < candidates.length; j++) {
      var cand = candidates[j];
      var cForms = [cand.id.toLowerCase().replace(/_/g, " "), (cand.name || "").toLowerCase()].concat(
        (cand.aliases || []).map(function (a) { return a.toLowerCase(); })
      );
      var hit = false;
      for (var k = 0; k < cForms.length; k++) {
        var cf = stripArticles(cForms[k]);
        var cfSing = cf.split(" ").map(singularize).join(" ");
        if (cfSing.indexOf(cleanSing) !== -1 || cleanSing.indexOf(cfSing) !== -1) {
          if (cfSing.length >= 3) { hit = true; break; }
        }
      }
      if (hit) overlapMatches.push(cand);
    }
    if (overlapMatches.length === 1) {
      return { match: overlapMatches[0] };
    }

    // 3. Single close typo match across all alias words
    var maxDist = cleanSing.length >= 7 ? 2 : 1;
    var bestDist = maxDist + 1;
    var fuzzyHits = [];
    for (var p = 0; p < candidates.length; p++) {
      var item = candidates[p];
      var itemForms = [item.id.toLowerCase().replace(/_/g, " "), (item.name || "").toLowerCase()].concat(
        (item.aliases || []).map(function (a) { return a.toLowerCase(); })
      );
      var bestForItem = 99;
      var bestFormText = "";
      for (var q = 0; q < itemForms.length; q++) {
        var tf = stripArticles(itemForms[q]);
        if (!tf || tf.length < 3) continue;
        var d = levenshtein(cleanSing, tf.split(" ").map(singularize).join(" "));
        if (d < bestForItem) {
          bestForItem = d;
          bestFormText = tf;
        }
      }
      if (bestForItem < bestDist) {
        bestDist = bestForItem;
        fuzzyHits = [{ item: item, form: bestFormText }];
      } else if (bestForItem === bestDist) {
        fuzzyHits.push({ item: item, form: bestFormText });
      }
    }

    if (bestDist <= maxDist && fuzzyHits.length === 1) {
      return {
        match: fuzzyHits[0].item,
        corrected: { from: phrase.trim(), to: fuzzyHits[0].form }
      };
    }

    return { match: null };
  }

  function splitOnPrep(rest, preps) {
    for (var i = 0; i < preps.length; i++) {
      var p = preps[i];
      var re = new RegExp("\\s+" + p + "\\s+", "i");
      var idx = rest.search(re);
      if (idx !== -1) {
        var match = rest.match(re)[0];
        return {
          left: rest.slice(0, idx).trim(),
          prep: p,
          right: rest.slice(idx + match.length).trim()
        };
      }
    }
    return null;
  }

  function parse(rawInput) {
    var trimmed = (rawInput || "").trim();
    if (!trimmed) return { verb: "empty" };

    var lower = trimmed.toLowerCase().replace(/[?!.,]+$/g, "").trim();
    var tokens = lower.split(/\s+/);

    // 1. Single-word shortcuts ONLY when input is a single word
    if (tokens.length === 1) {
      if (SINGLE_WORD_SHORTCUTS[tokens[0]]) {
        var sc = SINGLE_WORD_SHORTCUTS[tokens[0]];
        return { verb: sc.verb, dir: sc.dir, raw: trimmed };
      }
      if (DIRECTIONS[tokens[0]]) {
        return { verb: "go", dir: DIRECTIONS[tokens[0]], raw: trimmed };
      }
    }

    // 2. Special multi-word idioms
    if (/^(push on|press on|keep going|continue|go anyway|step anyway|walk anyway)$/.test(lower)) {
      return { verb: "push_on", raw: trimmed };
    }
    if (/^(cast off|set sail|launch skiff|row out|tow out)$/.test(lower)) {
      return { verb: "tow", target: "floats", raw: trimmed };
    }
    if (/^(get out|step out|leave skiff|exit skiff|climb out|disembark)$/.test(lower)) {
      return { verb: "disembark", raw: trimmed };
    }
    if (/^(get in|climb in|step in|enter skiff|board skiff|get into skiff|get in skiff|get in the skiff)$/.test(lower)) {
      return { verb: "board", target: "skiff", raw: trimmed };
    }

    // "wait for <target>" (e.g. "wait for high tide", "wait for low tide", "wait for 3am")
    var waitForMatch = lower.match(/^(?:wait|rest|sleep|bide)\s+(?:for|until|till|to)\s+(.+)$/);
    if (waitForMatch) {
      return { verb: "wait_for", target: waitForMatch[1].trim(), raw: trimmed };
    }

    // "go to <place>" / "walk to <place>" / "head to <place>" / "row to <place>"
    var goToMatch = lower.match(/^(?:go|walk|head|move|row|travel)\s+(?:to|toward|towards|into)\s+(.+)$/);
    if (goToMatch) {
      return { verb: "go_to", target: goToMatch[1].trim(), raw: trimmed };
    }

    // "pick up <obj>" / "put down <obj>"
    var pickUpMatch = lower.match(/^pick\s+up\s+(.+)$/);
    if (pickUpMatch) {
      return { verb: "take", target: pickUpMatch[1].trim(), raw: trimmed };
    }
    var putDownMatch = lower.match(/^put\s+down\s+(.+)$/);
    if (putDownMatch) {
      return { verb: "drop", target: putDownMatch[1].trim(), raw: trimmed };
    }

    // "turn on <obj>" / "turn off <obj>" / "put out <obj>"
    var turnOnMatch = lower.match(/^turn\s+on\s+(.+)$/);
    if (turnOnMatch) {
      return { verb: "light", target: turnOnMatch[1].trim(), raw: trimmed };
    }
    var turnOffMatch = lower.match(/^(?:turn\s+off|put\s+out)\s+(.+)$/);
    if (turnOffMatch) {
      return { verb: "extinguish", target: turnOffMatch[1].trim(), raw: trimmed };
    }

    // "look in/at/under/inside <obj>" or "look <dir>"
    if (tokens[0] === "look" && tokens.length >= 2) {
      var lookRest = lower.slice(4).trim();
      var lookPrep = lookRest.match(/^(in|inside|at|under|on|behind)\s+(.+)$/);
      if (lookPrep) {
        return { verb: "examine", prep: lookPrep[1], target: lookPrep[2].trim(), raw: trimmed };
      }
      var dirWord = DIRECTIONS[lookRest] || DIR_SHORTCUTS[lookRest];
      if (dirWord) {
        return { verb: "look_dir", dir: dirWord, raw: trimmed };
      }
      return { verb: "examine", target: lookRest, raw: trimmed };
    }

    // 3. Identify first word as verb (with single-match typo correction)
    var first = tokens[0];
    var rest = tokens.slice(1).join(" ");
    var corrected = null;
    var canonVerb = WORD_TO_VERB[first];

    // Also allow "x <noun>" ONLY? Wait: prompt says "Shortcut letters only when the input is a single word."
    // So we do NOT map single-letter 'x' when multi-word; full words like examine/inspect/look at work.
    if (!canonVerb) {
      // Check typo against verb list (plus full direction names)
      var pool = ALL_VERB_WORDS.concat(Object.keys(DIRECTIONS));
      var close = findCloseWord(first, pool);
      if (close) {
        corrected = { from: first, to: close };
        if (DIRECTIONS[close] && tokens.length === 1) {
          return { verb: "go", dir: DIRECTIONS[close], corrected: corrected, raw: trimmed };
        }
        canonVerb = WORD_TO_VERB[close];
      }
    }

    if (!canonVerb) {
      return { verb: "unknown", rawVerb: first, raw: trimmed };
    }

    // 4. Parse verb-specific argument structures
    if (canonVerb === "go") {
      if (!rest) return { verb: "go", dir: null, corrected: corrected, raw: trimmed };
      var d = DIRECTIONS[rest] || DIR_SHORTCUTS[rest];
      if (d) return { verb: "go", dir: d, corrected: corrected, raw: trimmed };
      return { verb: "go_to", target: rest, corrected: corrected, raw: trimmed };
    }

    if (canonVerb === "ask" || canonVerb === "tell") {
      var askSplit = splitOnPrep(rest, ["about", "for", "of"]);
      if (askSplit) {
        return { verb: canonVerb, target: askSplit.left, topic: askSplit.right, corrected: corrected, raw: trimmed };
      }
      return { verb: canonVerb, target: rest, topic: "", corrected: corrected, raw: trimmed };
    }

    if (canonVerb === "talk") {
      var talkTarget = rest.replace(/^(?:to|with)\s+/, "").trim();
      return { verb: "talk", target: talkTarget, corrected: corrected, raw: trimmed };
    }

    if (canonVerb === "give" || canonVerb === "show") {
      // Support "bribe mae with whisky" as well as "give whisky to mae"
      if (first === "bribe") {
        var bSplit = splitOnPrep(rest, ["with"]);
        if (bSplit) {
          return { verb: "give", target: bSplit.right, indirect: bSplit.left, corrected: corrected, raw: trimmed };
        }
      }
      var gSplit = splitOnPrep(rest, ["to"]);
      if (gSplit) {
        return { verb: canonVerb, target: gSplit.left, indirect: gSplit.right, corrected: corrected, raw: trimmed };
      }
      return { verb: canonVerb, target: rest, indirect: "", corrected: corrected, raw: trimmed };
    }

    if (canonVerb === "put") {
      var pSplit = splitOnPrep(rest, ["in", "into", "inside", "on", "onto", "across", "over", "under"]);
      if (pSplit) {
        return { verb: "put", target: pSplit.left, prep: pSplit.prep, indirect: pSplit.right, corrected: corrected, raw: trimmed };
      }
      return { verb: "put", target: rest, prep: "", indirect: "", corrected: corrected, raw: trimmed };
    }

    if (canonVerb === "use" || canonVerb === "fix" || canonVerb === "pry" || canonVerb === "unlock" ||
        canonVerb === "tie" || canonVerb === "hide" || canonVerb === "bail" || canonVerb === "fill") {
      var uSplit = splitOnPrep(rest, ["with", "on", "to", "in", "into", "from", "at", "across", "using"]);
      if (uSplit) {
        return { verb: canonVerb, target: uSplit.left, prep: uSplit.prep, indirect: uSplit.right, corrected: corrected, raw: trimmed };
      }
      return { verb: canonVerb, target: rest, indirect: "", corrected: corrected, raw: trimmed };
    }

    if (canonVerb === "row") {
      var rowDir = DIRECTIONS[rest] || DIR_SHORTCUTS[rest];
      if (rowDir) return { verb: "go", dir: rowDir, byRow: true, corrected: corrected, raw: trimmed };
      return { verb: "row", target: rest, corrected: corrected, raw: trimmed };
    }

    if (canonVerb === "wait") {
      var num = parseInt(rest, 10);
      return { verb: "wait", count: isNaN(num) ? 1 : Math.max(1, Math.min(24, num)), corrected: corrected, raw: trimmed };
    }

    return { verb: canonVerb, target: rest, corrected: corrected, raw: trimmed };
  }

  function getHelpText() {
    return (
      "COMMANDS THAT WORK:\n" +
      "  MOVE:    north, south, east, west, up, down, in, out (or single letter n/s/e/w/u/d)\n" +
      "           go to <place>, board skiff, disembark, row <dir>, push on\n" +
      "  LOOK:    look (l), look <dir>, examine <thing>, look in/at <thing>, listen, smell\n" +
      "  OBJECTS: take, drop, put <x> in/on <y>, use <x> on <y>, pry, open, unlock,\n" +
      "           fix, tie/lash, bail, fill, light, extinguish, hide/wrap, tow\n" +
      "  PEOPLE:  talk to <name>, ask <name> about <topic>, give <x> to <name>,\n" +
      "           show <x> to <name>, warn <name>\n" +
      "  TIDE:    wait (z), wait for high tide, wait for low tide, wait for 3am\n" +
      "  SYSTEM:  inventory (i), status, log, save, load, restart, help"
    );
  }

  return {
    parse: parse,
    resolveNoun: resolveNoun,
    VERB_FALLBACKS: VERB_FALLBACKS,
    getHelpText: getHelpText,
    DIRECTIONS: DIRECTIONS
  };
})();

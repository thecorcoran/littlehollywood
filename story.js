/* LITTLE HOLLYWOOD — story.js
 * Invented characters (no real people's names), faction dialogue,
 * danger odds table, and the 3 main endings + epilogue logs.
 */

window.LH = window.LH || {};

/* --- ONE TUNABLE DANGER ODDS TABLE ---
 * Death/arrest only triggers AFTER a clear warning and an explicit "push on".
 */
window.LH.DANGER_ODDS = {
  mudStuckDeathChance: 0.45,       // Pushing onto Outer Clam Flats on rising tide (tide >= 5) after warning
  rottenPlankFallChance: 0.35,     // Pushing across unrepaired rotten plank on Plank Walk A after warning
  arrestOnUncoveredWhisky: 0.85,   // Pushing into Armory Edge with unwrapped whisky after warning
  nightFlatsSlipChance: 0.30       // Pushing onto dark outer flats at night without lit lantern after warning
};

window.LH.INTRO = {
  title: "LITTLE HOLLYWOOD",
  subtitle: "Olympia, Washington — November 1931",
  verify: "Verify November 1931 Great Depression era setting and Olympia Deschutes mudflat shantytown nickname 'Little Hollywood'.",
  opening:
    "Uncle Gus left you two things when his heart quit on the mill dock: a tar-paper float house sitting on four cedar logs out on the Deschutes mudflats, and a whispered promise that six quarts of Canadian rye lie nailed beneath the floorboards.\n\n" +
    "Prohibition is the law. The Depression has half the sound living on clams and cedar scrap. And word came down from the bluff this morning: Olympia city marshals will raid and burn Little Hollywood at dawn on Day 3.\n\n" +
    "Three sides are already watching Gus's door—Big Mae the bootlegger, Captain Voss up by the Armory, and the mill hands and drifters whose roofs float beside yours. Watch the tide. On these flats, the water decides where your feet can go."
};

window.LH.NPCS = {
  mae: {
    id: "mae",
    name: "Big Mae",
    aliases: ["mae", "big mae", "bootlegger", "woman"],
    location: "maes_float",
    faction: "mae",
    desc: "A broad-shouldered woman in a man's wool mackinaw and a pinned felt hat. Her knuckles are scarred from handling kegs, and her eyes miss nothing on the flats.",
    talk: function (state) {
      if (state.flags.maePaid) {
        return "\"You got my four hundred in your pocket, kid. Take the Bluff Road east and catch the Tacoma stage before Voss lights the kerosene at dawn.\"";
      }
      if (state.standing.voss >= 2) {
        return "Mae spits into the brass spittoon. \"Word travels fast on mudflats. You've been cozying up to Voss by the Armory. Bring me Gus's whisky and keep your mouth shut, or stay off my raft.\"";
      }
      if (state.hasItem("whisky")) {
        return "Mae's eyes flick to your burden. \"You found Gus's rye. Smart kid. Hand it over—give me the whisky—and I'll count four hundred cash into your palm right now. Enough to get clean out of Thurston County before the city burns these shacks.\"";
      }
      return "Mae leans over her plank bar. \"Sorry about Gus. Straight shooter, your uncle. He was holding six quarts of prime Canadian rye for me under his floor, plus a little oilcloth book I'd rather Voss never reads. Pry up that floor with a crowbar, bring me the rye, and I'll pay you four hundred hard dollars. Let the city have the driftwood.\"";
    },
    topics: {
      whisky: "\"Six quarts of good Canadian rye under Gus's floorboards. Pry it up, bring it here, and walk away with four hundred dollars. Don't let Voss see glass—wrap it in gunnysacks if you go upland.\"",
      rye: "\"Six quarts of good Canadian rye under Gus's floorboards. Bring it to me and walk away rich.\"",
      ledger: "\"Gus kept an oilcloth ledger in his sea chest—names, dates, payoffs. If you find his brass key and bring me that book, I'll throw in extra goodwill. Don't you dare hand it to Voss.\"",
      voss: "\"Captain Voss wants a feather in his cap with the city council. Give him your uncle's rye and he'll smile, clap you on the back, and drag me to the county jail before sundown.\"",
      raid: "\"Dawn on Day 3. City's bringing kerosene cans and deputy axes. I'm moving my barrels out by launch at high water tomorrow night. Take my cash and get up on the Bluff Road before they strike a match.\"",
      neighbors: "\"Mill hands and drifters? Nice folks, sure, if you like starving in the rain. Four hundred bucks buys you a dry room in Seattle. Nobody's towing thirty rotten shacks out of here.\"",
      gus: "\"Gus knew the Deschutes tides better than the harbor master. Hid his sea-chest key out on that rotting sternwheeler Cowlitz, if I remember right.\"",
      tide: "\"High water at three in the afternoon and three in the morning. That's when boats move. Low water is for mud-grubbers.\"",
      compass: "\"Mrs. Halvorsen over at the grocer float has an old brass ship's compass behind her counter.\""
    },
    warn: function () {
      return "Big Mae gives a dry laugh. \"Honey, I knew about the Day 3 raid before the mayor signed the ink. My barrels will be gone by then. Worry about your own skin.\"";
    }
  },

  voss: {
    id: "voss",
    name: "Captain Voss",
    aliases: ["voss", "captain voss", "captain", "cop", "police", "officer", "marshal"],
    location: "armory_edge",
    faction: "voss",
    desc: "A lean, gray-jawed Olympia police captain in a damp wool overcoat, badge gleaming under the lapel. He watches the mudflats below like a hawk watching mice.",
    talk: function (state) {
      if (state.flags.vossDealDone) {
        return "\"You did the lawful thing. My signed clearance is in your coat. Walk west along the Bluff Road and don't look back when the smoke rises.\"";
      }
      if (state.hasItem("whisky") && !state.flags.whiskyHidden) {
        return "Voss's hand drops toward his nightstick as he spots the slatted crate. \"That looks mighty like Canadian rye, friend. If you're turning it in to the law—give it here now—you walk clean. Otherwise you're riding in the back of my Ford.\"";
      }
      if (state.standing.mae >= 2) {
        return "Voss narrows his eyes. \"I see who visits that green door down on the flats. Don't throw your future away for Big Mae. Turn over Gus's hidden whisky—and any ledger he kept—and I'll stamp you clean before the Day 3 raid.\"";
      }
      return "Voss taps the fender of his patrol Ford. \"Gus's nephew, eh? Listen straight: at 6:00 a.m. on Day 3 the city clears every shack off those flats. I know Gus had bootleg whisky under his floor and probably Mae's payoff book. Turn the whisky over to me right here, and I'll sign you a clean release—no charges, no trouble.\"";
    },
    topics: {
      whisky: "\"Six quarts of illegal liquor under Gus's floor. Give it to me—openly, like a citizen—and you walk out of Little Hollywood with a clean name. Carry it around sneaking, and I'll book you.\"",
      ledger: "\"If Gus kept an account book linking Big Mae to waterfront runs, bring it to me. That puts Mae behind bars for five years and clears your slate completely.\"",
      mae: "\"Big Mae's been thumbing her nose at the Eighteenth Amendment for four years. Help me put her away and Olympia won't forget it.\"",
      raid: "\"Zero-six-hundred, Day 3. Health department condemnation. Everything still sitting on city tide flats gets doused and burned. Anything floated out past the Budd Inlet harbor stakes is outside city jurisdiction—not that those ragged rafts could ever make it.\"",
      neighbors: "\"Squatters on public tidelands. Tell them to pack their suitcases and head for the highway. If they're still grounded on the mud at dawn Day 3, we clear them out.\"",
      gus: "\"Old Gus never caused trouble on shore, even if he ran errands for Mae. Shame he left you his mess.\"",
      tide: "\"I don't care about the tide—my men are marching down Fifth Avenue at 6:00 a.m. Day 3 on dry boots.\""
    },
    warn: function () {
      return "Voss chuckles coldly. \"Warn me? Son, I'm the one running the raid.\"";
    }
  },

  halvorsen: {
    id: "halvorsen",
    name: "Mrs. Halvorsen",
    aliases: ["halvorsen", "mrs halvorsen", "mrs. halvorsen", "grocer", "storekeeper", "woman"],
    location: "grocers_float",
    faction: "neighbors",
    desc: "A sturdy silver-haired Norwegian woman in a flour-dusted apron, tying up sacks of beans and coffee with steady, practical hands.",
    talk: function (state) {
      if (state.flags.halvorsenWarned && state.flags.compassGiven) {
        return "\"We've got our jars lashed down in straw and our bow line ready. Meet Stanko and us by the mooring on the 3 a.m. high tide, Night 3!\"";
      }
      if (state.flags.springFixed && !state.flags.compassGiven) {
        return "Mrs. Halvorsen wipes her hands on her apron and smiles warmly. \"Word reached me you mended the artesian spring! Half the flats had no clean drinking water since Tuesday. Wait—here, take this brass pocket compass off my shelf. Gus always admired it; it came off the old Cowlitz.\"";
      }
      if (!state.flags.halvorsenWarned) {
        return "\"Welcome to Gus's place, dear—though you picked a grim week to inherit it. Rumor says the city is coming with torches, and our artesian spring pipe split clean in two at low tide. If you find out for certain when the raid hits—or mend that spring—come tell me right away.\"";
      }
      return "\"I'm packing the dry goods tight so nothing shifts if we float out. If you can mend the artesian spring or bring Old Pete some clean water and warmth, folks down here will follow your lead.\"";
    },
    topics: {
      raid: "\"People whisper Day 3 at dawn, but nobody knows if it's real. If you've seen the Armory notice or talked to Voss, warn me straight so I can lash my shelves.\"",
      spring: "\"The artesian standpipe west of Plank Walk B split its brass union. At low tide it's right out on the gravel bar. You'd need a fresh iron pipe and a brass fitting—maybe down in the old Cowlitz engine room.\"",
      compass: "\"I keep an old brass pocket compass from the Cowlitz behind the counter. Help the neighbors out—fix the spring or bring me clean spring water—and it's yours.\"",
      pete: "\"Poor Old Pete's shaking with a fever in his leaning shack south of here. His stove's cold—tins of canned heat and a bucket of fresh spring water would set him on his feet.\"",
      stanko: "\"Stanko runs the Croatian mill hands' boardinghouse down past Plank Walk C. The walk's missing a span, so you'll need a stout plank from the veneer mill gate—or row around at high tide.\"",
      mae: "\"Big Mae keeps to herself behind her green door. Her money's real, mind you, but it burns everything it touches.\"",
      voss: "\"Captain Voss stands up by the Armory waiting for an excuse. Don't let him catch you hauling whisky in the open.\"",
      escape: "\"If we lash our float houses together with heavy hemp rope and pull out on the 3 a.m. high tide on Night 3, the ebb will help carry us past the Budd Inlet stakes where the city can't touch us!\""
    },
    warn: function (state) {
      if (state.flags.halvorsenWarned) {
        return "\"Already packing, dear! Get Stanko and Old Pete ready, and lash the floats before the 3 a.m. tide on Night 3.\"";
      }
      state.flags.halvorsenWarned = true;
      state.changeStanding("neighbors", 2, "Warned Mrs. Halvorsen about the Day 3 dawn raid.");
      var extra = "";
      if (!state.flags.compassGiven && (state.flags.springFixed || state.standing.neighbors >= 3)) {
        state.flags.compassGiven = true;
        state.giveItemToPlayer("compass");
        extra = "\n\nShe reaches behind the scale and presses a heavy brass pocket compass into your palm. \"Take this—you'll need true bearings on the bay at three in the morning.\" (Compass added to HUD!)";
      }
      return "Mrs. Halvorsen sets down her scoop, her jaw hardening. \"Dawn on Day 3, for certain. All right—I won't let them burn twelve years of work. I'll strap down the shelves and pass the word to the south shacks. Warn Stanko and Old Pete too!\"" + extra;
    }
  },

  pete: {
    id: "pete",
    name: "Old Pete",
    aliases: ["pete", "old pete", "drifter", "sick drifter", "man"],
    location: "drifters_shack",
    faction: "neighbors",
    desc: "A wiry old timber-stiff huddled under a patched slicker on his canvas cot, teeth chattering from a wet bay chill.",
    talk: function (state) {
      if (state.flags.peteWarmed && state.flags.peteWatered) {
        if (!state.flags.peteWarned) {
          return "Pete sits upright by his glowing Sterno stove, color back in his cheeks. \"Bless you, kid. That heat and cold spring water pulled me right out of the grave. Say—what's this I hear about city marshals coming?\"";
        }
        return "Pete has his canvas duffel knotted tight. \"I'm ready to cast off whenever you and Stanko give the lantern signal on the 3 a.m. tide!\"";
      }
      if (state.flags.peteWarmed) {
        return "Pete holds his hands over the blue Sterno flame. \"Much better... Lord, my throat's like cedar bark, though. If someone mended that artesian spring and brought a bucket of clean water, I could stand up again.\"";
      }
      if (state.flags.peteWatered) {
        return "Pete drinks gratefully from the dipper, still shivering. \"Sweetest water in Thurston County... If only I had a tin of canned heat for my stove, I'd shake this chill.\"";
      }
      return "Pete shivers under his slicker, voice raspy. \"Gus's kid? Cough... Can't get warm. Stove's dead, spring's busted, and my joints are locked up tight. A tin of canned heat from Sweeney's crib and a bucket of clean spring water would save my hide.\"";
    },
    topics: {
      heat: "\"Sweeney left tins of Sterno canned heat up in his salvage crib under the trestle. One tin in my little oil-tin stove will warm this whole shack.\"",
      water: "\"Rainwater barrel's foul. Only clean drinking water's the artesian spring west of Plank Walk B—once somebody mends its split pipe.\"",
      oars: "\"Saw your uncle tuck his good spruce oars behind the timber bents under the Fifth Avenue trestle so nobody'd walk off with 'em.\"",
      key: "\"Gus always joked he hid his chest key where no dry-land thief would look—down inside the rusted valve box in the old Cowlitz engine room. Bring a lit lantern and a crowbar.\"",
      raid: "\"If the marshals come while I'm flat on this cot, I'm done for. Get me warm and watered, and I'll help haul lines with the best of 'em.\"",
      stanko: "\"Good man, Stanko. Tough as fir heartwood. Once he trusts you, those mill hands can tow a whole row of float houses.\"",
      mae: "\"Big Mae leaves us alone so long as we don't talk to Voss.\""
    },
    warn: function (state) {
      if (!state.flags.peteWarmed || !state.flags.peteWatered) {
        return "Pete coughs weakly. \"Day 3? Kid, I hear you, I swear—but I can't even lift my boots till I get some heat in this stove and a bucket of clean spring water.\"";
      }
      if (state.flags.peteWarned) {
        return "\"Duffel's packed and my bow line's coiled. Just say the word on the 3 a.m. high tide!\"";
      }
      state.flags.peteWarned = true;
      state.changeStanding("neighbors", 2, "Warned Old Pete and got him ready to evacuate on the 3 a.m. tide.");
      return "Pete stands up steady on his boots and knots his blanket roll. \"Dawn on Day 3? Then we ride the 3 a.m. flood right out from under their noses. My float logs are light—lash me onto Gus's stern and I'll steer with a sweep!\"";
    }
  },

  stanko: {
    id: "stanko",
    name: "Stanko",
    aliases: ["stanko", "mill hand", "mill hands", "croatian", "men", "leader"],
    location: "boardinghouse",
    faction: "neighbors",
    desc: "A barrel-chested Croatian veneer-mill sawyer with heavy forearms and a calm, skeptical gaze. The other mill hands look to him before speaking.",
    talk: function (state) {
      if (state.flags.housesLashed && state.flags.stankoWarned) {
        return "Stanko tests the taut hemp hawser on his winch. \"The floats are lashed tight, friend. Wait for the 3:00 a.m. high tide on Night 3, get in your skiff with a lit lantern, and lead us north out to the mouth of Budd Inlet!\"";
      }
      if (state.flags.stankoWarned) {
        return "Stanko nods grimly. \"We believe you about the raid—my boys are packed. Now we need heavy hemp tow rope to lash the float houses together at Gus's mooring (or right here), and a bailed skiff with oars to guide the tow out at 3 a.m. on Night 3.\"";
      }
      return "Stanko sets down his soup spoon and eyes you steadily. \"Gus's nephew. We hear talk of a city raid, and we hear Big Mae and Captain Voss both sniffing around your door. Are you here to sell us out, or are you standing with the flats? Warn us straight if the raid is real—and show us you mean it.\"";
    },
    topics: {
      raid: "\"If the city's really burning us out at dawn Day 3, we don't fight police axes—we float out on the 3 a.m. high tide past Budd Inlet Landing where Olympia's writ ends. Tell me straight ('warn stanko') once you know for sure.\"",
      tow: "\"Four float houses lashed in a string with heavy hemp rope—Gus's, Halvorsen's, Pete's, and ours. On the 3 a.m. high tide, Night 3, my boys pole from the rafts while your skiff leads the bow north past Budd Inlet Landing to the mouth of the inlet!\"",
      rope: "\"We need sixty feet of heavy Manila hemp hawser. Sweeney used to keep coils of it in his salvage crib under the trestle.\"",
      plank: "\"Storm took out Plank Walk C last month. A stout fir plank from the veneer mill scrap pile bridges it clean.\"",
      spring: "\"Artesian spring's been broken since Tuesday. Fix that pipe and every man at this table will swear by your name.\"",
      ledger: "\"If Gus's ledger shows City Hall clerks taking Mae's money, showing it around proves the city's raid is pure crooked politics.\"",
      mae: "\"Mae's got cash, sure. Take her money and watch our roofs burn from the bluff—that's your choice to live with.\"",
      voss: "\"Captain Voss calls us vagrants, even though we cut the plywood that built his courthouse.\""
    },
    warn: function (state) {
      if (state.flags.stankoWarned) {
        return "\"We're packed and watching the water. Get the houses lashed with heavy rope and your skiff ready for the 3 a.m. tide on Night 3.\"";
      }
      if (state.standing.neighbors < 1 && !state.flags.sawNotice && !state.flags.talkedVoss && !state.hasItem("ledger")) {
        return "Stanko folds his arms. \"Rumors blow off the bluff every month, kid. Check the Armory notice, talk to Voss, or help out folks on the flats first so we know you're not just stirring panic.\"";
      }
      state.flags.stankoWarned = true;
      state.changeStanding("neighbors", 3, "Convinced Stanko and the Croatian mill hands to prepare for the 3 a.m. tow.");
      return "Stanko slams his palm flat on the oak table; the other mill hands rise immediately. \"Dawn on Day 3—then we move on the 3 a.m. high tide, Night 3! Boys, roll your bunks and check the winch. Friend, bring heavy hemp rope so we can lash the float houses together, and get Gus's skiff bailed with oars!\"";
    }
  }
};

/* --- THREE MAIN ENDINGS + SOFT-FAIL / DANGER ENDINGS --- */

window.LH.ENDINGS = {
  ending_mae: {
    id: "ending_mae",
    title: "ENDING I: THE CASH OUT",
    text:
      "You climb the gravel shoulder of the Bluff Road with Big Mae's four hundred dollars pressed warm against your ribs. " +
      "Behind you, the mist over the Deschutes flats turns pale gray as dawn breaks on Day 3.\n\n" +
      "At six o'clock sharp, two black Ford sedans nose down Fifth Avenue. Men with axes and five-gallon kerosene tins fan out along the plank walks. " +
      "A yellow tongue of fire licks up from Halvorsen's roof, then the boardinghouse, then Old Pete's leaning shack. " +
      "Thick cedar smoke rolls over the water where Uncle Gus's float house used to sit.\n\n" +
      "You turn your collar up and catch the morning stage north toward Tacoma. Your pockets are heavy, your boots are dry, and for the rest of your life you will still smell wet cedar burning whenever the tide goes out.",
    epilogueLog: [
      "EPILOGUE LOG — NOVEMBER 1931 (THE CASH OUT)",
      "- Pried up Uncle Gus's hidden rye and sold the cache to Big Mae for $400.",
      "- Left Little Hollywood on foot via the Bluff Road before the Day 3 dawn raid.",
      "- City marshals cleared and burned the Deschutes mudflat shacks at 0600 hours.",
      "- Faction outcome: Big Mae escaped clean; the neighbors lost their roofs; you walked away solvent and alone."
    ]
  },

  ending_voss: {
    id: "ending_voss",
    title: "ENDING II: CLEAN HANDS",
    text:
      "Captain Voss signs your property clearance on the hood of his patrol Ford and hands you the carbon slip. " +
      "Two deputies haul Uncle Gus's slatted whisky crate into the trunk.\n\n" +
      "Before noon, four uniformed officers march down Plank Walk A with a warrant and kick in the bottle-green door. " +
      "Big Mae comes up the bluff steps in steel cuffs, head high; as she passes you under the streetlamp she doesn't curse—just spits once into the gravel beside your boot.\n\n" +
      "At dawn on Day 3, the city clears the mudflats anyway. Your name stays spotless in the Olympia ledger, your coat stays dry, and nobody from the waterfront ever meets your eyes on Fourth Avenue again.",
    epilogueLog: [
      "EPILOGUE LOG — NOVEMBER 1931 (CLEAN HANDS)",
      "- Surrendered Uncle Gus's hidden whisky cache to Captain Voss at the Armory Edge.",
      "- Received signed police clearance and avoided all Prohibition charges.",
      "- Big Mae was arrested and her waterfront operation dismantled.",
      "- Faction outcome: Clean with the law; betrayed Big Mae; Little Hollywood cleared at dawn."
    ]
  },

  ending_tide: {
    id: "ending_tide",
    title: "ENDING III: THE 3 A.M. TIDE",
    text:
      "At three o'clock in the morning on Night 3, the spring flood peaks at twelve feet. " +
      "You raise your lit brass lantern from the bow of Gus's cedar skiff. Down the dark row of rafts, three answering flames blink back—Halvorsen's store, Old Pete's shack, and the Croatian boardinghouse.\n\n" +
      "Stanko's mill hands heave on the pike poles; the heavy hemp hawser groans taut across the cleats, and four cedar float houses swing slowly off the Deschutes flats in tandem. " +
      "You lean into the spruce oars, guiding the bow past the log booms and Budd Inlet Landing as the first pull of the ebb catches your keels.\n\n" +
      "By five-thirty you clear the harbor stakes at the mouth of Budd Inlet, drifting into silver fog beyond the Olympia city line. " +
      "When Captain Voss's marshals march down to the mudflats at six o'clock with their kerosene tins, all they find is empty blue silt, a repaired artesian spring singing cleanly in the cold, and the tracks of a whole neighborhood gone to sea.",
    epilogueLog: [
      "EPILOGUE LOG — NOVEMBER 1931 (THE 3 A.M. TIDE)",
      "- Warned Mrs. Halvorsen, Old Pete, and Stanko's mill hands ahead of the Day 3 raid.",
      "- Prepared Gus's skiff, lashed the float houses with heavy hemp hawser, and cast off at the 3:00 a.m. high tide.",
      "- Towed Little Hollywood clear past Budd Inlet Landing into open Sound outside city jurisdiction.",
      "- Faction outcome: Neighbors saved; marshals arrived at dawn to empty mudflats."
    ]
  },

  fail_arrested: {
    id: "fail_arrested",
    title: "SOFT FAIL: BOOKED AT THE ARMORY",
    text:
      "You push past Captain Voss's warning with uncovered Canadian rye right in your arms. " +
      "Two deputies step out from the brick corner of the Armory before you take three strides. Cold steel clicks around your wrists.\n\n" +
      "You spend the next forty-eight hours on a wooden bench in the Thurston County lockup listening to the rain. " +
      "Through the barred transom on Day 3 morning, you smell cedar smoke drifting up from the flats.",
    epilogueLog: [
      "POLICE BLOTTER — OLYMPIA P.D., NOVEMBER 1931",
      "- Subject apprehended at Armory Edge in possession of 6 quarts contraband Canadian rye.",
      "- Evidence impounded by Capt. Voss; Little Hollywood cleared at 0600 Day 3.",
      "- Type 'load' to restore your last save, or 'restart' to begin again."
    ]
  },

  fail_mud: {
    id: "fail_mud",
    title: "LOST TO THE DESCHUTES TIDE",
    text:
      "You push further out onto the soft eelgrass flats as the cold flood tide surges in from Budd Inlet. " +
      "Your left boot sinks past the ankle in blue clay; pulling free only drives your right knee deeper. " +
      "The icy Puget Sound swell rises waist-high, then chest-high, silent and unstoppable under the fog.\n\n" +
      "When the tide drops at nine o'clock, the gulls circle an empty flat.",
    epilogueLog: [
      "WATERFRONT LOG — DESCHUTES MUDFLATS, 1931",
      "- Ignored the rising-tide warning on the Outer Clam Flats and became mired in silt.",
      "- Type 'load' to restore your last save, or 'restart' to begin again."
    ]
  },

  fail_plank: {
    id: "fail_plank",
    title: "THROUGH THE ROTTEN SPAN",
    text:
      "You push your weight straight onto the worm-eaten fir plank despite its warning groan. " +
      "With a wet pistol-crack the timber snaps clean in two. You pitch sideways off the pilings, strike a barnacled cross-brace, and vanish into the dark cold below.\n\n" +
      "Nobody on the flats hears the splash over the wind.",
    epilogueLog: [
      "WATERFRONT LOG — PLANK WALK A, 1931",
      "- Pushed across the rotted timber span without repairing it or taking care.",
      "- Type 'load' to restore your last save, or 'restart' to begin again."
    ]
  },

  fail_raid_timeout: {
    id: "fail_raid_timeout",
    title: "DAWN ON DAY 3 — THE RAID",
    text:
      "The sky above the Capitol dome turns gray-pink at 6:00 a.m. on Day 3. " +
      "Whistles shrill along Fifth Avenue. City marshals and deputies pour down the bluff stairs with axes, prybars, and cans of kerosene.\n\n" +
      "You stood too long between the tide and the town without making your move. Within an hour, Little Hollywood is nothing but wet ash and floating timbers.",
    epilogueLog: [
      "EPILOGUE LOG — DAWN DAY 3 (TOO LATE)",
      "- The 6:00 a.m. Day 3 city raid arrived before you cashed out, dealt with Voss, or towed the floats on the 3 a.m. tide.",
      "- Type 'load' to restore your last save, or 'restart' to begin again."
    ]
  }
};

/* LITTLE HOLLYWOOD — world.js
 * 25 locations on the Deschutes tide flats, Olympia, WA, 1931.
 * Historical references carry an explicit `verify` field.
 * Every location has 3+ examinable nouns and 2+ interactions.
 */

window.LH = window.LH || {};

window.LH.WORLD = {
  // 1. Float house (home)
  float_house: {
    id: "float_house",
    name: "Uncle Gus's Float House",
    aliases: ["float house", "home", "gus", "house", "shack", "cabin"],
    zone: "float",
    verify: "Verify 1931 Olympia 'Little Hollywood' float-house construction on cedar log rafts along the Deschutes mudflats.",
    desc: function (state) {
      var tideNote = state.isAfloat()
        ? "The cedar logs under the floor creak as the tide lifts the whole cabin on a slow swell."
        : "The cabin sits dead level on the mudflats, grounded hard with a faint smell of kelp and coal oil.";
      var floorNote = state.flags.floorPried
        ? "Two pine floorboards near the stove lie pried up, exposing the dark cubby beneath."
        : "Near the stove, two pine floorboards show fresh pry scars around stubborn iron nails.";
      var chestNote = state.flags.chestUnlocked
        ? "Gus's ironbound sea chest stands open beside the bunk."
        : "Gus's ironbound sea chest sits locked beside the narrow bunk.";
      return (
        "One room of tar-papered cedar, smells of salt, pitch, and old tobacco. " +
        tideNote + " " + floorNote + " " + chestNote + " " +
        "A cast-iron stove squats in the corner, a brass porthole looks east over the flats, and a bent nail on the doorjamb holds a faded calendar. " +
        "The plank door leads east out to the catwalk."
      );
    },
    exits: {
      east: { to: "gus_porch", mode: "always", desc: "out onto Gus's catwalk and skiff mooring" },
      out: { to: "gus_porch", mode: "always", desc: "out onto Gus's catwalk and skiff mooring" }
    },
    scenery: {
      floorboards: {
        aliases: ["floor", "board", "boards", "nails", "cubby", "cache", "scars"],
        desc: function (state) {
          if (state.flags.floorPried) {
            return state.flags.whiskyTaken
              ? "The pried-up floorboards reveal an empty tar-papered cubby between the cedar float logs."
              : "Between the cedar float logs sits a slatted wooden crate of Canadian rye whisky, six quarts packed in straw.";
          }
          return "Two thick fir floorboards nailed down harder than the rest. Gus's old jimmy-marks dent the edges—too tight for bare fingers. You'd need a crowbar.";
        }
      },
      stove: {
        aliases: ["iron stove", "cast-iron stove", "flue", "stovepipe"],
        desc: "A squat cast-iron ship's stove, cold ash in the grate. A bent tin kettle rests on the back burner."
      },
      bunk: {
        aliases: ["bed", "blanket", "blankets", "mattress"],
        desc: "A built-in cedar bunk with a gray wool blanket folded square the way old mill hands fold them."
      },
      chest: {
        aliases: ["sea chest", "ironbound chest", "trunk", "lock", "padlock"],
        desc: function (state) {
          if (state.flags.chestUnlocked) {
            return "Uncle Gus's cedar sea chest, lid propped open. Smells of camphor and old receipts.";
          }
          return "A heavy cedar sea chest banded in rusted iron, secured by a small brass padlock.";
        }
      },
      porthole: {
        aliases: ["window", "glass"],
        desc: function (state) {
          return state.isAfloat()
            ? "Through the salt-streaked porthole you see dark tidewater lapping past the neighboring floats toward Budd Inlet."
            : "Through the salt-streaked porthole the mudflats stretch gray and gleaming, plank walks snaking between leaning shacks.";
        }
      },
      calendar: {
        aliases: ["nail", "doorjamb", "wall", "paper"],
        desc: "A 1931 Olympia hardware calendar. Someone circled the third day in red grease pencil and wrote: 'DAWN — CITY MARSHALS.'"
      },
      door: {
        aliases: ["plank door"],
        desc: "A swollen fir door with a leather pull-strap, opening east onto the catwalk."
      }
    }
  },

  // 2. Skiff mooring / Gus's catwalk
  gus_porch: {
    id: "gus_porch",
    name: "Gus's Catwalk & Skiff Mooring",
    aliases: ["porch", "catwalk", "mooring", "skiff mooring", "dock"],
    zone: "float",
    verify: "Verify cedar float-log construction and small cedar rowing skiffs used by Deschutes mudflat dwellers in 1931.",
    desc: function (state) {
      var waterNote = state.isAfloat()
        ? "Black bay water laps right under the catwalk stringers, rocking the float logs."
        : "Below the catwalk, the massive cedar float logs rest half-buried in shining blue-gray mud.";
      var lashNote = state.flags.housesLashed
        ? "A stout hemp tow-hawser runs taut from Gus's cleat toward the neighbors' floats."
        : "Heavy iron cleats bolt into the front float log, waiting for a tow line.";
      return (
        "A narrow plank catwalk wraps the front of Gus's cabin. " + waterNote + " " + lashNote + " " +
        "The cabin door is west. Plank Walk A runs south toward the shantytown; at high tide the open Deschutes channel lies east and the log booms lie north."
      );
    },
    exits: {
      west: { to: "float_house", mode: "always", desc: "inside Uncle Gus's float house" },
      in: { to: "float_house", mode: "always", desc: "inside Uncle Gus's float house" },
      south: { to: "plank_walk_a", mode: "skiff_or_walk", desc: "south along Plank Walk A" },
      east: { to: "channel_mid", mode: "water_high", desc: "east out into the Deschutes channel" },
      north: { to: "log_booms", mode: "water_high", desc: "north toward the log booms" }
    },
    scenery: {
      cleats: {
        aliases: ["cleat", "iron cleats", "bollard", "ring"],
        desc: function (state) {
          return state.flags.housesLashed
            ? "The iron cleats hold a double-hitched hemp hawser linking the float houses for towing."
            : "Bolted deep into the cedar float logs. Strong enough to lash two or three float houses in tandem.";
        }
      },
      logs: {
        aliases: ["float logs", "cedar logs", "raft", "stringers"],
        desc: "Four massive old-growth cedar logs, waterlogged and bearded with mussels, keeping Gus's cabin above the bay."
      },
      catwalk: {
        aliases: ["planks", "porch", "deck"],
        desc: "Weathered rough-sawn planks nailed across the float logs, slick with morning mist."
      },
      mud: {
        aliases: ["flats", "water", "bay"],
        desc: function (state) {
          return state.isAfloat()
            ? "Cold green-black Puget Sound water, six feet deep under the catwalk."
            : "Slick Deschutes river silt, pocked with clam holes and gull tracks.";
        }
      }
    }
  },

  // 3. Plank Walk A
  plank_walk_a: {
    id: "plank_walk_a",
    name: "Plank Walk A (North Run)",
    aliases: ["plank walk a", "walk a", "north run"],
    zone: "plank",
    verify: "Verify elevated creosote-piling plank walkways linking float shacks across the Olympia tide flats in the 1930s.",
    desc: function (state) {
      var plankNote = state.flags.rottenPlankFixed
        ? "A fresh timber plank now bridges the soft spot in the middle of the walk."
        : "Halfway down the span, a bleached rotten plank sags dangerously over the drop.";
      var tideNote = state.isAfloat()
        ? "The high tide washes over the pilings; only a skiff can pass here now."
        : "Creosote pilings hold the narrow boardwalk three feet above the glistening mud.";
      return (
        "The main timber walkway threading north-south through Little Hollywood. " + tideNote + " " + plankNote + " " +
        "Barnacles crust the lower posts, and an iron lantern hook juts from a corner piling. " +
        "Gus's mooring is north, Halvorsen's grocer float is east, Plank Walk B continues south, and Driftwood Spit stretches west across the low-tide flats."
      );
    },
    exits: {
      north: { to: "gus_porch", mode: "skiff_or_walk", desc: "north to Gus's catwalk and mooring" },
      east: { to: "grocers_float", mode: "skiff_or_walk", desc: "east to Halvorsen's grocer float" },
      south: { to: "plank_walk_b", mode: "walk_low", desc: "south along Plank Walk B" },
      west: { to: "driftwood_spit", mode: "flats_low", desc: "west onto Driftwood Spit" }
    },
    scenery: {
      rotten_plank: {
        aliases: ["rotten plank", "sagging plank", "soft spot", "board", "walkway"],
        desc: function (state) {
          return state.flags.rottenPlankFixed
            ? "You laid a solid timber across the rotted span. It holds your weight without a groan."
            : "Gray, punky fir eaten hollow by shipworms. Stepping on it without care—or without a spare plank—could pitch you into the mud or tide.";
        }
      },
      pilings: {
        aliases: ["piling", "posts", "creosote", "barnacles"],
        desc: "Tar-blackened pilings ringed with sharp white barnacles marking the high-tide line."
      },
      hook: {
        aliases: ["lantern hook", "iron hook"],
        desc: "A rusted iron hook driven into the corner piling where neighbors hang a storm lantern on foggy nights."
      }
    }
  },

  // 4. Plank Walk B
  plank_walk_b: {
    id: "plank_walk_b",
    name: "Plank Walk B (Middle Crossing)",
    aliases: ["plank walk b", "walk b", "crossing"],
    zone: "plank",
    desc: function (state) {
      var tideNote = state.isAfloat()
        ? "The tide covers the lower cross-braces; dark ripples slap against the stringers."
        : "Tarred planks creak above a shallow drainage ditch cutting through the mud.";
      return (
        "A four-way plank junction at the heart of the flats. " + tideNote + " " +
        "A hemp wash line sags between two posts, and an overturned herring crate sits by the rail. " +
        "Plank Walk A runs north, Plank Walk C continues south, Old Pete's leaning shack is east, and the artesian springs lie west on the flats."
      );
    },
    exits: {
      north: { to: "plank_walk_a", mode: "walk_low", desc: "north to Plank Walk A" },
      south: { to: "plank_walk_c", mode: "walk_low", desc: "south to Plank Walk C" },
      east: { to: "drifters_shack", mode: "skiff_or_walk", desc: "east to Old Pete's leaning shack" },
      west: { to: "the_springs", mode: "flats_low", desc: "west to the artesian springs" }
    },
    scenery: {
      ditch: {
        aliases: ["drainage ditch", "channel", "mud", "water"],
        desc: "A shallow trickle of brackish runoff winding toward the bay, littered with rusted tin lids and clam shells."
      },
      washline: {
        aliases: ["wash line", "line", "clothesline", "posts"],
        desc: "A frayed cotton line strung between posts, empty today—word of the raid has everyone keeping their gear indoors."
      },
      crate: {
        aliases: ["herring crate", "box", "rail"],
        desc: "A salt-bleached wooden herring crate stamped 'OLYMPIA PACKING CO.' Empty save for a dry cedar shim."
      }
    }
  },

  // 5. Plank Walk C
  plank_walk_c: {
    id: "plank_walk_c",
    name: "Plank Walk C (Mill Spur)",
    aliases: ["plank walk c", "walk c", "mill spur"],
    zone: "plank",
    desc: function (state) {
      var gapNote = state.flags.walkCGapFixed
        ? "Your timber plank spans the eight-foot break east toward the Croatian boardinghouse."
        : "An eight-foot gap yawns where a spring storm tore out the stringers east toward the boardinghouse—too wide to jump.";
      return (
        "The southern timber walk, dusted with cedar sawdust blown down from the veneer mill. " +
        gapNote + " Bent iron spikes poke from the shattered timber ends. " +
        "Plank Walk B is north, the rag-pickers' drying shed is west, the boardinghouse is east, and the muddy ramp south leads under the Fifth Avenue trestle."
      );
    },
    exits: {
      north: { to: "plank_walk_b", mode: "walk_low", desc: "north to Plank Walk B" },
      east: { to: "boardinghouse", mode: "plank_gap", desc: "east to the Croatian mill hands' boardinghouse" },
      west: { to: "wash_shack", mode: "walk_low", desc: "west to the rag-pickers' drying shed" },
      south: { to: "trestle_under", mode: "always", desc: "south under the Fifth Avenue trestle" }
    },
    scenery: {
      gap: {
        aliases: ["break", "hole", "stringers", "span"],
        desc: function (state) {
          return state.flags.walkCGapFixed
            ? "The sturdy mill plank you laid across the break makes a solid footbridge to the boardinghouse."
            : "Eight feet of empty air over sucking mud (or black tidewater). Laying a stout plank across it would restore the crossing.";
        }
      },
      sawdust: {
        aliases: ["dust", "cedar sawdust", "drift"],
        desc: "Wet red-brown cedar sawdust drifted in the corners of the planks, smelling sharp and sweet."
      },
      spikes: {
        aliases: ["iron spikes", "nails", "timbers"],
        desc: "Heavy six-inch railroad spikes bent sideways where the tide tore the old walk loose."
      }
    }
  },

  // 6. Grocer's float
  grocers_float: {
    id: "grocers_float",
    name: "Halvorsen's Grocer Float",
    aliases: ["grocer", "grocer's float", "grocers float", "halvorsen", "store", "shop"],
    zone: "float",
    verify: "Verify whether small floating commissaries/groceries operated on Olympia's Deschutes mudflats around 1931.",
    desc: function (state) {
      var tideNote = state.isAfloat()
        ? "Glass jars clink softly on the pine shelves as the store rocks on the flood tide."
        : "The store sits settled in the mud with a slight list to port.";
      return (
        "A wide float shack fitted out as a neighborhood provisioner's, smelling of coffee beans, salt cod, and kerosene. " +
        tideNote + " A scarred cedar counter holds a brass hanging scale and a chalked credit board. " +
        "Plank Walk A lies west, Big Mae's float is north, and Old Pete's shack is south."
      );
    },
    exits: {
      west: { to: "plank_walk_a", mode: "skiff_or_walk", desc: "west onto Plank Walk A" },
      north: { to: "maes_float", mode: "skiff_or_walk", desc: "north toward Big Mae's float" },
      south: { to: "drifters_shack", mode: "skiff_or_walk", desc: "south to Old Pete's leaning shack" }
    },
    scenery: {
      counter: {
        aliases: ["cedar counter", "shelves", "goods", "canned goods", "jars"],
        desc: "Tins of condensed milk, salt pork, hardtack, and matches—all packed light in case the marshals come with axes."
      },
      scale: {
        aliases: ["brass scale", "hanging scale"],
        desc: "A tarnished brass hanging scale, its pan swaying slightly with every footstep."
      },
      board: {
        aliases: ["credit board", "chalkboard", "slate", "ledger board"],
        desc: "A slate hung behind the counter listing small debts in chalk: 'Gus — $2.40 (settled)', 'Pete — 85c', 'Stanko — paid'."
      }
    }
  },

  // 7. Mae's float
  maes_float: {
    id: "maes_float",
    name: "Big Mae's Float (The Green Door)",
    aliases: ["mae", "mae's float", "maes float", "green door", "speakeasy"],
    zone: "float",
    verify: "Verify Prohibition-era bootleg / speakeasy activity along Olympia's Budd Inlet waterfront in 1931.",
    desc: function (state) {
      var tideNote = state.isAfloat()
        ? "A dark launch could slip right up to her back porch on this high water."
        : "Her heavy timber raft sits square in the mud, far cleaner and better-caulked than any other shack on the flats.";
      return (
        "The stoutest float house in Little Hollywood, marked by a fresh-painted green door and an iron-barred shutter. " +
        tideNote + " Inside, a coal-oil lamp warms a poker table, stacked oak barrels, and a bolted steel cashbox behind a plank bar. " +
        "Halvorsen's grocer float is south, and at high tide the open channel lies west."
      );
    },
    exits: {
      south: { to: "grocers_float", mode: "skiff_or_walk", desc: "south to Halvorsen's grocer float" },
      west: { to: "channel_mid", mode: "water_high", desc: "west into the Deschutes channel" }
    },
    scenery: {
      green_door: {
        aliases: ["door", "green door", "shutter", "window", "bars"],
        desc: "Thick fir painted bottle-green, with a sliding brass peephole and iron bars across the side shutter."
      },
      barrels: {
        aliases: ["oak barrels", "kegs", "whisky barrels", "bar"],
        desc: "Charred oak kegs stenciled 'PICKLES — TACOMA.' They slosh much too thin for brine."
      },
      cashbox: {
        aliases: ["box", "steel cashbox", "safe", "table"],
        desc: "A heavy riveted cashbox chained to the bar leg. Big Mae keeps the key on a cord around her neck."
      }
    }
  },

  // 8. Shack with a sick drifter
  drifters_shack: {
    id: "drifters_shack",
    name: "Old Pete's Leaning Shack",
    aliases: ["drifter", "drifter's shack", "pete", "pete's shack", "shack", "leaning shack"],
    zone: "float",
    desc: function (state) {
      var warmNote = state.flags.peteWarmed
        ? "A blue flame from a Sterno tin glows inside the little tin stove, taking the bone-chill off the room."
        : "The little tin stove is dead cold; frost-damp air seeps through every knothole.";
      return (
        "A crooked patchwork of driftwood and flattened kerosene tins built on two narrow cedar logs. " +
        warmNote + " A damp canvas cot occupies the back wall beside a stack of empty bean tins. " +
        "Plank Walk B is west, Halvorsen's grocer float is north, and the Croatian boardinghouse is south."
      );
    },
    exits: {
      west: { to: "plank_walk_b", mode: "skiff_or_walk", desc: "west onto Plank Walk B" },
      north: { to: "grocers_float", mode: "skiff_or_walk", desc: "north to Halvorsen's grocer float" },
      south: { to: "boardinghouse", mode: "skiff_or_walk", desc: "south to the Croatian boardinghouse" }
    },
    scenery: {
      tin_stove: {
        aliases: ["stove", "tin stove", "burner"],
        desc: function (state) {
          return state.flags.peteWarmed
            ? "A homemade stove fashioned from a five-gallon oil tin. A tin of canned heat burns steadily inside."
            : "A homemade stove hammered from a five-gallon oil tin. No wood left—a tin of canned heat would warm it fast.";
        }
      },
      cot: {
        aliases: ["canvas cot", "bed", "blanket"],
        desc: "A sagging army-surplus cot draped with a patched slicker to keep off the roof drips."
      },
      tins: {
        aliases: ["empty tins", "bean tins", "cans", "kerosene tins"],
        desc: "Rusted bean and soup tins lined along the sill to catch rainwater."
      }
    }
  },

  // 9. Croatian mill hands' boardinghouse
  boardinghouse: {
    id: "boardinghouse",
    name: "Croatian Mill Hands' Boardinghouse",
    aliases: ["boardinghouse", "croatian", "mill hands", "stanko", "stanko's"],
    zone: "float",
    verify: "Verify Croatian/South Slavic immigrant lumber and veneer mill workers residing near Olympia's waterfront in 1931.",
    desc: function (state) {
      var readyNote = state.flags.stankoWarned
        ? "Men are rolling their bedrolls tight and coiling spare lines by the doorway, ready for the 3 a.m. tide."
        : "Four off-shift mill hands sit around a long oak table, spooning fish stew from a blackened kettle.";
      return (
        "A long, low double-raft house smelling of garlic, wet wool, and cedar pitch. " +
        readyNote + " Tiered cedar bunks line both walls, union handbills are tacked by the door, and a rusted hand-winch bolts to the stern timber. " +
        "Old Pete's shack is north, Plank Walk C is west, and a low plank run leads south toward the Fifth Avenue trestle."
      );
    },
    exits: {
      west: { to: "plank_walk_c", mode: "plank_gap", desc: "west across Plank Walk C" },
      north: { to: "drifters_shack", mode: "skiff_or_walk", desc: "north to Old Pete's shack" },
      south: { to: "trestle_under", mode: "walk_low", desc: "south under the Fifth Avenue trestle" }
    },
    scenery: {
      table: {
        aliases: ["oak table", "kettle", "soup kettle", "stew", "bunks", "cedar bunks"],
        desc: "A scarred oak table ringed with enamel mugs and a cast-iron kettle of rockfish stew. Twelve narrow bunks line the cedar walls."
      },
      handbills: {
        aliases: ["bills", "posters", "union", "paper", "notices"],
        desc: "Damp newsprint handbills calling for an eight-hour shift at the veneer plant, corners curled by bay mist."
      },
      winch: {
        aliases: ["hand-winch", "capstan", "stern timber"],
        desc: "A salvaged logging hand-winch bolted to the heavy stern log—ideal for snubbing a tow line when the tide lifts."
      }
    }
  },

  // 10. Rag-Pickers' Drying Shed
  wash_shack: {
    id: "wash_shack",
    name: "Rag-Pickers' Drying Shed",
    aliases: ["shed", "drying shed", "wash shack", "rag-pickers"],
    zone: "plank",
    desc: function () {
      return (
        "An open-sided cedar shed leaning against three creosote pilings, used by the flats folks to dry nets and salvage. " +
        "A wooden drying rack sags under tarred twine, a salvage pile clutters the back corner, and a rainwater barrel sits beneath the eaves. " +
        "Plank Walk C is east; at low tide you can step north onto the mud toward the artesian springs."
      );
    },
    exits: {
      east: { to: "plank_walk_c", mode: "walk_low", desc: "east to Plank Walk C" },
      north: { to: "the_springs", mode: "flats_low", desc: "north across the flats to the artesian springs" }
    },
    scenery: {
      rack: {
        aliases: ["drying rack", "nets", "twine", "eaves"],
        desc: "A rough cedar rack draped with patched gillnets smelling strongly of tar and dried kelp."
      },
      salvage: {
        aliases: ["salvage pile", "pile", "junk", "corner"],
        desc: "Sorting bins of bottle corks, bent copper wire, and tarred canvas scraps—nothing wasted in 1931."
      },
      barrel: {
        aliases: ["rainwater barrel", "rain barrel", "water"],
        desc: "A green-scummed cedar barrel half-full of stagnant rainwater. Too foul for a sick man to drink."
      }
    }
  },

  // 11. The Springs
  the_springs: {
    id: "the_springs",
    name: "The Artesian Springs",
    aliases: ["springs", "the springs", "artesian springs", "spring", "well"],
    zone: "flats",
    verify: "Verify artesian freshwater springs bubbling along Olympia's Deschutes mudflats and downtown waterfront (historically famous in Olympia).",
    desc: function (state) {
      var pipeNote = state.flags.springFixed
        ? "Clear, cold artesian water gushes cleanly from the repaired iron standpipe into a gravel basin."
        : "A rusted iron standpipe juts from the mud, its brass union split clean through so the cold freshwater wastes into the silt.";
      return (
        "A low gravel bar exposed when the tide drops, where sweet underground water pushes up through the salt mud. " +
        pipeNote + " Smooth river cobbles ring the mud basin. " +
        "Plank Walk B is east, the drying shed is south, Driftwood Spit is north, and the Outer Clam Flats stretch west."
      );
    },
    exits: {
      east: { to: "plank_walk_b", mode: "flats_low", desc: "east to Plank Walk B" },
      south: { to: "wash_shack", mode: "flats_low", desc: "south to the drying shed" },
      north: { to: "driftwood_spit", mode: "flats_low", desc: "north to Driftwood Spit" },
      west: { to: "clam_flats", mode: "flats_low", desc: "west out onto the Outer Clam Flats" }
    },
    scenery: {
      standpipe: {
        aliases: ["pipe", "iron standpipe", "union", "brass union", "spring", "water"],
        desc: function (state) {
          return state.flags.springFixed
            ? "Your replacement pipe and brass fitting hold tight; a steady thumb-thick stream of cold artesian water pours clean."
            : "An inch-and-a-half iron pipe driven into the artesian vein. The threaded elbow is cracked open—a spare pipe and brass fitting would mend it.";
        }
      },
      basin: {
        aliases: ["mud basin", "gravel bar", "silt"],
        desc: "Clean river gravel scoured free of bay silt by the constant upwelling of freshwater."
      },
      cobbles: {
        aliases: ["river cobbles", "stones", "rocks", "gravel"],
        desc: "Smooth basalt river cobbles washed down the Deschutes, cold and wet under your boots."
      }
    }
  },

  // 12. Outer Clam Flats (Mud-suck tide danger!)
  clam_flats: {
    id: "clam_flats",
    name: "Outer Clam Flats",
    aliases: ["clam flats", "flats", "mudflats", "clams"],
    zone: "flats",
    desc: function (state) {
      var tideNote = state.tideLevel >= 4
        ? "Thin tongues of cold bay water are already creeping through the eelgrass channels; the mud pulls heavily at your boots."
        : "Wide gray mudflats gleam under the sky, dimpled with spurting butter-clam holes and ribbons of wet eelgrass.";
      return (
        "Far out past the shacks, where the Deschutes silt turns deep and boot-sucking. " +
        tideNote + " A half-buried rubber boot sticks up from a silt pocket, and wheeling gulls cry overhead. " +
        "The artesian springs are east, Driftwood Spit is north, and the beached hull of an abandoned sternwheeler lies west."
      );
    },
    exits: {
      east: { to: "the_springs", mode: "flats_low", desc: "east back toward the artesian springs" },
      north: { to: "driftwood_spit", mode: "flats_low", desc: "north to Driftwood Spit" },
      west: { to: "abandoned_hulk", mode: "flats_low", desc: "west to the abandoned hulk" }
    },
    scenery: {
      clams: {
        aliases: ["butter clams", "clam holes", "shells", "holes"],
        desc: "Little jets of saltwater squirt from the mud as butter clams pull down at your footsteps. Good eating if you had a shovel."
      },
      eelgrass: {
        aliases: ["grass", "channels", "mud", "silt"],
        desc: "Slick green ribbons of eelgrass lying flat toward the channel. When the tide turns, these flats flood fast and soft."
      },
      boot: {
        aliases: ["rubber boot", "sunken boot"],
        desc: "A cracked fisherman's gumboot sucked knee-deep into the blue clay—a quiet warning about lingering out here on a rising tide."
      }
    }
  },

  // 13. Driftwood Spit
  driftwood_spit: {
    id: "driftwood_spit",
    name: "Driftwood Spit",
    aliases: ["driftwood", "spit", "driftwood spit"],
    zone: "flats",
    desc: function () {
      return (
        "A tangled ridge of silver-bleached cedar and fir trunks washed down the Deschutes and piled on a firm gravel spit. " +
        "Gull nests tuck into the hollow roots, and rusted boom-chain links hang from a splintered piling. " +
        "Plank Walk A is east, the artesian springs are south, the abandoned hulk looms west, and at high tide the log booms float north."
      );
    },
    exits: {
      east: { to: "plank_walk_a", mode: "flats_low", desc: "east to Plank Walk A" },
      south: { to: "the_springs", mode: "flats_low", desc: "south to the artesian springs" },
      west: { to: "abandoned_hulk", mode: "flats_low", desc: "west to the abandoned hulk" },
      north: { to: "log_booms", mode: "water_high", desc: "north to the log booms" }
    },
    scenery: {
      timbers: {
        aliases: ["driftwood", "logs", "cedar", "roots", "trunks"],
        desc: "Sun-bleached fir and cedar trunks jammed tight together like jackstraws, offering firmer footing than the surrounding mud."
      },
      nests: {
        aliases: ["gull nests", "gulls", "birds"],
        desc: "Scraps of dried eelgrass and twigs tucked high in the driftwood. A herring gull eyes you sideways from a stub."
      },
      chain: {
        aliases: ["boom-chain", "links", "piling"],
        desc: "Thick iron logging chains welded solid with rust—too heavy to haul away."
      }
    }
  },

  // 14. Abandoned Hulk
  abandoned_hulk: {
    id: "abandoned_hulk",
    name: "The Abandoned Hulk (Sternwheeler Cowlitz)",
    aliases: ["hulk", "abandoned hulk", "cowlitz", "sternwheeler", "ship", "wreck"],
    zone: "flats",
    verify: "Verify decommissioned Puget Sound mosquito-fleet sternwheelers beached or rotting along Olympia's mudflats in the early 1930s. ('Cowlitz' here is an invented wreck name for this flats location.)",
    desc: function (state) {
      var tideNote = state.isAfloat()
        ? "Dark bay water sloshes against her broken paddlewheel ribs."
        : "Her flat bottom sits canted at fifteen degrees in the blue mud, green moss bearding the hull.";
      return (
        "The stripped wooden hull of an old Puget Sound sternwheeler, left to rot on the outer flats. " +
        tideNote + " The rotted main deck tilts under your boots, a stripped brass binnacle stands on the foredeck, and an open bilge hatch drops down into the dark engine room. " +
        "Driftwood Spit is east, the clam flats are southeast, and at high tide you can row north to the log booms."
      );
    },
    exits: {
      east: { to: "driftwood_spit", mode: "flats_low", desc: "east to Driftwood Spit" },
      southeast: { to: "clam_flats", mode: "flats_low", desc: "southeast onto the Outer Clam Flats" },
      down: { to: "hulk_hold", mode: "always", desc: "down through the hatch into the engine room" },
      in: { to: "hulk_hold", mode: "always", desc: "down through the hatch into the engine room" },
      north: { to: "log_booms", mode: "water_high", desc: "north toward the log booms" }
    },
    scenery: {
      deck: {
        aliases: ["main deck", "hull", "paddlewheel", "ribs"],
        desc: "Sun-split fir decking slick with gull droppings. The stern paddlewheel is half-gone, stripped years ago for stovewood."
      },
      binnacle: {
        aliases: ["brass binnacle", "foredeck", "helm"],
        desc: "An empty brass compass housing bolted to the foredeck—whoever salvaged the ship took the compass years ago, probably traded it up at Halvorsen's."
      },
      hatch: {
        aliases: ["bilge hatch", "ladder", "opening"],
        desc: "A square iron-rimmed hatch with a slick wooden ladder descending into the pitch-black engine room."
      }
    }
  },

  // 15. Hulk Engine Room (Dark without lit lantern!)
  hulk_hold: {
    id: "hulk_hold",
    name: "Hulk Engine Room",
    aliases: ["engine room", "hold", "hulk hold", "below"],
    zone: "flats",
    dark: true,
    desc: function (state) {
      if (!state.hasLight()) {
        return (
          "Pitch black below decks. Cold bilge water drips somewhere in the gloom, and rusted iron shapes wait to bark your shins. " +
          "You can't make out a thing without a lit lantern. The ladder leads back up to the deck."
        );
      }
      var lockerNote = state.flags.valveBoxOpened
        ? "The iron valve box on the bulkhead hangs open."
        : "A rusted iron valve box is latched shut on the starboard bulkhead.";
      return (
        "Your lantern throws warm amber shadows across a gutted steam engine room. " +
        "A flaking iron boiler squats amidships, copper and brass fittings glint along the manifold, and " +
        lockerNote + " Cold bilge water laps between the ribs underfoot. The wooden ladder leads up to the deck."
      );
    },
    exits: {
      up: { to: "abandoned_hulk", mode: "always", desc: "up the ladder to the sternwheeler's deck" },
      out: { to: "abandoned_hulk", mode: "always", desc: "up the ladder to the sternwheeler's deck" }
    },
    scenery: {
      boiler: {
        aliases: ["iron boiler", "steam engine", "manifold"],
        desc: "A cold cylindrical steam boiler crusted in orange scale, stripped of its gauges."
      },
      valve_box: {
        aliases: ["valve box", "box", "bulkhead", "latch"],
        desc: function (state) {
          if (!state.hasLight()) return "Too dark to see what you're touching.";
          return state.flags.valveBoxOpened
            ? "The iron valve box stands open, empty save for oily rags."
            : "A small hinged iron valve box on the bulkhead, stuck tight with rust. You could open or pry it.";
        }
      },
      bilge: {
        aliases: ["bilge water", "water", "ribs", "ladder"],
        desc: "Black, oil-filmed bilge water sloshing quietly between the oak hull frames."
      }
    }
  },

  // 16. Under the Fifth Avenue Trestle
  trestle_under: {
    id: "trestle_under",
    name: "Under the Fifth Avenue Trestle",
    aliases: ["under trestle", "trestle under", "bents", "under bridge"],
    zone: "upland",
    verify: "Verify the Fifth Avenue wooden trestle / bridge crossing the Deschutes estuary in Olympia in 1931.",
    desc: function () {
      return (
        "A shadowed cathedral of massive creosote timber bents supporting the Fifth Avenue roadway overhead. " +
        "Dark tide-line stains band every piling, and faint white chalk marks—smugglers' drop signs—scribble across the center post. " +
        "Plank Walk C runs north, a muddy spur heads northeast to the boardinghouse, Sweeney's salvage crib tucks west against the bluff, and rough timber stairs climb up to the roadway."
      );
    },
    exits: {
      north: { to: "plank_walk_c", mode: "always", desc: "north onto Plank Walk C" },
      northeast: { to: "boardinghouse", mode: "walk_low", desc: "northeast to the Croatian boardinghouse" },
      west: { to: "junk_crib", mode: "always", desc: "west to Sweeney's salvage crib" },
      up: { to: "trestle_top", mode: "always", desc: "up the timber stairs to the Fifth Avenue trestle" }
    },
    scenery: {
      bents: {
        aliases: ["pilings", "timbers", "posts", "stains", "tide-line"],
        desc: "Forest-thick Douglas fir pilings soaked in creosote, banded at shoulder height by kelp and high-water salt."
      },
      chalk: {
        aliases: ["chalk marks", "marks", "signs", "center post"],
        desc: "Three slanted white chalk strokes and a wavy line: '3 AM FLOOD — DROP CLEAR.' Big Mae's runners use this trestle to watch the tide."
      },
      stairs: {
        aliases: ["timber stairs", "ladder", "bank"],
        desc: "Steep, splintered plank steps nailed up the bluff bank to the Fifth Avenue trestle roadway."
      }
    }
  },

  // 17. The Log Booms
  log_booms: {
    id: "log_booms",
    name: "The Log Booms",
    aliases: ["log booms", "booms", "rafts", "logs"],
    zone: "water",
    verify: "Verify Douglas fir log booms rafted in Budd Inlet / Deschutes estuary for Olympia lumber and veneer mills in 1931.",
    desc: function () {
      return (
        "Acres of wet Douglas fir sawlogs chained together in floating rafts, rolling sluggishly on the harbor swell. " +
        "Iron boom chains clank as the logs grind bark against bark, and a pair of forgotten pike poles rest across a boom stick. " +
        "From here you can row south to Gus's mooring, west to the abandoned hulk, or east to Budd Inlet Landing."
      );
    },
    exits: {
      south: { to: "gus_porch", mode: "water_high", desc: "south to Gus's catwalk and mooring" },
      west: { to: "abandoned_hulk", mode: "water_high", desc: "west to the abandoned hulk" },
      east: { to: "budd_inlet_landing", mode: "water_high", desc: "east to Budd Inlet Landing" }
    },
    scenery: {
      rafts: {
        aliases: ["logs", "fir", "sawlogs", "boom stick"],
        desc: "Massive peeler logs bound for the veneer plant, slick with green moss and smelling of fresh pitch."
      },
      chains: {
        aliases: ["boom chains", "iron chains"],
        desc: "Heavy toggle-chains linking the outer boom sticks together so the raft holds against the ebb."
      },
      pike_poles: {
        aliases: ["pike poles", "poles"],
        desc: "Long ash poles tipped with iron spikes, used by boom-men to herd logs into the mill slip."
      }
    }
  },

  // 18. Deschutes Channel (Mid-Water)
  channel_mid: {
    id: "channel_mid",
    name: "Deschutes Channel",
    aliases: ["channel", "deschutes channel", "mid-water", "water"],
    zone: "water",
    desc: function (state) {
      var timeNote = state.isNight()
        ? "Lantern light from the shantytown shimmers like spilled oil across the black swell."
        : "Gray Puget Sound water slides past the red-painted channel marker, carrying chips of cedar bark.";
      return (
        "Deep tidal water between the float houses and the harbor. " + timeNote + " " +
        "Barnacled dolphin pilings mark the bend where the Deschutes meets Budd Inlet. " +
        "Gus's mooring is west, Big Mae's float is east, and Budd Inlet Landing lies north."
      );
    },
    exits: {
      west: { to: "gus_porch", mode: "water_high", desc: "west to Gus's catwalk and mooring" },
      east: { to: "maes_float", mode: "water_high", desc: "east to Big Mae's float" },
      north: { to: "budd_inlet_landing", mode: "water_high", desc: "north to Budd Inlet Landing" }
    },
    scenery: {
      marker: {
        aliases: ["channel marker", "pilings", "dolphin", "dolphins"],
        desc: "Three creosote pilings bound at the top with rusted cable, leaning slightly toward the inlet."
      },
      current: {
        aliases: ["water", "swell", "bark", "channel"],
        desc: function (state) {
          return state.tideDir > 0
            ? "The flood tide pushes steadily southward into the flats, lifting everything that can float."
            : "The ebb tide draws steadily north toward Budd Inlet—good pull if you're towing float houses out.";
        }
      },
      shacks: {
        aliases: ["shantytown", "lantern light", "lights", "roofs"],
        desc: "From the water, the cluster of tar-paper float houses looks fragile and small beneath the dark timber bluff."
      }
    }
  },

  // 19. Budd Inlet Landing
  budd_inlet_landing: {
    id: "budd_inlet_landing",
    name: "Budd Inlet Landing",
    aliases: ["landing", "budd inlet", "budd inlet landing", "slip"],
    zone: "water",
    verify: "Verify Budd Inlet public/workboat landing proximity to Olympia veneer mills and Deschutes mouth in 1931.",
    desc: function (state) {
      var tideStr = state.isAfloat()
        ? "Water laps high up the numbered tide gauge board nailed to the slip piling."
        : "The timber slip stands dry above a glistening apron of gravel and kelp.";
      return (
        "A weathered workboat landing looking straight out into the gray expanse of Budd Inlet. " +
        tideStr + " Heavy mooring bitts line the apron, and gulls roost along the cap log. " +
        "Timber stairs climb east to the Olympia Veneer & Mill Gate. At high tide you can row west to the log booms, south into the Deschutes channel, or north toward the mouth of Budd Inlet."
      );
    },
    exits: {
      east: { to: "mill_yard_gate", mode: "always", desc: "east up the stairs to the Mill Gate" },
      west: { to: "log_booms", mode: "water_high", desc: "west toward the log booms" },
      south: { to: "channel_mid", mode: "water_high", desc: "south into the Deschutes channel" },
      north: { to: "east_bay_mouth", mode: "water_high", desc: "north toward the mouth of Budd Inlet" }
    },
    scenery: {
      gauge: {
        aliases: ["tide gauge", "gauge board", "board", "piling"],
        desc: function (state) {
          return "A whitewashed foot-rule nailed to the piling. Right now the waterline reads " + state.tideLevel + " feet (" + state.tidePhaseLabel() + ").";
        }
      },
      bitts: {
        aliases: ["mooring bitts", "cap log", "slip", "apron"],
        desc: "Heavy cast-iron mooring bitts worn shiny by tugboat hawsers."
      },
      harbor: {
        aliases: ["inlet", "budd inlet", "view", "gulls"],
        desc: "Dark evergreens frame both shores of Budd Inlet, stretching north toward open Puget Sound."
      }
    }
  },

  // 20. Mouth of Budd Inlet (Escape destination on Night 3 3 a.m. tide!)
  east_bay_mouth: {
    id: "east_bay_mouth",
    name: "Mouth of Budd Inlet",
    aliases: ["mouth", "inlet mouth", "open sound", "puget sound", "bay"],
    zone: "water",
    desc: function (state) {
      var fogNote = state.isNight()
        ? "A low silver fog bank hugs the water, broken only by the slow blink of a distant harbor light."
        : "Choppy green Sound water rolls past the point, smelling sharp of open salt and cedar.";
      return (
        "Deep water clear of the Olympia city line and the Deschutes mudflats. " + fogNote + " " +
        "Out here, past the harbor stakes, the city marshals have no jurisdiction over a floating house. " +
        "Budd Inlet Landing lies back to the south."
      );
    },
    exits: {
      south: { to: "budd_inlet_landing", mode: "water_high", desc: "south back to Budd Inlet Landing" }
    },
    scenery: {
      light: {
        aliases: ["harbor light", "lighthouse", "blink", "stakes"],
        desc: "A steady white channel beacon blinking every four seconds out toward the main Sound."
      },
      fog: {
        aliases: ["fog bank", "water", "sound", "point"],
        desc: "Cool sea mist drifting off the Sound—good cover for a midnight tow."
      },
      shore: {
        aliases: ["evergreens", "city", "olympia"],
        desc: "Back to the south, the low yellow lamps of Olympia hug the bluff above Little Hollywood."
      }
    }
  },

  // 21. Fifth Avenue Trestle Roadway
  trestle_top: {
    id: "trestle_top",
    name: "Fifth Avenue Trestle Roadway",
    aliases: ["trestle", "fifth avenue", "trestle top", "bridge", "roadway"],
    zone: "upland",
    verify: "Verify Fifth Avenue trestle roadway deck and streetcar/automobile traffic over the Deschutes estuary in 1931.",
    desc: function (state) {
      var viewNote = state.isAfloat()
        ? "Far below, the flood tide has turned Little Hollywood into an archipelago of dark roofs."
        : "Below the timber railing, the mudflats lie exposed—dozens of tar-paper float shacks linked by spiderweb plank walks.";
      return (
        "Heavy plank decking vibrates under occasional Model A tires. " + viewNote + " " +
        "An iron streetlamp buzzes softly against the mist, and old rusted rail grooves crease the boards. " +
        "The Bluff Road continues east toward town, timber stairs drop down under the trestle, and a narrow plank stair descends west to Sweeney's salvage crib."
      );
    },
    exits: {
      east: { to: "road_above", mode: "always", desc: "east onto the Bluff Road" },
      down: { to: "trestle_under", mode: "always", desc: "down under the Fifth Avenue trestle" },
      west: { to: "junk_crib", mode: "always", desc: "west down to Sweeney's salvage crib" }
    },
    scenery: {
      railing: {
        aliases: ["decking", "deck", "rail", "grooves", "view", "flats"],
        desc: "Splintered timber guardrails looking straight north over the Deschutes flats, Gus's float house, and Budd Inlet."
      },
      streetlamp: {
        aliases: ["lamp", "gaslamp", "light"],
        desc: "A tall iron streetlamp casting a pale yellow pool through the drizzle, moths circling its glass globe."
      },
      tracks: {
        aliases: ["rails", "streetcar rails", "boards"],
        desc: "Worn steel strips sunk flush into the bridge timbers."
      }
    }
  },

  // 22. The Road Above
  road_above: {
    id: "road_above",
    name: "The Bluff Road (Fourth & Water)",
    aliases: ["road", "road above", "bluff road", "fourth", "bluff"],
    zone: "upland",
    verify: "Verify Fourth Avenue / Water Street bluff overlooking Olympia's Deschutes mudflats in 1931.",
    desc: function () {
      return (
        "A gravel-shouldered town road hugging the lip of the bluff above Little Hollywood. " +
        "Wet blackberry brambles spill over a cedar retaining wall, and the whole shantytown lies spread below like a wooden raft city. " +
        "The Fifth Avenue trestle lies west, the Olympia Veneer & Mill Gate is north, and the brick edge of the Armory lies east."
      );
    },
    exits: {
      west: { to: "trestle_top", mode: "always", desc: "west onto the Fifth Avenue trestle" },
      north: { to: "mill_yard_gate", mode: "always", desc: "north to the Olympia Veneer & Mill Gate" },
      east: { to: "armory_edge", mode: "always", desc: "east to the Armory edge" }
    },
    scenery: {
      brambles: {
        aliases: ["blackberry", "blackberry brambles", "bushes"],
        desc: "Thick Himalayan blackberry canes tangled along the ditch, wet with fog."
      },
      wall: {
        aliases: ["retaining wall", "cedar wall", "shoulder", "gravel"],
        desc: "Mossy cedar cribbing holding up the bluff road. From here you could walk clean away into town—if your conscience lets you."
      },
      lookout: {
        aliases: ["view", "shantytown", "little hollywood", "flats"],
        desc: "Thirty-odd float houses huddled on the mudflats below, stove smoke rising thin against the evergreens."
      }
    }
  },

  // 23. The Armory Edge
  armory_edge: {
    id: "armory_edge",
    name: "The Armory Edge",
    aliases: ["armory", "armory edge", "police", "voss"],
    zone: "upland",
    verify: "Verify Olympia National Guard Armory (built 1922, Eastside/Quince or downtown staging area) proximity to the waterfront raid staging in 1931.",
    desc: function () {
      return (
        "The wet red-brick corner of the National Guard Armory, fenced in black wrought iron. " +
        "A black Ford patrol car idles at the curb, headlights dimmed, its running board spattered with mud. " +
        "A stacked notice board by the iron gate carries city health-abatement orders. " +
        "The Bluff Road leads back west."
      );
    },
    exits: {
      west: { to: "road_above", mode: "always", desc: "west back to the Bluff Road" }
    },
    scenery: {
      wall: {
        aliases: ["brick wall", "armory", "fence", "iron fence", "gate"],
        desc: "Solid red brick and wrought-iron pickets—the city's Staging Point for the Day 3 dawn sweep of the mudflats."
      },
      car: {
        aliases: ["patrol car", "prowl car", "ford", "headlights"],
        desc: "An Olympia Police Model A sedan, doors stenciled in faded gold leaf. A nightstick and a clipboard rest on the front seat."
      },
      notice: {
        aliases: ["notice board", "orders", "abatement", "paper"],
        desc: "A damp mimeographed notice: 'CITY OF OLYMPIA — UNSANITARY STRUCTURES ON DESCHUTES TIDE FLATS TO BE CLEARED AND BURNED AT 0600 HOURS, DAY 3.'"
      }
    }
  },

  // 24. Olympia Veneer & Mill Gate
  mill_yard_gate: {
    id: "mill_yard_gate",
    name: "Olympia Veneer & Mill Gate",
    aliases: ["mill", "mill gate", "veneer", "mill yard", "gate"],
    zone: "upland",
    verify: "Verify Olympia Veneer Company (cooperative plywood mill established 1921 on Olympia waterfront) operations in 1931.",
    desc: function () {
      return (
        "High plank fencing and a padlocked iron gate guarding the silent veneer yard. " +
        "A wooden watchman's booth stands empty by the chain, a tall steam whistle pipe rises over the saw-roof, and a scrap lumber pile spills beside the ditch. " +
        "The Bluff Road lies south, and steep timber stairs lead west down to Budd Inlet Landing."
      );
    },
    exits: {
      south: { to: "road_above", mode: "always", desc: "south to the Bluff Road" },
      west: { to: "budd_inlet_landing", mode: "always", desc: "west down the stairs to Budd Inlet Landing" }
    },
    scenery: {
      gate: {
        aliases: ["iron gate", "padlock", "chain", "fence"],
        desc: "Heavy wire-mesh gates chained shut with a brass padlock. The noon whistle won't blow until Monday."
      },
      booth: {
        aliases: ["watchman's booth", "watchman", "whistle", "steam whistle"],
        desc: "A narrow cedar guard box with a cracked window and a thermos cap left on the sill."
      },
      lumber: {
        aliases: ["scrap lumber", "scrap", "pile", "ditch"],
        desc: "Off-cut Douglas fir boards and cedar edgings stacked outside the fence where mill hands are allowed to scavenge stovewood."
      }
    }
  },

  // 25. Sweeney's Salvage Crib
  junk_crib: {
    id: "junk_crib",
    name: "Sweeney's Salvage Crib",
    aliases: ["crib", "salvage crib", "sweeney", "sweeney's", "junk"],
    zone: "upland",
    desc: function () {
      return (
        "A roofed timber lean-to wedged under the bluff stairs where old man Sweeney used to trade scrap iron before he took the train south. " +
        "Rusted stove grates, glass floats, and bent ship hardware fill the bins, and a yellowed tide table hangs nailed to the center post. " +
        "You can walk east under the Fifth Avenue trestle, or climb up the plank stair to the trestle roadway."
      );
    },
    exits: {
      east: { to: "trestle_under", mode: "always", desc: "east under the Fifth Avenue trestle" },
      up: { to: "trestle_top", mode: "always", desc: "up to the Fifth Avenue trestle roadway" }
    },
    scenery: {
      bins: {
        aliases: ["scrap", "scrap iron", "grates", "hardware", "floats"],
        desc: "Crates of corroded bolts, glass Japanese fishing floats, and stove grates—picked over, though a few useful things remain."
      },
      post: {
        aliases: ["center post", "lean-to", "roof"],
        desc: "A rough cedar support post studded with rusty bent nails and old shipping tags."
      },
      stairs: {
        aliases: ["bluff stairs", "plank stair"],
        desc: "A steep flight of wet planks climbing up to the Fifth Avenue trestle."
      }
    }
  }
};

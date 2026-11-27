/* LITTLE HOLLYWOOD — items.js
 * All puzzle objects, their starting locations, aliases, and dynamic descriptions.
 * Historical details carry an explicit `verify` field.
 */

window.LH = window.LH || {};

window.LH.ITEMS = {
  lantern: {
    id: "lantern",
    name: "brass storm lantern",
    aliases: ["lantern", "storm lantern", "lamp", "light", "kerosene lantern"],
    location: "float_house",
    takeable: true,
    desc: function (state) {
      return state.flags.lanternLit
        ? "A dented Dietz-style brass storm lantern burning with a steady yellow wick. Smells of warm kerosene."
        : "A dented brass storm lantern, half-full of kerosene with a dry wick ready to strike. (Try 'light lantern'.)";
    },
    verify: "Verify kerosene storm lanterns (e.g., Dietz-style) in common waterfront use in 1931."
  },

  skiff: {
    id: "skiff",
    name: "Uncle Gus's cedar skiff",
    aliases: ["skiff", "boat", "rowboat", "dinghy"],
    location: "gus_porch",
    takeable: false,
    desc: function (state) {
      var parts = ["A twelve-foot lapstrake cedar skiff moored to Gus's catwalk."];
      if (!state.flags.skiffBailed) {
        parts.push("Six inches of cold rainwater slosh in the bilge—she'll need bailing before you row anywhere.");
      } else {
        parts.push("The bilge is bailed clean and dry.");
      }
      if (!state.flags.skiffHasOars) {
        parts.push("Her oarlocks are empty; you'll need a pair of oars.");
      } else {
        parts.push("A pair of spruce oars rest neatly in the oarlocks.");
      }
      if (state.isAfloat()) {
        parts.push("She rides high and buoyant on the tide, ready to board and row.");
      } else {
        parts.push("At this low tide she sits dead in the blue mud—won't budge until high water.");
      }
      return parts.join(" ");
    }
  },

  crowbar: {
    id: "crowbar",
    name: "iron crowbar",
    aliases: ["crowbar", "bar", "prybar", "pry bar", "jimmy", "iron bar"],
    location: "driftwood_spit",
    takeable: true,
    desc: "A two-foot forged iron crowbar wedged half-rusty in the driftwood. Heavy enough to pull stubborn spikes or pry nailed floorboards."
  },

  bailer: {
    id: "bailer",
    name: "tin bailer",
    aliases: ["bailer", "scoop", "tin scoop", "dipper"],
    location: "abandoned_hulk",
    takeable: true,
    desc: "A galvanized oil can cut slantwise with a wooden handle nailed across the back—an old boatman's bailer."
  },

  oars: {
    id: "oars",
    name: "pair of spruce oars",
    aliases: ["oars", "oar", "paddles", "paddle", "spruce oars"],
    location: "trestle_under",
    takeable: true,
    desc: "Two seven-foot Sitka spruce oars tucked behind a trestle bent, leather collars worn smooth by Gus's hands."
  },

  pipe: {
    id: "pipe",
    name: "iron pipe length",
    aliases: ["pipe", "iron pipe", "standpipe", "metal pipe"],
    location: "hulk_hold",
    takeable: true,
    hiddenUntilLit: true,
    desc: "A clean three-foot length of inch-and-a-half galvanized iron pipe with sharp threads at both ends."
  },

  fitting: {
    id: "fitting",
    name: "brass pipe fitting",
    aliases: ["fitting", "brass fitting", "union", "elbow", "brass union", "coupler"],
    location: "hulk_hold",
    takeable: true,
    hiddenUntilLit: true,
    desc: "A heavy cast-brass threaded union fitting, tarnished green on the outside but clean in the threads—just the match for a cracked standpipe."
  },

  key: {
    id: "key",
    name: "small brass key",
    aliases: ["key", "brass key", "padlock key"],
    location: null, // Revealed inside hulk_hold valve_box
    takeable: true,
    desc: "A small flat brass padlock key tagged with a faded red string: 'GUS — CHEST.'"
  },

  ledger: {
    id: "ledger",
    name: "oilcloth-bound ledger",
    aliases: ["ledger", "book", "notebook", "accounts", "record", "records"],
    location: null, // Revealed inside float_house chest
    takeable: true,
    desc: "Uncle Gus's narrow oilcloth ledger. In neat pencil it lists dates, tide heights, whisky cases landed for Big Mae, and two cash payoffs to a clerk at City Hall—proof that would hang Mae or embarrass Captain Voss."
  },

  whisky: {
    id: "whisky",
    name: "crate of Canadian rye whisky",
    aliases: ["whisky", "whiskey", "rye", "booze", "liquor", "cache", "bottles", "crate"],
    location: null, // Revealed under float_house floorboards
    takeable: true,
    verify: "Verify Canadian rye whisky smuggling across Puget Sound during US Prohibition (1920–1933).",
    desc: function (state) {
      if (state.flags.whiskyHidden) {
        return "Uncle Gus's six-quart crate of Canadian rye, bundled tight inside rough burlap gunnysacks so it looks like wet turnips or salvage rags.";
      }
      return "Six quart bottles of stamped Canadian rye whisky packed in a slatted pine crate. Carrying this uncovered up near the Armory is asking for handcuffs.";
    }
  },

  gunnysacks: {
    id: "gunnysacks",
    name: "bundle of burlap gunnysacks",
    aliases: ["gunnysacks", "gunnysack", "sack", "sacks", "burlap", "bag", "bags"],
    location: "wash_shack",
    takeable: true,
    desc: "Three coarse burlap potato sacks, damp and smelling of silt. Handy for wrapping contraband so patrolmen don't see glass."
  },

  bucket: {
    id: "bucket",
    name: "galvanized iron bucket",
    aliases: ["bucket", "pail", "water bucket", "tin bucket"],
    location: "wash_shack",
    takeable: true,
    desc: function (state) {
      return state.flags.bucketFull
        ? "A battered galvanized bucket brimming with cold, crystal-clear artesian spring water."
        : "A battered galvanized iron bucket, empty and dry. Hold water fine if you find a clean spring."
    }
  },

  canned_heat: {
    id: "canned_heat",
    name: "tins of canned heat",
    aliases: ["canned heat", "heat", "sterno", "tins", "tin", "fuel", "canned heat tins"],
    location: "junk_crib",
    takeable: true,
    verify: "Verify Sterno / solidified alcohol 'canned heat' tins commonly used by Depression-era drifters and shanty dwellers in 1931.",
    desc: "Two pink-labeled tins of solidified alcohol ('canned heat'). Burns clean and hot in a tin stove without choking a shack in smoke."
  },

  tide_table: {
    id: "tide_table",
    name: "1931 Puget Sound tide table",
    aliases: ["tide table", "table", "chart", "tide chart", "almanac", "pamphlet"],
    location: "junk_crib",
    takeable: true,
    verify: "Verify Puget Sound semi-diurnal tide cycle (~6 hours low-to-high) and local Olympia tide tables printed by hardware/chandlery shops in 1931.",
    desc: "A grease-thumbed 1931 Olympia Chandlery tide card:\n" +
      "  LOW TIDES:  9:00 AM & 9:00 PM (flats bare, springs exposed, floats grounded)\n" +
      "  HIGH TIDES: 3:00 PM & 3:00 AM (plank walks awash, skiff & float houses afloat)\n" +
      "  NOTE IN GUS'S HAND: 'Night 3 — 3:00 AM spring flood peaks at 12 ft. Best pull out to Budd Inlet before dawn.'"
  },

  rope: {
    id: "rope",
    name: "heavy hemp tow rope",
    aliases: ["rope", "hawser", "line", "hemp rope", "tow rope", "coil"],
    location: "junk_crib",
    takeable: true,
    desc: "Sixty feet of inch-thick tarred Manila hemp hawser, stiff with salt. Strong enough to lash float houses together for a tide tow."
  },

  plank: {
    id: "plank",
    name: "stout Douglas fir plank",
    aliases: ["plank", "board", "timber", "fir plank", "lumber"],
    location: "mill_yard_gate",
    takeable: true,
    desc: "A clean ten-foot two-by-twelve Douglas fir plank from the veneer mill scrap pile—long enough to bridge a broken walkway."
  },

  compass: {
    id: "compass",
    name: "brass pocket compass",
    aliases: ["compass", "brass compass", "pocket compass"],
    location: null, // Held by Mrs. Halvorsen; earned via neighbor help/trade
    takeable: true,
    desc: "A heavy ship's pocket compass salvaged from the old sternwheeler Cowlitz. Its needle swings steady north—keeping your bearings on fogged-in flats."
  },

  cash: {
    id: "cash",
    name: "roll of crisp twenties ($400)",
    aliases: ["cash", "money", "roll", "bills", "twenties", "dollars"],
    location: null, // Earned from Big Mae
    takeable: true,
    desc: "Four hundred dollars in worn greenbacks bound with a rubber band—more than a mill hand sees in half a year in 1931. Smells faintly of cheap perfume and rye."
  }
};

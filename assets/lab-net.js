/* =====================================================================
   A+ Core1 Under the Hood Labs — Networking & Infrastructure

   The eight objectives that had nothing at all: 2.1 ports and protocols,
   2.3 services provided by networked hosts, 2.5 networking hardware,
   2.7 internet connection types, 2.8 networking tools, 4.1 virtualization,
   4.2 cloud, and 5.5 network troubleshooting.

   WHY A LAB CAN TEACH RECALL, WHICH I FIRST SAID IT COULD NOT

   The other six labs are mechanism-led and consequence-graded, which
   works for hardware you can break and then live with. Most of this
   domain is recall — a port number has no consequence you can feel — and
   my first answer was that a lab could not carry it.

   That was wrong, and the shape of the mistake is worth keeping. You
   cannot make a student live with not knowing port 3389 in the abstract.
   You CAN put them in front of a site where remote desktop is blocked and
   let them work out which of nine ports to open. The number stops being a
   fact to memorise and becomes the answer to a question they wanted
   answered, which is the only version anybody keeps.

   So every recall objective here is delivered as a job.

   THE PATH IS THE SPINE

   Everything hangs off one chain — handoff, modem, router, switch, patch
   panel, wall port, client — and every fault is somewhere on it. The
   bench draws that chain with every hop UNTESTED, and hops turn green
   because the student tested them. The gap left over is the answer.
   ===================================================================== */

import { rng } from "./rng.js";
import { sixOptions } from "./options.js";
import { netBench, hopWords, HOPS,
         connectorBench, rj45Bench, fibreBench } from "./bench-net.js";

/* =====================================================================
   THE THREE CONNECTOR BENCHES, MOUNTED.

   rj45Bench, connectorBench and fibreBench were all built, verified and
   rendered — and none of them was reachable from a single stage. They
   existed in bench-net.js and in preview pages, which is exactly the
   trap: a registry proves content exists, only driving the page proves a
   student can ever see it. The net lab had nine stages and one bench.

   A BENCH IS A PANEL, NOT A STAGE KIND. runner.js drawBench takes a panel
   entry, so these mount inside stages that already exist rather than
   needing three new ones — the connector goes where the SERVICE is being
   chosen, the fibre ends go where the KIT is being chosen, and the plug
   goes where the fault you cannot see is being hunted. Each is beside the
   question it answers instead of in a gallery of its own.
   ===================================================================== */

/* ONE CONTROL PER PART, DERIVED FROM THE BENCH ITSELF. Every part on
   these benches carries a `spec` and a `note` that are teaching content
   reachable no other way, and mapping them means a part added to a bench
   cannot go missing from the list. */
function partControls(spec) {
  return spec.parts.map(function (p) {
    return { key: p.key, label: p.label, state: "na",
             stateWords: p.spec || "On the bench", detail: p.note };
  });
}

function benchPanel(o) {
  return {
    kind: "bench", title: o.title, intro: o.intro, height: o.height || 420,
    bench: {
      spec: o.spec,
      status: function () { return { tone: o.tone || "calm", words: o.words, detail: o.detail }; },
      controls: function () { return partControls(o.spec()); },
      onAction: function () { return {}; }
    }
  };
}

/* THE OPTION POOLS. Eight in each rather than six, so sixOptions has a
   window to move and the same five wrong answers do not appear beside
   every scenario. Every one of them is a real part a technician meets —
   an MPO is not filler, it is what a 40 Gb trunk actually terminates in,
   and a reversed pair is not filler either, it is the fault that sits one
   step away from a split pair and tests completely differently. */
const WALL_OPTS = [
  { key: "f",     label: "F type, threaded, one stiff centre wire — coax, so a cable service" },
  { key: "sc",    label: "SC, square and push-pull over a 2.5 mm ferrule — fibre to an ONT" },
  { key: "rj11",  label: "RJ11, six positions — a phone line, so DSL and a modem in the path" },
  { key: "rj45",  label: "RJ45, eight positions — the handoff is already Ethernet" },
  { key: "bnc",   label: "BNC, push and twist — coax, but the legacy video kind" },
  { key: "lc",    label: "LC duplex, two small ferrules in a clip — fibre, switch side" },
  { key: "st",    label: "ST, metal with a quarter-turn collar — fibre, older riser" },
  { key: "sfp",   label: "An SFP cage with nothing in it — no service terminated yet" }
];
const FIBRE_OPTS = [
  { key: "lc",     label: "LC — small latch, 1.25 mm ferrule, usually a clipped duplex pair" },
  { key: "sc",     label: "SC — square body, push-pull, 2.5 mm ferrule" },
  { key: "st",     label: "ST — metal, keyed, bayonet: push and twist a quarter turn" },
  { key: "fc",     label: "FC — metal, keyed, threaded nut you screw down" },
  { key: "mpo",    label: "MPO/MTP — a ribbon of twelve fibres in one rectangular ferrule" },
  { key: "e2000",  label: "E2000 — push-pull with a spring shutter over the ferrule" },
  { key: "scdup",  label: "SC duplex — two square bodies clipped, 2.5 mm ferrules" },
  { key: "lcsimp", label: "LC simplex — one small latch on its own, no pair clip" }
];
const TERM_OPTS = [
  { key: "split",   label: "A split pair — right pins, wrong pairs, so the twist is gone" },
  { key: "mixed",   label: "One end T568A and the other T568B — an accidental crossover" },
  { key: "open",    label: "A contact that never pierced its conductor — one pin open" },
  { key: "long",    label: "The run is over 100 m — the channel is out of spec, not the plug" },
  { key: "untwist", label: "Too much untwist at the plug — pairs combed straight before crimping" },
  { key: "short",   label: "A short between two conductors inside the plug" },
  { key: "rev",     label: "A reversed pair — the two wires of one pair swapped end for end" },
  { key: "shield",  label: "The shield is not bonded at either end — screened cable, floating" }
];

/* Build six options from a pool, marking the one the scenario calls for.
   Every wrong option says WHY it is wrong in its own terms rather than
   just being marked wrong, because a refused answer that explains itself
   is the difference between a guess costing nothing and teaching
   something. */
function fromPool(pool, rightKey, why, salt) {
  return sixOptions(pool.map(function (o) {
    return { key: o.key, label: o.label, correct: o.key === rightKey,
             why: o.key === rightKey ? "Yes. " + why
                : "Not this one — nothing in the description matches it. " + o.label + "." };
  }), salt);
}

/* WHAT IS ON THE WALL NAMES THE SERVICE. Six scenarios, and the five
   wrong answers on each are the services a technician actually confuses
   it with rather than filler. The discriminating detail is buried in the
   description — a thread, a square latch, six positions, eight. */
const WALL_CASES = [
  { key: "f", said: "A threaded metal nut on the back of the box, hex, about 11 mm across the " +
      "flats, with a single stiff wire standing up out of the middle of it.",
    tell: "A threaded F connector with the cable's own centre conductor as the pin. Coax means " +
      "a DOCSIS cable service." },
  { key: "sc", said: "A square plastic body that pushes straight in and clicks, with a white " +
      "ceramic tip about two and a half millimetres across sitting in the middle of it.",
    tell: "A square push-pull body over a 2.5 mm ferrule is SC, and SC on the wall box means " +
      "fibre to an ONT." },
  { key: "rj11", said: "A clear plastic clip, narrower than a network lead, and counting the " +
      "little metal strips across the end there are six slots with four filled.",
    tell: "Six positions is RJ11 — a phone line, so the service is DSL and there is a modem " +
      "in the path whether or not anyone has mentioned one." },
  { key: "rj45", said: "A clear plastic clip the full width of a network lead, eight metal " +
      "strips across the end, plugged straight into the provider's box.",
    tell: "Eight positions is RJ45, so the handoff has ALREADY been converted to Ethernet. " +
      "Whatever the service is upstream, from here on it is a network cable." },
  { key: "sc", said: "A push-fit square end with a GREEN body, and the engineer's note says " +
      "not to swap it for the blue one in the spares tin.",
    tell: "Green is APC, an angled polish; blue is UPC, a straight one. Both are SC, so the " +
      "service is fibre either way — but they must not be mixed." },
  { key: "f", said: "A screw-on end coming off a thick single cable with a woven metal braid " +
      "under the outer jacket, running back to a splitter in the roof space.",
    tell: "Braid and a single core is coaxial, and the splitter confirms it. Threaded F " +
      "connector, cable service." }
];

/* THE FOUR FIBRE ENDS. What separates them is how they hold on, so every
   scenario turns on the mechanism rather than on a colour. */
const FIBRE_CASES = [
  { key: "fc", said: "It goes in a rack under a machine shop floor and the last two ends " +
      "shook loose inside a month. It has to screw down.",
    tell: "A threaded nut is FC. Push-pull works loose where anything vibrates; a thread does " +
      "not, which is the whole reason FC still exists." },
  { key: "lc", said: "The switch face has twenty-four of them in the space an older switch " +
      "used for twelve, and they come as clipped pairs.",
    tell: "LC. A 1.25 mm ferrule instead of 2.5 means half the footprint, so an LC DUPLEX " +
      "fits where one SC used to — which is why the port count doubled." },
  { key: "st", said: "An older campus riser. Metal bodied, and the engineer says you push it " +
      "in and give it a quarter turn.",
    tell: "Push and twist a quarter turn is a BAYONET, which is ST. Same 2.5 mm ferrule as SC " +
      "and FC; what differs is only how it locks." },
  { key: "sc", said: "The provider's ONT. Square body, pushes straight in, clicks, and comes " +
      "out again when you pull the body rather than the cable.",
    tell: "Square and push-pull is SC — no twisting, no thread. The commonest thing on an ONT." },
  { key: "lc", said: "Two ferrules side by side in one clip, and the transmit and receive got " +
      "swapped when somebody rebuilt the patch lead.",
    tell: "A clipped pair of small ferrules is an LC duplex. The clip exists precisely to stop " +
      "transmit and receive being crossed, which is the commonest fibre fault there is." },
  { key: "st", said: "Metal, keyed so it only goes on one way, and the last one got its " +
      "ferrule chipped when somebody forced it without lining the key up.",
    tell: "A key plus a quarter-turn lock is ST. The key means it only seats when aligned, so " +
      "forcing one is how ferrules get chipped." }
];

/* THE TERMINATION YOU CANNOT SEE IS WRONG. Every wrong answer here is a
   real misdiagnosis: the fault next door in the same cable, the symptom
   that looks identical, the fix that treats the symptom. */
const TERM_CASES = [
  { key: "split", said: "Continuity passes on all eight. It links at 100 Mb, never a gig, and " +
      "a long file copy throws errors under load.",
    tell: "A SPLIT PAIR. Every wire reaches the right pin, so a continuity tester is happy — " +
      "but two conductors were taken from different pairs, so the twist that cancels " +
      "crosstalk is gone. It only shows under load, which is why it survives testing." },
  { key: "mixed", said: "One end was terminated by the day shift and one by the night shift. " +
      "It links, but nothing on it can see the file server.",
    tell: "One end T568A and the other T568B. That is a crossover, made by accident — fine " +
      "between two switches with no auto-MDIX, wrong for a desk." },
  { key: "open", said: "Two of the eight read open. Looking along the end of the plug, one " +
      "gold contact is standing higher than the other seven.",
    tell: "A contact that never pierced its conductor. The crimp did not seat, so that pin " +
      "made no contact at all — and a plug is single-use, so it gets cut off and redone." },
  { key: "long", said: "The run is 118 metres from the patch panel to the desk and the tester " +
      "reports the link as failing intermittently at gigabit.",
    tell: "Over 100 metres. Nothing is wrong with the termination at all — the CHANNEL is out " +
      "of spec, and no amount of recrimping fixes a run that is too long." },
  { key: "untwist", said: "Neatly done, but 40 mm of jacket was stripped back and the pairs " +
      "were combed straight before they went into the plug.",
    tell: "TOO MUCH UNTWIST. The twist is what cancels the interference, and it has to be kept " +
      "right up to the contacts — no more than about 13 mm undone." },
  { key: "split", said: "Wired to neither standard but consistently at both ends. Short " +
      "patch leads pass; the 90 metre run to the corner office does not.",
    tell: "Pin-to-pin consistent and still a SPLIT PAIR, because the pairs were not kept " +
      "together. Short leads hide it; length exposes it. Both ends matching is not enough — " +
      "the PAIRS have to match the standard, not just the pins." }
];

/* ---------------------------------------------------------------------
   2.1 — ports and protocols

   Nine of them, chosen because they are the ones a small site actually
   needs holes for, and because six of the nine have a secure sibling that
   students confuse with them. The confusion is the lesson.
   --------------------------------------------------------------------- */
export const PORTS = [
  { key: "ssh",   name: "SSH",         port: 22,   tcp: true,  what: "Encrypted remote shell, and what SFTP rides inside" },
  { key: "dns",   name: "DNS",         port: 53,   tcp: false, what: "Turns names into addresses. UDP for lookups" },
  { key: "dhcp",  name: "DHCP",        port: 67,   tcp: false, what: "Hands out addresses. 67 on the server, 68 on the client" },
  { key: "http",  name: "HTTP",        port: 80,   tcp: true,  what: "Web, in the clear" },
  { key: "imap",  name: "IMAP",        port: 143,  tcp: true,  what: "Mail left on the server, in the clear" },
  { key: "https", name: "HTTPS",       port: 443,  tcp: true,  what: "Web, encrypted. The one that is almost always already open" },
  { key: "smb",   name: "SMB",         port: 445,  tcp: true,  what: "Windows file and printer sharing" },
  { key: "imaps", name: "IMAPS",       port: 993,  tcp: true,  what: "IMAP over TLS — the secure sibling of 143" },
  { key: "rdp",   name: "RDP",         port: 3389, tcp: true,  what: "Remote desktop" }
];

/* ---------------------------------------------------------------------
   2.3 — what a networked host is FOR
   --------------------------------------------------------------------- */
export const HOSTS = [
  { key: "dns",   name: "DNS server",      does: "Answers name lookups for the whole site",
    fails: "Names stop resolving. Addresses still work, which is the tell" },
  { key: "dhcp",  name: "DHCP server",     does: "Leases addresses, masks, gateways and DNS servers",
    fails: "Clients fall back to a 169.254 address and cannot reach anything" },
  { key: "file",  name: "File server",     does: "Holds the shared drives",
    fails: "Mapped drives disconnect; everything else is fine" },
  { key: "print", name: "Print server",    does: "Queues and shares the printers",
    fails: "Jobs sit in the queue and never move" },
  { key: "mail",  name: "Mail server",     does: "Sends and stores mail for the site",
    fails: "Mail queues locally and nothing leaves" },
  { key: "proxy", name: "Proxy server",    does: "Fetches the web on behalf of clients, and logs it",
    fails: "Browsing dies while everything else keeps working" },
  { key: "web",   name: "Web server",      does: "Serves the site's own pages",
    fails: "The site is down from inside and outside alike" }
];

/* ---------------------------------------------------------------------
   2.5 — the hardware, and what each one is actually for
   --------------------------------------------------------------------- */
export const KIT = [
  { key: "switch", name: "Switch",        layer: "2", for: "Connecting wired devices on one network" },
  { key: "router", name: "Router",        layer: "3", for: "Joining two networks and choosing a path between them" },
  { key: "ap",     name: "Access point",  layer: "2", for: "Putting wireless clients on the wired network" },
  { key: "fw",     name: "Firewall",      layer: "3-7", for: "Deciding what traffic is allowed through" },
  { key: "panel",  name: "Patch panel",   layer: "1", for: "Terminating permanent cable runs so nothing is re-punched" },
  { key: "poe",    name: "PoE injector",  layer: "1", for: "Putting power onto an Ethernet run for a device with no socket near it" },
  { key: "modem",  name: "Cable modem",   layer: "1-2", for: "Converting the provider's signal to Ethernet" }
];

/* ---------------------------------------------------------------------
   2.7 — links. Every field here is something a site actually chooses on.
   --------------------------------------------------------------------- */
/* EVERY UPLOAD FIGURE HERE MUST BE DISTINCT.

   The link question asks which option fixes an overnight backup, and a
   backup is an upload — so the answer is whichever has the highest `up`.
   Cellular and fixed wireless were both 40 Mb, which gave 50 of 240
   generated scenarios TWO correct answers and no way to mark them. The
   check at the bottom of this file caught it; the assertion below stops
   it coming back the next time somebody edits a number. */
export const LINKS = [
  { key: "fibre", name: "Fibre",     down: 1000, up: 1000, latency: "low",     symmetric: true,
    needs: "a fibre run to the building", note: "Symmetric and low latency. The best answer when it is available at all" },
  { key: "cable", name: "Cable",     down: 500,  up: 30,   latency: "low",     symmetric: false,
    needs: "coax to the building", note: "Fast down, slow up, and shared with the street" },
  { key: "dsl",   name: "DSL",       down: 60,   up: 12,   latency: "low",     symmetric: false,
    needs: "a phone line", note: "Slow, and it gets slower the further you are from the exchange" },
  { key: "cell",  name: "Cellular",  down: 150,  up: 35,   latency: "medium",  symmetric: false,
    needs: "a signal", note: "Quick to install and metered. The usual answer for a temporary site" },
  { key: "sat",   name: "Satellite", down: 120,  up: 15,   latency: "high",    symmetric: false,
    needs: "a clear view of the sky", note: "The last resort, and the latency is the reason" },
  { key: "wisp",  name: "Fixed wireless", down: 100, up: 40, latency: "medium", symmetric: false,
    needs: "line of sight to the provider's mast", note: "Where there is no cable in the ground at all" }
];

/* ---------------------------------------------------------------------
   2.8 — tools, each matched to a fault you cannot see by looking
   --------------------------------------------------------------------- */
export const TOOLS = [
  { key: "toner",   name: "Tone generator and probe", finds: "which of forty identical cables in the panel is the one you want" },
  { key: "tester",  name: "Cable tester",             finds: "a pair wired to the wrong pin, or a broken conductor" },
  { key: "loopback", name: "Loopback plug",           finds: "whether a port or a NIC is alive at all, without a second machine" },
  { key: "crimper", name: "Crimper",                  finds: "nothing — it makes a plug. It is the fix, not the diagnosis" },
  { key: "punch",   name: "Punchdown tool",           finds: "nothing — it lands a pair in a panel. Also a fix" },
  { key: "wifi",    name: "Wi-Fi analyser",           finds: "which channels are congested and how strong the signal really is" },
  { key: "tap",     name: "Network tap",              finds: "what is actually on the wire, when the symptom makes no sense" }
];

/* ---------------------------------------------------------------------
   5.5 — the faults, each one living at a hop on the path
   --------------------------------------------------------------------- */
export const FAULTS = [
  { key: "apipa", hop: "router", name: "No DHCP lease",
    said: "it says limited connectivity and I cannot get on anything",
    tell: "The client has a 169.254 address and no gateway",
    why: "That address is not from a server. A client gives it to ITSELF when no DHCP " +
         "server answered, so the question is why the request went unanswered.",
    tool: "loopback" },
  { key: "dnsdown", hop: "router", name: "DNS not answering",
    said: "the internet is down, but my email still works somehow",
    tell: "Addresses reach the internet; names do not resolve",
    why: "If a numeric address works and a name does not, routing is fine and resolution " +
         "is not. That single test splits the whole problem in half.",
    tool: "tap" },
  { key: "badrun", hop: "panel", name: "A miswired run",
    said: "this one desk has never worked since they moved the furniture",
    tell: "The tester shows a split pair on the run to that wall port",
    why: "It links at 100 and fails at gigabit, or fails intermittently, because two " +
         "conductors are carried on the wrong pins and crosstalk does the rest.",
    tool: "tester" },
  { key: "deadport", hop: "switch", name: "A dead switch port",
    said: "no lights on the back of the machine at all",
    tell: "No link on that port, and the same cable links on the next port along",
    why: "Moving the patch lead one port is the cheapest test on this list, and it " +
         "separates the switch from everything downstream of it in ten seconds.",
    tool: "loopback" },
  { key: "wanloss", hop: "modem", name: "The provider's link is down",
    said: "nobody in the building has internet",
    tell: "The modem's link lamp is out and the router shows no WAN address",
    why: "Everybody is affected and nothing inside has changed. When the whole site goes " +
         "at once, start at the handoff rather than at the desk.",
    tool: "tap" },
  { key: "unpatched", hop: "panel", name: "The run was never patched through",
    said: "we put a new desk in over the weekend and that port does nothing",
    tell: "The tester says the run is good end to end, but there is no patch lead to the switch",
    why: "A terminated run is not a connected one. The panel is a stopping point, and " +
         "somebody has to bridge it to a switch port.",
    tool: "toner" }
];

/* Load-time assertion. A tie here is unmarkable, and it is the kind of
   thing that gets reintroduced by a plausible-looking edit. */
(function () {
  const ups = LINKS.map(function (l) { return l.up; });
  if (new Set(ups).size !== ups.length) {
    throw new Error("lab-net: two links share an upload figure, so the link " +
      "question has no single correct answer");
  }
  const tot = LINKS.map(function (l) { return l.down + l.up; });
  if (new Set(tot).size !== tot.length) {
    throw new Error("lab-net: two links share a combined throughput, so the " +
      "\"best available\" question has no single correct answer");
  }
})();

/* --------------------------------------------------------------------- */

const SITES = [
  { name: "a two-partner accountancy office", staff: 9, floors: 1 },
  { name: "a dental practice", staff: 14, floors: 2 },
  { name: "a small architecture studio", staff: 11, floors: 1 },
  { name: "a builders' merchant with a trade counter", staff: 18, floors: 1 },
  { name: "a veterinary surgery", staff: 12, floors: 2 }
];

const NEEDS = [
  { key: "remote",  said: "the partners want to get at their desktops from home",
    wants: ["rdp"],  because: "Remote desktop, which needs one specific hole through the firewall" },
  { key: "mail",    said: "we read our mail on the phone and on the desktop and it has to match",
    wants: ["imaps"], because: "Mail left on the server, over TLS" },
  { key: "shares",  said: "everyone maps the same drive letter to the same folder",
    wants: ["smb"],  because: "Windows file sharing" },
  { key: "web",     said: "we host our own booking page on a box in the cupboard",
    wants: ["https", "http"], because: "A web server they run themselves" },
  { key: "shell",   said: "our developer needs to get to the server from outside",
    wants: ["ssh"],  because: "An encrypted shell" }
];

export function generate(seed) {
  const r = rng(seed);
  const site = r.pick(SITES);
  const fault = r.pick(FAULTS);

  /* The link they HAVE, and the one they want. Sometimes the answer is
     that they cannot have what they asked for. */
  const wantsFast = r.next() < 0.55;
  /* ALL SIX LINK TYPES ARE ON OFFER, not three of them.

     Six options is the standing rule, and it suits this question: the
     student is choosing a link on upload speed against latency and what
     the building can physically get, and pruning the list to three does
     most of that comparison for them. Every up-figure in LINKS is
     distinct — asserted below — so there is still exactly one right
     answer with all six present. */
  const available = r.shuffle(LINKS.slice());
  /* Fibre is only sometimes on the list, which is the real constraint. */
  const bestAvailable = available.slice().sort(function (a, b) {
    return (b.down + b.up) - (a.down + a.up);
  })[0];

  /* The nightly backup, in gigabytes. This is what makes the link choice
     a calculation rather than a comparison of two numbers in a table —
     and calculation under pressure is one of the four gaps the core path
     of every lab has to attack. The registry refuses to load a lab whose
     short path misses one, which is how this omission was caught. */
  const backupGB = r.pick([40, 60, 80, 120, 160]);

  const needs = r.shuffle(NEEDS.slice()).slice(0, 2);
  const openPorts = [];
  needs.forEach(function (n) { n.wants.forEach(function (w) { openPorts.push(w); }); });
  /* HTTPS is open on essentially every site already, and including it as
     something to "open" would make the question a giveaway. */
  if (openPorts.indexOf("https") === -1) openPorts.push("https");

  const brokenHost = r.pick(HOSTS);

  /* The cloud/virtualization thread: what they run in the cupboard, and
     whether it should stay there. */
  const onPrem = r.shuffle(HOSTS.slice()).slice(0, 3);
  const vmHostCores = r.pick([8, 12, 16]);
  const vmHostRam = r.pick([32, 64, 128]);
  const vms = onPrem.map(function (h, i) {
    return { key: h.key, name: h.name, cores: r.pick([2, 2, 4]), ram: r.pick([4, 8, 8, 16]) };
  });

  return {
    seed: seed,
    site: site,
    fault: fault,
    said: fault.said,
    available: available,
    bestAvailable: bestAvailable,
    wantsFast: wantsFast,
    needs: needs,
    backupGB: backupGB,
    openPorts: openPorts,
    brokenHost: brokenHost,
    onPrem: onPrem,
    vmHostCores: vmHostCores,
    vmHostRam: vmHostRam,
    vms: vms,
    /* How far along the path the student has got. The bench reads this. */
    tested: {}
  };
}

/* ---------------------------------------------------------------------
   The bench panel.

   Hops the student has tested show their result; everything else stays
   `unknown`. On the diagnostic stage nothing is pre-filled at all, which
   is the whole point.
   --------------------------------------------------------------------- */
function pathPanel(s, opts) {
  opts = opts || {};
  const reveal = !!opts.reveal;
  const states = {};
  HOPS.forEach(function (h) {
    if (reveal) states[h.key] = (h.key === s.fault.hop) ? "faulty" : "ok";
    else states[h.key] = "unknown";
  });

  const links = {};
  if (reveal && (s.fault.key === "badrun" || s.fault.key === "unpatched")) {
    links["panel-wall"] = false;
  }
  if (reveal && s.fault.key === "wanloss") links["wan-modem"] = false;

  return {
    kind: "bench",
    title: "The path, end to end",
    intro: reveal
      ? "With the fault found, here is where it was. Everything to the left of it was fine all " +
        "along, which is why walking the path beats guessing at it."
      : "Seven hops between the provider and the desk. None of them has been tested. The job " +
        "is to work out which one to stand at.",
    height: 380,
    bench: {
      spec: function () { return netBench({ states: states, links: links }); },
      status: function () {
        return reveal
          ? { words: s.fault.name, tone: "urgent", detail: s.fault.tell }
          : { words: "Nothing tested yet", tone: "calm",
              detail: "What the user said: " + s.said };
      },
      controls: function () {
        return HOPS.map(function (h) {
          return {
            key: h.key,
            label: h.label,
            state: states[h.key],
            stateWords: hopWords(states[h.key]),
            detail: h.hint
          };
        });
      },
      onAction: function () { return {}; }
    }
  };
}

/* --------------------------------------------------------------------- */

export function buildStage(key, s) {

  /* ---- 2.7 : the link ------------------------------------------------ */
  if (key === "brief") {
    const wall = rng(s.seed + 617).pick(WALL_CASES);
    const rows = s.available.map(function (l) {
      return { cells: [l.name, l.down + " Mb down", l.up + " Mb up",
                       l.latency + " latency", l.needs] };
    });
    return {
      title: "What can this site actually get?",
      intro: "They have asked for something. What is available at the building is a different " +
        "question, and it is the one that decides this.",
      panels: [
        { kind: "brief", title: "The site", who: s.site.name,
          quotes: [
            "there are " + s.site.staff + " of us over " + s.site.floors +
              (s.site.floors === 1 ? " floor" : " floors"),
            s.wantsFast
              ? "we back up to the cloud every night and it takes until lunchtime"
              : "we mostly just need email and the booking system to work",
            s.needs[0].said
          ] },
        { kind: "table", title: "What the providers will sell them here",
          columns: ["Link", "Down", "Up", "Latency", "Needs"], rows: rows },
        benchPanel({
          title: "What is already on the wall",
          intro: "Before believing anything the site says about its service, look at the end " +
            "that comes out of the provider's box. Four ends, four different services, and the " +
            "connector settles it faster than any conversation does.",
          height: 400,
          spec: function () { return connectorBench({}); },
          words: "Four ends, one scale",
          detail: "Drawn at 1 unit = 2 mm, so the sizes on the bench are the sizes in the hand."
        })
      ],
      questions: [
        { key: "nt-wall", kind: "choice",
          prompt: "The engineer's note about the provider's box says: “" + wall.said + "” " +
            "Which end is that, and what does it tell you the service is?",
          hints: [
            "Do not start from what they told you they were sold. Start from the end itself — " +
              "count what is on it, or feel whether it threads, clicks or twists.",
            "Three things separate every one of these: how many positions it has, whether it " +
              "locks by thread, clip or quarter turn, and whether there is a ceramic ferrule " +
              "in the middle. Any one of those rules out most of the list.",
            "A thread means coax. A square body that clicks means fibre. Six positions is a " +
              "phone line and eight is Ethernet — so count the contacts before anything else."
          ],
          options: fromPool(WALL_OPTS, wall.key, wall.tell, s.seed + 617),
          explain: wall.tell },
        { key: "nt-backup", kind: "number",
          prompt: "Their nightly backup is " + s.backupGB + " GB. On the " + s.available[0].name +
            " line at " + s.available[0].up + " Mb up, roughly how many hours does it take?",
          unit: "hours",
          answer: Math.round((s.backupGB * 8000 / s.available[0].up / 3600) * 10) / 10,
          tolerance: 0.6,
          hints: [
            "Gigabytes and megabits are not the same unit and never have been. Get both sides " +
              "into bits before dividing anything.",
            "One gigabyte is about 8000 megabits. Divide by the upload rate for seconds, then " +
              "turn seconds into hours."
          ],
          explain: s.backupGB + " GB is about " + (s.backupGB * 8000) + " Mb. Divided by " +
            s.available[0].up + " Mb/s that is " +
            Math.round(s.backupGB * 8000 / s.available[0].up) + " seconds, which is about " +
            (Math.round((s.backupGB * 8000 / s.available[0].up / 3600) * 10) / 10) + " hours." },
        { key: "nt-link", kind: "choice",
          prompt: s.wantsFast
            ? "Their nightly backup runs until lunchtime. Which of these fixes that?"
            : "Which link suits this site best?",
          hints: [
            s.wantsFast
              ? "A backup is data going OUT. Look at the column most people never read."
              : "Start by ruling out the ones the building cannot physically have.",
            s.wantsFast
              ? "Download speed does nothing for an upload. Compare the up figures and nothing else first."
              : "Then compare what it costs them in latency, because one of these is much worse than the others."
          ],
          options: sixOptions(s.available.map(function (l) {
            const best = s.wantsFast
              ? (l.up === Math.max.apply(null, s.available.map(function (x) { return x.up; })))
              : (l === s.bestAvailable);
            return {
              key: l.key,
              label: l.name + " — " + l.down + " down, " + l.up + " up, " + l.latency + " latency",
              correct: best,
              why: best
                ? "Yes. " + l.note
                : (s.wantsFast
                    ? "Its upload is " + l.up + " Mb, and the backup is an upload. " + l.note
                    : "Not the strongest option here. " + l.note)
            };
          }), s.seed + 101),
          explain: s.wantsFast
            ? "A nightly backup is upload. Download figures are the ones on the advert and the " +
              "ones nobody needed."
            : "Availability first, then the trade-off that actually bites this site." }
      ]
    };
  }

  /* ---- 2.5 : the hardware -------------------------------------------- */
  if (key === "kit") {
    const fib = rng(s.seed + 733).pick(FIBRE_CASES);
    const jobs = [
      { job: "Put twelve wired desks on one network", right: "switch" },
      { job: "Join the office network to the provider's", right: "router" },
      { job: "Power a ceiling AP that has no socket near it", right: "poe" },
      { job: "Terminate the permanent runs so nothing is re-punched", right: "panel" }
    ];
    return {
      title: "Pick the box for the job",
      intro: "Every one of these is a real requirement from the walk-round. One device does each.",
      panels: [
        { kind: "table", title: "What is in the cupboard",
          columns: ["Device", "Operates at layer", "What it is for"],
          rows: KIT.map(function (k) { return { cells: [k.name, k.layer, k.for] }; }) },
        benchPanel({
          title: "The fibre ends, and what separates them",
          intro: "Left column pushes in, right column locks mechanically. Three of the four " +
            "share a 2.5 mm ferrule and LC's is 1.25, which is the entire reason LC exists — " +
            "half the ferrule is half the footprint, so a duplex pair fits where one SC used to.",
          height: 440,
          spec: function () { return fibreBench({}); },
          words: "Four ends, one scale",
          detail: "Ordering the wrong one is a wasted visit: none of these four mates with any " +
            "of the other three."
        })
      ],
      questions: [{
        key: "nt-fibre", kind: "choice",
        prompt: "From the survey: “" + fib.said + "” Which fibre end does that describe?",
        hints: [
          "Colour will not settle this one. Blue, green and aqua say what POLISH and what " +
            "glass, not which connector — so read for how the thing holds on instead.",
          "There are only four mechanisms in the whole family: a small latch, a square " +
            "push-pull, a quarter-turn bayonet and a screw thread. The description names one " +
            "of them, in ordinary words.",
          "Two of these are metal and keyed, and they are metal because they go where things " +
            "move. If nothing in the description mentions vibration, twisting or a thread, " +
            "you are looking at one of the two that simply push in."
        ],
        options: fromPool(FIBRE_OPTS, fib.key, fib.tell, s.seed + 733),
        explain: fib.tell
      }].concat(jobs.map(function (j, i) {
        return {
          key: "nt-kit-" + i, kind: "choice",
          prompt: j.job,
          hints: [
            "Look at the layer column. It tells you what the device is allowed to make decisions about.",
            "A device that works at layer 2 cannot choose between networks, and a device at layer 1 " +
              "does not make decisions at all — it carries."
          ],
          options: sixOptions(KIT.map(function (k) {
            return { key: k.key, label: k.name, correct: k.key === j.right,
              why: k.key === j.right ? "Yes. " + k.for
                : k.name + " is for " + k.for.charAt(0).toLowerCase() + k.for.slice(1) + "." };
          }), s.seed + 103),
          explain: "Match the job to what the device is FOR, not to what it has ports for."
        };
      }))
    };
  }

  /* ---- 2.1 : the ports ------------------------------------------------ */
  if (key === "ports") {
    return {
      title: "Open the right holes, and nothing else",
      intro: "The firewall is closed. They have told you what they need to do; you decide what " +
        "that means in port numbers.",
      panels: [
        { kind: "note", title: "What they asked for",
          paragraphs: s.needs.map(function (n) {
            return "“" + n.said + "” — " + n.because;
          }).concat(["Every site needs ordinary web browsing, which is already allowed."]) },
        benchPanel({
          title: "Where the holes are being opened",
          intro: "A port is not an abstraction — it is a rule in the box between the switch "
            + "and the handoff, and the traffic it allows crosses every link to the right of "
            + "it. Every hop drawn here is a real device someone can walk up to, which is the "
            + "point: a rule opened at the wrong box protects nothing and a rule opened at the "
            + "right one is the only thing standing between that service and the internet.",
          spec: function () { return netBench({}); },
          height: 400,
          words: "Every hop up, the firewall closed",
          detail: "Nothing here is marked and nothing has failed. The whole path is working; "
            + "what you are deciding is what it is allowed to carry."
        }),
        { kind: "table", title: "The rule set you can build from",
          columns: ["Service", "Port", "Transport", "What it does"],
          rows: PORTS.map(function (p) {
            return { cells: [p.name, String(p.port), p.tcp ? "TCP" : "UDP", p.what] };
          }) }
      ],
      questions: [{
        key: "nt-ports", kind: "multi",
        prompt: "Which of these do you open? Pick every one they need and none they do not.",
        detail: "Opening more than is needed is the most common mistake here, and the most expensive.",
        hints: [
          "Go back through what they actually said, one line at a time. Each line maps to exactly " +
            "one service.",
          "Two of the choices are the insecure sibling of another. If a secure version does the " +
            "same job, the insecure one is not something to open on purpose."
        ],
        options: PORTS.map(function (p) {
          const want = s.openPorts.indexOf(p.key) !== -1;
          return {
            key: p.key,
            label: p.name + " — " + (p.tcp ? "TCP " : "UDP ") + p.port,
            correct: want,
            why: want
              ? "Yes. " + p.what
              : (p.key === "http" && s.openPorts.indexOf("https") !== -1
                  ? "No. HTTPS already covers this and does it encrypted; opening 80 as well adds " +
                    "risk and no capability."
                  : (p.key === "imap"
                      ? "No. That is IMAP in the clear on 143. IMAPS on 993 does the same job over TLS."
                      : "No. Nothing they described needs " + p.name + " (" + p.port + ")."))
          };
        }),
        explain: "The rule set should read like their requirements list and nothing else."
      }]
    };
  }

  /* ---- 5.5 : the fault ------------------------------------------------ */
  if (key === "fault") {
    return {
      title: "Walk the path",
      intro: "One user, one complaint. Seven hops between the provider and their desk, and " +
        "nothing tested.",
      panels: [pathPanel(s, { reveal: false }), {
        kind: "note", title: "What you can see from where you are standing",
        paragraphs: [s.fault.tell]
      }],
      questions: [
        { key: "nt-where", kind: "choice",
          prompt: "Which hop do you go and stand at?",
          hints: [
            "Read the tell again. It rules out everything on one side of the path in a single sentence.",
            "Ask who else is affected. One desk points at the far end of the path; the whole building " +
              "points at the near end."
          ],
          options: sixOptions(HOPS.map(function (h) {
            const right = h.key === s.fault.hop;
            return { key: h.key, label: h.label, correct: right,
              why: right ? "Yes. " + s.fault.why
                : "Not here. " + h.hint + " — and nothing in the symptom points at it." };
          }), s.seed + 107),
          explain: s.fault.name + ". " + s.fault.why },
        { key: "nt-tool", kind: "choice",
          prompt: "What do you take with you?",
          hints: [
            "Two things on this list are not diagnostic tools at all. Rule those out first.",
            "Of what is left, ask what each one actually measures, and which of those measurements " +
              "would settle this particular question."
          ],
          options: sixOptions(TOOLS.map(function (t) {
            const right = t.key === s.fault.tool;
            return { key: t.key, label: t.name, correct: right,
              why: right ? "Yes. It finds " + t.finds + "." : "It finds " + t.finds + "." };
          }), s.seed + 113),
          explain: "A tool that cannot answer the question in front of you is weight in the bag." }
      ]
    };
  }

  /* ---- 2.3 : the hosts ------------------------------------------------ */
  if (key === "hosts") {
    return {
      title: "Which server stopped doing its job?",
      intro: "The site runs its own servers. One of them has fallen over, and the users have " +
        "described the symptom rather than the cause, because that is what users do.",
      panels: [{
        kind: "table", title: "What runs in the cupboard",
        columns: ["Server", "What it does for the site"],
        rows: HOSTS.map(function (h) { return { cells: [h.name, h.does] }; })
      }, {
        kind: "note", title: "What is being reported",
        paragraphs: [s.brokenHost.fails]
      }],
      questions: [{
        key: "nt-host", kind: "choice",
        prompt: "Which one is it?",
        hints: [
          "Work out what is still WORKING. That is usually a shorter list, and it eliminates faster " +
            "than what is broken.",
          "Each of these servers does exactly one thing for the site. Find the one whose single job " +
            "matches the symptom."
        ],
        options: sixOptions(HOSTS.map(function (h) {
          const right = h.key === s.brokenHost.key;
          return { key: h.key, label: h.name, correct: right,
            why: right ? "Yes. " + h.does + ". When it stops: " + h.fails.toLowerCase()
              : "If that were down you would see: " + h.fails.toLowerCase() + "." };
        }), s.seed + 109),
        explain: s.brokenHost.name + ". " + s.brokenHost.does + "."
      }]
    };
  }

  /* ---- 2.8 : the tools ------------------------------------------------ */
  if (key === "tools") {
    const term = rng(s.seed + 811).pick(TERM_CASES);
    const cases = [
      { sym: "Forty identical white cables in the panel and no labels on any of them", right: "toner" },
      { sym: "A run that links at 100 Mb but never at gigabit", right: "tester" },
      { sym: "You need to know whether a switch port is alive, and you are on your own", right: "loopback" },
      { sym: "Users say the wireless is slow in one corner and fine everywhere else", right: "wifi" }
    ];
    return {
      title: "The fault you cannot see",
      intro: "None of these can be diagnosed by looking. Pick what you carry.",
      panels: [
        { kind: "table", title: "In the bag",
          columns: ["Tool", "What it finds"],
          rows: TOOLS.map(function (t) { return { cells: [t.name, t.finds] }; }) },
        benchPanel({
          title: "Both standards, side by side",
          intro: "T568A and T568B on the same plug. Only the orange and green pairs move — " +
            "blue and brown sit on 4, 5, 7 and 8 in both, which is why a wrong end still " +
            "carries a phone line and still passes a continuity test.",
          height: 420,
          spec: function () { return rj45Bench({}); },
          words: "Two ends, nothing tested",
          detail: "A termination fault is the one thing in this bag you cannot see. Look along " +
            "the contacts and at which colour sits on which pin."
        })
      ],
      questions: [{
        key: "nt-term", kind: "choice",
        prompt: "A run comes back from the tester like this: “" + term.said + "” " +
          "What is actually wrong with it?",
        hints: [
          "Read what the tester DID pass as carefully as what it failed. A test that passes " +
            "rules things out, and here it rules out most of the list.",
          "Continuity and pairing are different claims. A wire can reach the right pin and " +
            "still have been robbed from the wrong pair — and only one of those two faults " +
            "shows up on a simple tester.",
          "Two of these are not termination faults at all: one is about the LENGTH of the run " +
            "and one is about the SHIELD. If the symptom appears under load or over distance " +
            "rather than at the plug, the plug may be innocent."
        ],
        options: fromPool(TERM_OPTS, term.key, term.tell, s.seed + 811),
        explain: term.tell
      }].concat(cases.map(function (c, i) {
        return {
          key: "nt-tool-" + i, kind: "choice", prompt: c.sym,
          hints: [
            "Two things in that bag make things rather than measure them. They are never the answer " +
              "to “how do I find out”.",
            "Ask what measurement would end the argument, then find the tool that takes it."
          ],
          options: sixOptions(TOOLS.map(function (t) {
            return { key: t.key, label: t.name, correct: t.key === c.right,
              why: t.key === c.right ? "Yes. It finds " + t.finds + "."
                : "That finds " + t.finds + "." };
          }), s.seed + 127),
          explain: "Match the measurement to the question."
        };
      }))
    };
  }

  /* ---- 4.1 : virtualization ------------------------------------------- */
  if (key === "virt") {
    const need = s.vms.reduce(function (a, v) { return a + v.cores; }, 0);
    const needRam = s.vms.reduce(function (a, v) { return a + v.ram; }, 0);
    return {
      title: "Put the cupboard on one host",
      intro: "Three physical servers, all of them idle most of the day. One host can run all " +
        "three — if the arithmetic works.",
      panels: [{
        kind: "table", title: "What has to move",
        columns: ["Server", "Cores it needs", "Memory it needs"],
        rows: s.vms.map(function (v) {
          return { cells: [v.name, String(v.cores), v.ram + " GB"] };
        })
      }, {
        kind: "note", title: "The host on the shelf",
        paragraphs: [s.vmHostCores + " cores and " + s.vmHostRam + " GB of memory, with a " +
          "hypervisor that runs straight on the hardware rather than inside another operating system."]
      }],
      questions: [
        { key: "nt-virt-ram", kind: "number",
          prompt: "How much memory do the three guests need between them?",
          unit: "GB", answer: needRam, tolerance: 0,
          hints: [
            "The table gives you all three figures. This is addition, not a trick.",
            "Add the three memory figures. Then remember the host needs some for itself, which is " +
              "the next question rather than this one."
          ],
          explain: s.vms.map(function (v) { return v.ram; }).join(" + ") + " = " + needRam + " GB." },
        { key: "nt-virt-type", kind: "choice",
          prompt: "What kind of hypervisor is that, and why does it matter here?",
          hints: [
            "The note says it runs straight on the hardware. That phrase is the definition of one " +
              "of the two types.",
            "Ask what is underneath the hypervisor in each case, and what that costs you."
          ],
          options: [
            { key: "t1", label: "Type 1 — it runs on the bare metal, with no host OS beneath it",
              correct: true,
              why: "Yes. Nothing sits between it and the hardware, so there is no host operating " +
                "system taking memory, taking CPU, or needing its own patching and reboots." },
            { key: "t2", label: "Type 2 — it runs as an application inside an ordinary operating system",
              correct: false,
              why: "That is the other kind, and it is what you run on a laptop to test something. " +
                "The host OS underneath it is overhead you do not want on a server." },
            { key: "cont", label: "A container engine — the guests share the host's kernel",
              correct: false,
              why: "Containers share a kernel and package an application rather than a whole machine. " +
                "These three guests are whole servers with their own operating systems." },
            { key: "emu", label: "An emulator — it pretends to be different hardware",
              correct: false,
              why: "Emulation translates one architecture to another and is slow. Nothing here needs it." }
          ,
            { key: "para", label: "Paravirtualization \u2014 the guests know they are virtual and cooperate",
              correct: false,
              why: "A real technique and a real term, and it describes how the guest talks to the " +
                "hypervisor rather than what the hypervisor runs ON. It does not answer the " +
                "question of what is underneath." },
            { key: "vdi", label: "VDI \u2014 desktops delivered to thin clients from the server",
              correct: false,
              why: "That is what you might BUILD on a hypervisor, not a kind of hypervisor. Keep " +
                "the layer straight: this asks what the virtualization runs on, not what it is " +
                "being used for." }
          ],
          explain: "Type 1 on a server, type 2 on a desktop. The difference is whether an operating " +
            "system sits underneath." }
      ]
    };
  }

  /* ---- 4.2 : cloud ---------------------------------------------------- */
  if (key === "cloud") {
    return {
      title: "What should not be in the cupboard at all",
      intro: "Some of this belongs on somebody else's hardware. Which, and on what terms, is the " +
        "question that decides their next five years.",
      panels: [{
        kind: "note", title: "What the provider is offering",
        paragraphs: [
          "“You get virtual machines. You install and patch whatever you like on them, and we " +
            "keep the hardware running.”",
          "You are billed per gigabyte stored and per hour of compute used, and you can see the " +
            "running total on a dashboard.",
          "The resource pool is shared with other customers, and capacity is added within minutes " +
            "when you ask for it."
        ]
      }],
      questions: [
        { key: "nt-cloud-model", kind: "choice",
          prompt: "Which service model is that first paragraph describing?",
          hints: [
            "Ask where the line falls: what does the provider look after, and what is left to you?",
            "If you are installing and patching operating systems yourself, you have been handed " +
              "infrastructure rather than a platform or a finished application."
          ],
          options: [
            { key: "iaas", label: "Infrastructure as a service", correct: true,
              why: "Yes. You get the machines; everything above the hardware is still yours to run." },
            { key: "paas", label: "Platform as a service", correct: false,
              why: "There you deploy code and the provider runs the operating system and the runtime. " +
                "Nobody here mentioned taking the OS off your hands." },
            { key: "saas", label: "Software as a service", correct: false,
              why: "That is a finished application you just sign in to. You would not be patching anything." },
            { key: "daas", label: "Desktop as a service", correct: false,
              why: "That is hosted desktops for users, which is not what was described." }
          ,
            { key: "faas", label: "Function as a service", correct: false,
              why: "Real, and further up the stack than any of it: you hand over single functions " +
                "and never see a server or a runtime at all. If the paragraph mentions machines, " +
                "operating systems or sizing, it has already ruled this out." },
            { key: "private", label: "A private cloud", correct: false,
              why: "That is a DEPLOYMENT model \u2014 who owns the tin and who else is on it \u2014 " +
                "not a service model. Private, public, hybrid and community answer a different " +
                "question from infrastructure, platform and software." }
          ],
          explain: "The line between the models is how much of the stack the provider is holding." },
        { key: "nt-cloud-chars", kind: "multi",
          prompt: "Which characteristics did the other two paragraphs describe? Pick every one.",
          detail: "Three of these were described. The rest were not.",
          hints: [
            "Take the paragraphs one sentence at a time. Each sentence is naming exactly one thing.",
            "“Billed per hour and you can see the total” is one of them, and it has a name " +
              "that sounds like what it does."
          ],
          options: [
            { key: "measured", label: "Measured service", correct: true,
              why: "Yes — billed by what you use, with the usage visible to you." },
            { key: "pooled", label: "Shared resources, pooled across customers", correct: true,
              why: "Yes — the pool is explicitly shared." },
            { key: "elastic", label: "Rapid elasticity", correct: true,
              why: "Yes — capacity added within minutes when asked for." },
            { key: "ha", label: "High availability", correct: false,
              why: "Nothing here promised it. It is a real characteristic and it was not described." },
            { key: "private", label: "A private cloud, dedicated to this customer", correct: false,
              why: "The opposite — the pool is shared, which makes it public." },
            { key: "sync", label: "File synchronisation", correct: false,
              why: "Not mentioned. It is a cloud feature, not one of these paragraphs." }
          ],
          explain: "Measured service, resource pooling and rapid elasticity. High availability is " +
            "real and was not offered, which is worth noticing before signing anything." }
      ]
    };
  }

  /* ---- the walk-back -------------------------------------------------- */
  if (key === "prove") {
    return {
      title: "Prove it, and say it in a sentence",
      intro: "You found it. Now show the path with the fault on it, and tell the customer what " +
        "happened without using a single acronym.",
      panels: [pathPanel(s, { reveal: true })],
      questions: [{
        key: "nt-say", kind: "choice",
        prompt: "Which of these do you actually say to them?",
        hints: [
          "One of these is true and useless, one is false and comforting, and one is true and " +
            "tells them what happens next.",
          "They do not need to know what you tested. They need to know what was wrong, what you " +
            "did, and whether it can happen again."
        ],
        options: [
          { key: "plain", correct: true,
            label: "“" + s.fault.name.charAt(0).toUpperCase() + s.fault.name.slice(1) +
              ". I have fixed it, and here is what would stop it happening again.”",
            why: "Yes. What was wrong, what you did, and what it means for them." },
          { key: "jargon", correct: false,
            label: "“The " + s.fault.hop + " was the failure domain, so I isolated it at layer two.”",
            why: "True and useless. They cannot act on it, and it reads as evasion even when it is not." },
          { key: "blame", correct: false,
            label: "“Somebody must have unplugged something.”",
            why: "You do not know that, and it turns a repair into an accusation." },
          { key: "vague", correct: false,
            label: "“It should be fine now.”",
            why: "Says nothing, promises everything, and guarantees a second call." }
        ,
            { key: "long", label: "\u201cThe DHCP scope had exhausted its lease pool, so clients " +
                "fell back to APIPA in the 169.254 range until I extended the scope.\u201d",
              correct: false,
              why: "Every word of this is true, and it is the most tempting wrong answer here " +
                "because being right feels like being clear. They cannot act on it. Say what " +
                "broke, what you did, and what stops it happening again \u2014 in their words." },
            { key: "future", label: "\u201cIt is fixed, but honestly this whole network needs " +
                "replacing.\u201d", correct: false,
              why: "It may even be true, and it lands as a sales pitch attached to a fault report. " +
                "Close this job properly first; a recommendation that big deserves its own " +
                "conversation and its own evidence." }
          ],
        explain: "The handover is part of the job, and it is the part they remember."
      }]
    };
  }

  return null;
}

/* ---------------------------------------------------------------------
   selfCheck — the invariants of THIS lab, living with it.
   --------------------------------------------------------------------- */
export function selfCheck(sc) {
  const fail = [];
  const ok = function (c, m) { if (!c) fail.push(m); };

  ok(!!sc.fault, "no fault generated");
  ok(HOPS.some(function (h) { return h.key === sc.fault.hop; }),
     "fault " + sc.fault.key + " lives at hop \"" + sc.fault.hop + "\", which is not on the path");
  ok(sc.available.length >= 2, "fewer than two links offered");
  ok(sc.needs.length === 2, "expected exactly two stated needs");
  ok(sc.openPorts.indexOf("https") !== -1, "HTTPS should always be in the answer set");
  ok(sc.vms.length === 3, "expected three guests to consolidate");

  /* The ports question must be answerable: every wanted port has to exist
     in the table the student is shown. A question whose right answer is
     not on screen is the bug this catches. */
  sc.openPorts.forEach(function (k) {
    ok(PORTS.some(function (p) { return p.key === k; }),
       "port \"" + k + "\" is in the answer set but not in the table");
  });

  /* The link question must have exactly one best answer, or it cannot be
     marked. This has bitten three other labs in this build. */
  /* Find it by KEY, not by position. This read questions[0] until a
     calculation question was inserted ahead of it to satisfy the four-gap
     rule, at which point the check started reading .options off a number
     question and threw instead of reporting. */
  const st = buildStage("brief", sc);
  const link = st.questions.filter(function (q) { return q.key === "nt-link"; })[0];
  ok(!!link, "the brief stage has no nt-link question");
  const rights = ((link && link.options) || []).filter(function (o) { return o.correct; });
  ok(rights.length === 1,
     "the link question has " + rights.length + " correct answers, not one");

  /* The inserted backup calculation has to be answerable from the numbers
     the student is actually shown: the line it names must be the one whose
     upload speed is on screen, and the answer must be a real number. */
  const backup = st.questions.filter(function (q) { return q.key === "nt-backup"; })[0];
  ok(!!backup, "the brief stage has no nt-backup question");
  if (backup) {
    ok(isFinite(backup.answer) && backup.answer > 0,
       "the backup question's answer is " + backup.answer + ", which is not a usable figure");
  }

  /* The tool the fault names has to be a tool that exists. */
  ok(TOOLS.some(function (t) { return t.key === sc.fault.tool; }),
     "fault names tool \"" + sc.fault.tool + "\", which is not in the bag");

  return fail;
}

export function variantKey(sc) { return sc.fault.key + "/" + sc.brokenHost.key; }

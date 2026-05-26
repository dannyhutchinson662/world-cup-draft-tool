import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  ClipboardList,
  Download,
  Maximize2,
  Minimize2,
  Plus,
  RotateCcw,
  Search,
  Trophy,
  Undo2,
  Users,
  X,
} from "lucide-react";
import { STARTER_PLAYERS } from "./data/players.js";

const PICK_TIMER_SECONDS = 120;
const COMPETITION_LOGO_SRC = "/fantasy-cup-logo.png";

// Firebase/live viewing is deliberately not enabled yet.
// The UI and URL structure are ready for a future viewer-only Firebase layer.
const FIREBASE_ENABLED = false;

function Card({ className = "", children }) {
  return <div className={`rounded-2xl border ${className}`}>{children}</div>;
}

function CardContent({ className = "", children }) {
  return <div className={className}>{children}</div>;
}

function Button({ className = "", variant = "primary", disabled = false, children, ...props }) {
  const base = "inline-flex items-center justify-center font-semibold transition disabled:cursor-not-allowed disabled:opacity-40";
  const styles =
    variant === "secondary"
      ? "border border-amber-200 bg-white text-slate-800 hover:bg-amber-50"
      : "bg-slate-900 text-white hover:bg-slate-700";
  return (
    <button className={`${base} ${styles} ${className}`} disabled={disabled} {...props}>
      {children}
    </button>
  );
}

const DEFAULT_MANAGERS = Array.from({ length: 20 }, (_, index) => `Manager ${index + 1}`);
const positions = ["All", "Goalkeeper", "Defender", "Midfielder", "Attacker", "Forward"];

function ratingLabel(rating) {
  if (typeof rating === "string") return rating === "OKay" ? "Okay" : rating;
  const labels = {
    1: "Elite",
    2: "Strong",
    3: "Good",
    4: "Okay",
    5: "Below Average",
  };
  return labels[rating] || "Unrated";
}

const countries = ["All", ...Array.from(new Set(STARTER_PLAYERS.map((player) => player.country))).sort()];
const preferredCategories = ["Elite", "Strong", "Good", "Okay", "Below Average", "Very Good"];
const categories = [
  "All",
  ...preferredCategories.filter((category) => STARTER_PLAYERS.some((player) => ratingLabel(player.rating) === category)),
];

function formatDraftTimer(totalSeconds) {
  const safeSeconds = Math.max(0, Number(totalSeconds || 0));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function getInitialRoomId() {
  if (typeof window === "undefined") return "draft-night";
  const params = new URLSearchParams(window.location.search);
  const existingRoom = params.get("room");
  if (existingRoom) return existingRoom;
  const generatedRoom = `draft-${Math.random().toString(36).slice(2, 8)}`;
  params.set("room", generatedRoom);
  window.history.replaceState({}, "", `${window.location.pathname}?${params.toString()}`);
  return generatedRoom;
}

function getInitialViewerMode() {
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  return params.get("view") === "1";
}

function buildDraftUrl(roomId, viewer = false) {
  if (typeof window === "undefined") return "";
  const url = new URL(window.location.href);
  url.searchParams.set("room", roomId || "draft-night");
  if (viewer) {
    url.searchParams.set("view", "1");
  } else {
    url.searchParams.delete("view");
  }
  return url.toString();
}

function getPickTeamIndex(pickNumber, managerCount, snake = true) {
  const zeroPick = pickNumber - 1;
  const round = Math.floor(zeroPick / managerCount);
  const positionInRound = zeroPick % managerCount;
  if (!snake || round % 2 === 0) return positionInRound;
  return managerCount - 1 - positionInRound;
}

function getBoardPickNumber(round, managerIndex, managerCount, snake = true) {
  if (snake && round % 2 === 0) {
    return (round - 1) * managerCount + (managerCount - managerIndex);
  }
  return (round - 1) * managerCount + managerIndex + 1;
}

function normalisePosition(position) {
  return position === "Forward" ? "Attacker" : position;
}

function positionBadge(position) {
  const labels = {
    Goalkeeper: "GK",
    Defender: "DEF",
    Midfielder: "MID",
    Attacker: "ATT",
    Forward: "ATT",
  };
  return labels[position] || position;
}

function positionColour(position) {
  const normalised = normalisePosition(position);
  const colours = {
    Attacker: "bg-green-600 text-white border-green-700",
    Defender: "bg-red-600 text-white border-red-700",
    Midfielder: "bg-orange-500 text-white border-orange-600",
    Goalkeeper: "bg-purple-600 text-white border-purple-700",
  };
  return colours[normalised] || "bg-slate-200 text-slate-800 border-slate-300";
}

function positionCardColour(position) {
  const normalised = normalisePosition(position);
  const colours = {
    Attacker: "border-green-400 bg-green-50 hover:bg-green-100",
    Defender: "border-red-400 bg-red-50 hover:bg-red-100",
    Midfielder: "border-orange-400 bg-orange-50 hover:bg-orange-100",
    Goalkeeper: "border-purple-400 bg-purple-50 hover:bg-purple-100",
  };
  return colours[normalised] || "border-slate-300 bg-white hover:bg-slate-50";
}

function positionTextColour(position) {
  const normalised = normalisePosition(position);
  const colours = {
    Attacker: "text-green-700",
    Defender: "text-red-700",
    Midfielder: "text-orange-600",
    Goalkeeper: "text-purple-700",
  };
  return colours[normalised] || "text-slate-950";
}

function countryFlagCode(country) {
  const codes = {
    Algeria: "dz",
    Argentina: "ar",
    Austria: "at",
    Belgium: "be",
    "Bosnia and Herzegovina": "ba",
    Brazil: "br",
    Canada: "ca",
    Colombia: "co",
    Congo: "cg",
    Croatia: "hr",
    Czechia: "cz",
    Ecuador: "ec",
    Egypt: "eg",
    England: "gb-eng",
    France: "fr",
    Germany: "de",
    Ghana: "gh",
    Iran: "ir",
    Iraq: "iq",
    "Ivory Coast": "ci",
    Japan: "jp",
    Mexico: "mx",
    Morocco: "ma",
    Netherlands: "nl",
    Norway: "no",
    Paraguay: "py",
    Portugal: "pt",
    Qatar: "qa",
    Scotland: "gb-sct",
    Scotlland: "gb-sct",
    Senegal: "sn",
    "South Africa": "za",
    "South Korea": "kr",
    Spain: "es",
    Sweden: "se",
    Switzerland: "ch",
    Tunisia: "tn",
    Turkey: "tr",
    Türkiye: "tr",
    Uruguay: "uy",
    Uzbekistan: "uz",
    USA: "us",
    "United States": "us",
  };
  return codes[country] || "xx";
}

function countryFlagUrl(country) {
  const code = countryFlagCode(country);
  if (code === "xx") {
    const fallbackSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 40"><rect width="60" height="40" fill="#e5e7eb"/><path d="M0 0h60v40H0z" fill="none" stroke="#94a3b8" stroke-width="2"/><text x="30" y="25" text-anchor="middle" font-size="10" font-family="Arial" fill="#64748b">?</text></svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(fallbackSvg)}`;
  }
  return `https://flagcdn.com/${code}.svg`;
}

function CountryFlag({ country, className = "h-4 w-6" }) {
  return (
    <img
      src={countryFlagUrl(country)}
      alt={`${country} flag`}
      title={`${country} flag`}
      className={`${className} inline-block rounded-[2px] object-cover shadow-sm ring-1 ring-black/10`}
      loading="lazy"
    />
  );
}

function ratingBadgeColour(rating) {
  const label = ratingLabel(rating);
  const colours = {
    Elite: "bg-yellow-400 text-slate-950 border-yellow-600",
    Strong: "bg-purple-600 text-white border-purple-700",
    Good: "bg-green-600 text-white border-green-700",
    Okay: "bg-yellow-200 text-yellow-950 border-yellow-500",
    "Below Average": "bg-orange-500 text-white border-orange-600",
    "Very Good": "bg-blue-600 text-white border-blue-700",
  };
  return colours[label] || "bg-slate-200 text-slate-800 border-slate-300";
}

function runSelfTests() {
  console.assert(STARTER_PLAYERS.length === 218, "Expected exactly 218 valid imported players");
  console.assert(STARTER_PLAYERS[0].rank === 1, "First player should be ranked 1");
  console.assert(STARTER_PLAYERS[217].rank === 218, "Last imported player should keep rank 218");
  console.assert(!STARTER_PLAYERS.some((player) => !player.name || !player.country || !player.position || !player.rating), "Imported players should not contain blank player rows");
  console.assert(!STARTER_PLAYERS.some((player, index) => player.rank !== index + 1), "Imported player ranks should run consecutively from 1 to 218");
  console.assert(STARTER_PLAYERS[0].name === "Kylian Mbappé", "Rank 1 should be Kylian Mbappé");
  console.assert(STARTER_PLAYERS[217].name === "Osama Rashid", "Rank 218 should be Osama Rashid");
  console.assert(ratingLabel("Elite") === "Elite", "Elite rating should display as Elite");
  console.assert(ratingLabel("OKay") === "Okay", "OKay rating should display as Okay");
  console.assert(ratingBadgeColour("Elite").includes("bg-yellow-400"), "Elite rating should use a gold badge");
  console.assert(ratingBadgeColour("Strong").includes("bg-purple-600"), "Strong rating should use a purple badge");
  console.assert(ratingBadgeColour("Good").includes("bg-green-600"), "Good rating should use a green badge");
  console.assert(categories.includes("Elite"), "Category filter should include Elite");
  console.assert(categories.includes("Strong"), "Category filter should include Strong");
  console.assert(categories.includes("Good"), "Category filter should include Good");
  console.assert(formatDraftTimer(120) === "2:00", "120 seconds should format as 2:00");
  console.assert(formatDraftTimer(9) === "0:09", "9 seconds should format as 0:09");
  console.assert(positionBadge("Forward") === "ATT", "Forward should display as ATT");
  console.assert(positionTextColour("Attacker") === "text-green-700", "Attacker announcement text should be green");
  console.assert(positionTextColour("Defender") === "text-red-700", "Defender announcement text should be red");
  console.assert(countryFlagCode("England") === "gb-eng", "England should use the St George's Cross flag code");
  console.assert(countryFlagCode("Scotland") === "gb-sct", "Scotland should use the Saltire flag code");
  console.assert(countryFlagCode("Türkiye") === "tr", "Türkiye should use the Turkey flag code");
  console.assert(countryFlagCode("United States") === "us", "United States should use the USA flag code");
  console.assert(normalisePosition("Forward") === "Attacker", "Forward should normalise to Attacker");
  console.assert(getPickTeamIndex(1, 20, true) === 0, "Pick 1 should go to manager index 0");
  console.assert(getPickTeamIndex(20, 20, true) === 19, "Pick 20 should go to manager index 19");
  console.assert(getPickTeamIndex(21, 20, true) === 19, "Pick 21 should snake back to manager index 19");
  console.assert(getPickTeamIndex(40, 20, true) === 0, "Pick 40 should snake back to manager index 0");
  console.assert(getBoardPickNumber(2, 0, 20, true) === 40, "Round 2 first column should show pick 40");
  console.assert(getBoardPickNumber(2, 19, 20, true) === 21, "Round 2 last column should show pick 21");
}

runSelfTests();

export default function WorldCupFantasyDraftTool() {
  const [managersText, setManagersText] = useState(DEFAULT_MANAGERS.join(String.fromCharCode(10)));
  const [rounds, setRounds] = useState(5);
  const [snakeDraft] = useState(true);
  const [query, setQuery] = useState("");
  const [position, setPosition] = useState("All");
  const [country, setCountry] = useState("All");
  const [category, setCategory] = useState("All");
  const [drafted, setDrafted] = useState([]);
  const [customName, setCustomName] = useState("");
  const [customCountry, setCustomCountry] = useState("");
  const [customPosition, setCustomPosition] = useState("Attacker");
  const [players, setPlayers] = useState(STARTER_PLAYERS);
  const [fullscreenSection, setFullscreenSection] = useState(null);
  const [roomId, setRoomId] = useState(getInitialRoomId);
  const [viewerMode] = useState(getInitialViewerMode);
  const [syncStatus] = useState(FIREBASE_ENABLED ? "Connecting" : "Local only");
  const [pickStartedAt, setPickStartedAt] = useState(() => Date.now());
  const [timeRemaining, setTimeRemaining] = useState(PICK_TIMER_SECONDS);
  const [pickAnnouncement, setPickAnnouncement] = useState(null);
  const autoPickLock = useRef(false);
  const announcementTimeout = useRef(null);

  const managers = useMemo(
    () => managersText.split(String.fromCharCode(10)).map((name) => name.trim()).filter(Boolean),
    [managersText]
  );

  const totalPicks = managers.length * Number(rounds || 0);
  const currentPick = drafted.length + 1;
  const isDraftComplete = totalPicks > 0 && drafted.length >= totalPicks;
  const currentTeamIndex = managers.length && !isDraftComplete ? getPickTeamIndex(currentPick, managers.length, snakeDraft) : -1;
  const currentTeam = managers[currentTeamIndex] || "Add teams";

  const draftedIds = useMemo(() => new Set(drafted.map((pick) => pick.player.id)), [drafted]);

  const availablePlayers = useMemo(() => {
    return players
      .filter((player) => !draftedIds.has(player.id))
      .sort((a, b) => a.rank - b.rank);
  }, [players, draftedIds]);

  const filteredPlayers = useMemo(() => {
    return availablePlayers
      .filter((player) => position === "All" || player.position === position || normalisePosition(player.position) === position)
      .filter((player) => country === "All" || player.country === country)
      .filter((player) => category === "All" || ratingLabel(player.rating) === category)
      .filter((player) => {
        const text = `${player.name} ${player.country} ${player.position} ${player.rank} ${ratingLabel(player.rating)}`.toLowerCase();
        return text.includes(query.toLowerCase());
      })
      .sort((a, b) => a.rank - b.rank);
  }, [availablePlayers, position, country, category, query]);

  const board = useMemo(() => {
    const rows = [];
    for (let round = 1; round <= Number(rounds || 0); round += 1) {
      const row = [];
      for (let managerIndex = 0; managerIndex < managers.length; managerIndex += 1) {
        const displayPickNumber = getBoardPickNumber(round, managerIndex, managers.length, snakeDraft);
        const pick = drafted.find((item) => item.pickNumber === displayPickNumber);
        row.push({ round, displayPickNumber, manager: managers[managerIndex], managerIndex, pick });
      }
      rows.push(row);
    }
    return rows;
  }, [drafted, managers, rounds, snakeDraft]);

  const startNextPickTimer = () => {
    autoPickLock.current = false;
    setPickStartedAt(Date.now());
  };

  const showPickAnnouncement = (team, player, autoPicked = false, onClockTeam = "") => {
    if (!team || !player) return;
    if (announcementTimeout.current) window.clearTimeout(announcementTimeout.current);

    setPickAnnouncement({ id: `${Date.now()}-${player.id}`, team, player, autoPicked, onClockTeam });

    announcementTimeout.current = window.setTimeout(() => {
      setPickAnnouncement(null);
    }, 5000);
  };

  const draftPlayer = (player) => {
    if (viewerMode || drafted.length >= totalPicks || draftedIds.has(player.id)) return;
    const madePickNumber = drafted.length + 1;
    const nextPickNumber = madePickNumber + 1;
    const nextOnClockTeam =
      nextPickNumber <= totalPicks && managers.length
        ? managers[getPickTeamIndex(nextPickNumber, managers.length, snakeDraft)]
        : "Draft complete";

    setDrafted((previous) => [...previous, { pickNumber: previous.length + 1, team: currentTeam, player }]);
    showPickAnnouncement(currentTeam, player, false, nextOnClockTeam);
    startNextPickTimer();
  };

  const undoPick = () => {
    if (viewerMode) return;
    setDrafted((previous) => previous.slice(0, -1));
    startNextPickTimer();
  };

  const resetDraft = () => {
    if (viewerMode) return;
    setDrafted([]);
    startNextPickTimer();
  };

  const addCustomPlayer = () => {
    if (viewerMode || !customName.trim()) return;
    const newPlayer = {
      id: Date.now(),
      name: customName.trim(),
      country: customCountry.trim() || "Unknown",
      position: customPosition,
      rank: players.length + 1,
      rating: "Below Average",
    };
    setPlayers((previous) => [...previous, newPlayer]);
    setCustomName("");
    setCustomCountry("");
  };

  useEffect(() => {
    autoPickLock.current = false;
  }, [drafted.length]);

  useEffect(() => {
    if (isDraftComplete || totalPicks === 0) {
      setTimeRemaining(0);
      return undefined;
    }

    const updateTimer = () => {
      const elapsedSeconds = Math.floor((Date.now() - pickStartedAt) / 1000);
      const remainingSeconds = Math.max(PICK_TIMER_SECONDS - elapsedSeconds, 0);
      setTimeRemaining(remainingSeconds);

      if (remainingSeconds === 0 && !viewerMode && !autoPickLock.current) {
        autoPickLock.current = true;
        setDrafted((previous) => {
          if (previous.length >= totalPicks || !managers.length) return previous;
          const currentDraftedIds = new Set(previous.map((pick) => pick.player.id));
          const bestAvailablePlayer = players
            .filter((player) => !currentDraftedIds.has(player.id))
            .sort((a, b) => a.rank - b.rank)[0];
          if (!bestAvailablePlayer) return previous;
          const nextPickNumber = previous.length + 1;
          const nextTeamIndex = getPickTeamIndex(nextPickNumber, managers.length, snakeDraft);
          const nextTeam = managers[nextTeamIndex] || "Auto pick";
          const followingPickNumber = nextPickNumber + 1;
          const nextOnClockTeam =
            followingPickNumber <= totalPicks && managers.length
              ? managers[getPickTeamIndex(followingPickNumber, managers.length, snakeDraft)]
              : "Draft complete";
          showPickAnnouncement(nextTeam, bestAvailablePlayer, true, nextOnClockTeam);
          return [...previous, { pickNumber: nextPickNumber, team: nextTeam, player: bestAvailablePlayer, autoPicked: true }];
        });
        setPickStartedAt(Date.now());
      }
    };

    updateTimer();
    const timerId = window.setInterval(updateTimer, 250);
    return () => window.clearInterval(timerId);
  }, [pickStartedAt, viewerMode, isDraftComplete, totalPicks, managers, players, snakeDraft]);

  useEffect(() => {
    return () => {
      if (announcementTimeout.current) window.clearTimeout(announcementTimeout.current);
    };
  }, []);

  const copyShareLink = async (viewer = true) => {
    const link = buildDraftUrl(roomId, viewer);
    try {
      await navigator.clipboard.writeText(link);
    } catch (error) {
      console.error("Could not copy share link", error);
    }
  };

  const changeRoomId = (newRoomId) => {
    const cleanedRoomId = newRoomId.trim().replace(/[^a-zA-Z0-9-_]/g, "-");
    setRoomId(cleanedRoomId);
    if (typeof window !== "undefined" && cleanedRoomId) {
      const url = new URL(window.location.href);
      url.searchParams.set("room", cleanedRoomId);
      if (viewerMode) url.searchParams.set("view", "1");
      window.history.replaceState({}, "", url.toString());
    }
  };

  const copyDraftSummary = async () => {
    const summary = drafted
      .map((pick) => `${pick.pickNumber}. ${pick.team}: ${pick.player.name} (${pick.player.country}, ${pick.player.position}, Rank ${pick.player.rank}, ${ratingLabel(pick.player.rating)})`)
      .join(String.fromCharCode(10));
    try {
      await navigator.clipboard.writeText(summary || "No picks yet.");
    } catch (error) {
      console.error("Could not copy draft summary", error);
    }
  };

  const exportCsv = () => {
    const header = "Pick,Team,Player,Country,Position,Rank,Rating,Auto Picked";
    const rows = drafted.map((pick) =>
      [
        pick.pickNumber,
        pick.team,
        pick.player.name,
        pick.player.country,
        pick.player.position,
        pick.player.rank,
        ratingLabel(pick.player.rating),
        pick.autoPicked ? "Yes" : "No",
      ]
        .map((value) => `"${String(value).replaceAll('"', '""')}"`)
        .join(",")
    );
    const csvContent = [header, ...rows].join(String.fromCharCode(10));
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "world-cup-fantasy-draft.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const renderSectionShell = (sectionName, children) => {
    const isFullscreen = fullscreenSection === sectionName;
    return <div className={isFullscreen ? "fixed inset-0 z-50 overflow-auto bg-[#f6f2e8] p-3" : ""}>{children}</div>;
  };

  const renderFullscreenButton = (sectionName) => (
    <Button
      onClick={() => setFullscreenSection(fullscreenSection === sectionName ? null : sectionName)}
      variant="secondary"
      className="h-7 rounded-xl px-2 text-[10px]"
    >
      {fullscreenSection === sectionName ? <Minimize2 className="mr-1 h-3 w-3" /> : <Maximize2 className="mr-1 h-3 w-3" />}
      {fullscreenSection === sectionName ? "Exit" : "Fullscreen"}
    </Button>
  );

  return (
    <div className="min-h-screen bg-[#f6f2e8] p-2 text-slate-900 md:p-3">
      {pickAnnouncement && (
        <motion.div
          key={pickAnnouncement.id}
          initial={{ opacity: 0, y: -20, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.25 }}
          className="fixed left-1/2 top-6 z-[60] w-[min(94vw,980px)] -translate-x-1/2 rounded-3xl border-2 border-yellow-500 bg-white p-5 text-center shadow-2xl ring-4 ring-yellow-300/60"
        >
          <button
            type="button"
            onClick={() => {
              if (announcementTimeout.current) window.clearTimeout(announcementTimeout.current);
              setPickAnnouncement(null);
            }}
            className="absolute right-4 top-4 rounded-full bg-slate-100 p-2 text-slate-500 transition hover:bg-slate-200 hover:text-slate-900"
            aria-label="Close pick announcement"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="text-xs font-black uppercase tracking-[0.3em] text-yellow-700">
            {pickAnnouncement.autoPicked ? "Auto pick" : "Pick confirmed"}
          </div>
          <div className="mt-2 overflow-hidden text-ellipsis whitespace-nowrap px-10 text-xl font-black leading-tight text-slate-950 sm:text-2xl md:text-4xl">
            <span>{pickAnnouncement.team} selects </span>
            <span className={positionTextColour(pickAnnouncement.player.position)}>{pickAnnouncement.player.name}</span>
          </div>
          <div className="mt-3 flex items-center justify-center gap-2 text-sm font-bold text-slate-700 md:text-base">
            <span className={`rounded-full border px-3 py-1 text-xs font-black ${positionColour(pickAnnouncement.player.position)}`}>
              {positionBadge(pickAnnouncement.player.position)}
            </span>
            <span>{normalisePosition(pickAnnouncement.player.position)}</span>
            <span>•</span>
            <CountryFlag country={pickAnnouncement.player.country} className="h-5 w-7" />
            <span>{pickAnnouncement.player.country}</span>
          </div>
          <div className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            On the clock - {pickAnnouncement.onClockTeam || "Next player"}
          </div>
        </motion.div>
      )}

      <div className="mx-auto max-w-[1800px] space-y-3">
        <div className="rounded-2xl bg-white p-4 shadow-xl ring-1 ring-amber-200">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <img
                src={COMPETITION_LOGO_SRC}
                alt="Panini Fantasy World Cup logo"
                className="h-20 w-20 rounded-xl bg-white object-contain p-1 shadow-md ring-1 ring-amber-200"
              />
              <div>
                <div className="mb-1 flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.2em] text-slate-500">
                  <Trophy className="h-3 w-3" /> World Cup Fantasy Draft
                </div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900 md:text-2xl">Live Snake Draft Board</h1>
                <p className="mt-1 text-xs font-medium text-slate-600">Panini Fantasy World Cup draft night</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center text-xs sm:grid-cols-4">
              <div className="rounded-xl bg-amber-50 px-3 py-2 ring-1 ring-amber-200">
                <div className="text-[10px] uppercase tracking-widest text-slate-500">On clock</div>
                <div className="font-bold text-slate-900">{isDraftComplete ? "Complete" : currentTeam}</div>
              </div>
              <div className="rounded-xl bg-amber-50 px-3 py-2 ring-1 ring-amber-200">
                <div className="text-[10px] uppercase tracking-widest text-slate-500">Timer</div>
                <div className={`font-bold ${timeRemaining <= 15 && !isDraftComplete ? "text-red-600" : "text-amber-700"}`}>
                  {isDraftComplete ? "Done" : formatDraftTimer(timeRemaining)}
                </div>
              </div>
              <div className="rounded-xl bg-amber-50 px-3 py-2 ring-1 ring-amber-200">
                <div className="text-[10px] uppercase tracking-widest text-slate-500">Pick</div>
                <div className="font-bold text-slate-900">{Math.min(currentPick, totalPicks || 1)} / {totalPicks || 0}</div>
              </div>
              <div className="rounded-xl bg-amber-50 px-3 py-2 ring-1 ring-amber-200">
                <div className="text-[10px] uppercase tracking-widest text-slate-500">Status</div>
                <div className="font-bold text-slate-900">{viewerMode ? "Viewer" : syncStatus}</div>
              </div>
            </div>
          </div>
        </div>

        {renderSectionShell(
          "board",
          <Card className="border-amber-200 bg-white text-slate-900 shadow-xl">
            <CardContent className="p-2">
              <div className="mb-2 flex items-center justify-between gap-3 px-1">
                <div>
                  <h2 className="text-sm font-bold">Draft board</h2>
                  <p className="text-xs text-slate-500">
                    {drafted.length} of {totalPicks || 0} picks made. Round 2 reverses the order, then alternates each round.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-[10px]">
                  <div className="hidden gap-2 md:flex">
                    <span className="rounded-full border border-green-700 bg-green-600 px-2 py-1 text-white">ATT</span>
                    <span className="rounded-full border border-orange-600 bg-orange-500 px-2 py-1 text-white">MID</span>
                    <span className="rounded-full border border-red-700 bg-red-600 px-2 py-1 text-white">DEF</span>
                    <span className="rounded-full border border-purple-700 bg-purple-600 px-2 py-1 text-white">GK</span>
                  </div>
                  {renderFullscreenButton("board")}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[1600px] border-separate border-spacing-1">
                  <thead>
                    <tr>
                      <th className="w-12 text-left text-[9px] uppercase tracking-widest text-slate-500">Rnd</th>
                      {managers.map((manager, managerIndex) => {
                        const isOnClockColumn = managerIndex === currentTeamIndex && !isDraftComplete;
                        return (
                          <th
                            key={`${manager}-${managerIndex}`}
                            className={`rounded-lg p-1.5 text-left text-[10px] font-semibold ${
                              isOnClockColumn ? "bg-yellow-400 text-slate-950 ring-2 ring-yellow-500" : "bg-amber-50 text-slate-700"
                            }`}
                          >
                            {manager}
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {board.map((roundRow, roundIndex) => (
                      <tr key={roundIndex}>
                        <td className="rounded-lg bg-amber-50 p-1.5 text-xs font-semibold text-slate-900">{roundIndex + 1}</td>
                        {roundRow.map((slot) => {
                          const isOnClockCell = slot.managerIndex === currentTeamIndex && !isDraftComplete;
                          const cellClass = isOnClockCell
                            ? "border-yellow-500 bg-yellow-200 ring-2 ring-yellow-400"
                            : slot.pick
                              ? positionCardColour(slot.pick.player.position)
                              : "border-amber-200 bg-white";
                          return (
                            <td key={slot.displayPickNumber} className={`h-16 w-20 rounded-lg border p-1.5 align-top ${cellClass}`}>
                              <div className="mb-1 text-[9px] text-slate-500">#{slot.displayPickNumber}</div>
                              {slot.pick ? (
                                <div>
                                  <div className="truncate text-[11px] font-semibold leading-tight text-slate-900" title={slot.pick.player.name}>
                                    {slot.pick.player.name}
                                  </div>
                                  <div className="mt-0.5 flex items-center gap-1">
                                    <span className={`rounded-full border px-1 py-0.5 text-[8px] font-bold ${positionColour(slot.pick.player.position)}`}>
                                      {positionBadge(slot.pick.player.position)}
                                    </span>
                                    <CountryFlag country={slot.pick.player.country} className="h-3 w-5" />
                                    <span className="truncate text-[9px] text-slate-700">{slot.pick.player.country}</span>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-[10px] text-slate-400">Empty</div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-3 lg:grid-cols-[280px_1fr]">
          <div className="space-y-3">
            <Card className="border-amber-200 bg-white text-slate-900 shadow-xl">
              <CardContent className="space-y-2 p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-semibold">Live room</div>
                  <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] uppercase tracking-widest text-slate-700">
                    {FIREBASE_ENABLED ? syncStatus : "Setup needed"}
                  </span>
                </div>
                <label className="block text-xs font-medium text-slate-700">Room ID</label>
                <input
                  value={roomId}
                  onChange={(event) => changeRoomId(event.target.value)}
                  disabled={viewerMode}
                  className="w-full rounded-xl border border-amber-200 bg-amber-50 p-2 text-xs outline-none focus:ring-2 focus:ring-yellow-400 disabled:opacity-60"
                />
                <div className="grid grid-cols-2 gap-2">
                  <Button onClick={() => copyShareLink(true)} className="h-8 rounded-xl text-xs">Copy viewer link</Button>
                  <Button onClick={() => copyShareLink(false)} variant="secondary" className="h-8 rounded-xl text-xs">Copy admin link</Button>
                </div>
                {!FIREBASE_ENABLED && (
                  <p className="rounded-xl border border-amber-300 bg-amber-50 p-2 text-[11px] leading-4 text-amber-800">
                    Realtime phone viewing needs Firebase added in a later update. This version is ready for admin draft-night use.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="border-amber-200 bg-white text-slate-900 shadow-xl">
              <CardContent className="space-y-2 p-3">
                <div className="flex items-center gap-2 text-sm font-semibold"><Users className="h-4 w-4" /> Draft setup</div>
                <label className="block text-xs font-medium text-slate-700">Teams / managers, one per line</label>
                <textarea
                  value={managersText}
                  onChange={(event) => setManagersText(event.target.value)}
                  disabled={viewerMode}
                  className="h-28 w-full rounded-xl border border-amber-200 bg-amber-50 p-2 text-xs outline-none focus:ring-2 focus:ring-yellow-400 disabled:opacity-60"
                />
                <div>
                  <label className="block text-xs font-medium text-slate-700">Rounds</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={rounds}
                    onChange={(event) => setRounds(event.target.value)}
                    disabled={viewerMode}
                    className="mt-1 w-full rounded-xl border border-amber-200 bg-amber-50 p-2 text-xs outline-none focus:ring-2 focus:ring-yellow-400 disabled:opacity-60"
                  />
                </div>
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-2 text-xs text-slate-700">
                  Draft type: <span className="font-semibold text-slate-900">Classic snake</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button onClick={undoPick} variant="secondary" className="h-8 rounded-xl text-xs" disabled={!drafted.length || viewerMode}>
                    <Undo2 className="mr-1 h-3 w-3" /> Undo
                  </Button>
                  <Button onClick={resetDraft} variant="secondary" className="h-8 rounded-xl text-xs" disabled={!drafted.length || viewerMode}>
                    <RotateCcw className="mr-1 h-3 w-3" /> Reset
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button onClick={copyDraftSummary} className="h-8 rounded-xl text-xs"><ClipboardList className="mr-1 h-3 w-3" /> Copy</Button>
                  <Button onClick={exportCsv} className="h-8 rounded-xl text-xs"><Download className="mr-1 h-3 w-3" /> CSV</Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-amber-200 bg-white text-slate-900 shadow-xl">
              <CardContent className="space-y-2 p-3">
                <div className="flex items-center gap-2 text-sm font-semibold"><Plus className="h-4 w-4" /> Add player</div>
                <input
                  placeholder="Player name"
                  value={customName}
                  onChange={(event) => setCustomName(event.target.value)}
                  disabled={viewerMode}
                  className="w-full rounded-xl border border-amber-200 bg-amber-50 p-2 text-xs outline-none focus:ring-2 focus:ring-yellow-400 disabled:opacity-60"
                />
                <input
                  placeholder="Country"
                  value={customCountry}
                  onChange={(event) => setCustomCountry(event.target.value)}
                  disabled={viewerMode}
                  className="w-full rounded-xl border border-amber-200 bg-amber-50 p-2 text-xs outline-none focus:ring-2 focus:ring-yellow-400 disabled:opacity-60"
                />
                <select
                  value={customPosition}
                  onChange={(event) => setCustomPosition(event.target.value)}
                  disabled={viewerMode}
                  className="w-full rounded-xl border border-amber-200 bg-amber-50 p-2 text-xs outline-none focus:ring-2 focus:ring-yellow-400 disabled:opacity-60"
                >
                  {positions.filter((item) => item !== "All" && item !== "Forward").map((item) => <option key={item}>{item}</option>)}
                </select>
                <Button onClick={addCustomPlayer} disabled={viewerMode} className="h-8 w-full rounded-xl text-xs">Add to pool</Button>
              </CardContent>
            </Card>
          </div>

          {renderSectionShell(
            "players",
            <Card className="border-amber-200 bg-white text-slate-900 shadow-xl">
              <CardContent className="p-3">
                <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
                    <input
                      placeholder="Search player, country, position, rank, or category"
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      className="w-full rounded-xl border border-amber-200 bg-amber-50 py-2 pl-8 pr-2 text-xs outline-none focus:ring-2 focus:ring-yellow-400"
                    />
                  </div>
                  <select value={position} onChange={(event) => setPosition(event.target.value)} className="rounded-xl border border-amber-200 bg-amber-50 p-2 text-xs outline-none">
                    {positions.map((item) => <option key={item}>{item}</option>)}
                  </select>
                  <select value={country} onChange={(event) => setCountry(event.target.value)} className="rounded-xl border border-amber-200 bg-amber-50 p-2 text-xs outline-none">
                    {countries.map((item) => <option key={item}>{item}</option>)}
                  </select>
                  <select value={category} onChange={(event) => setCategory(event.target.value)} className="rounded-xl border border-amber-200 bg-amber-50 p-2 text-xs outline-none">
                    {categories.map((item) => <option key={item}>{item}</option>)}
                  </select>
                  {renderFullscreenButton("players")}
                </div>

                <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-6">
                  {filteredPlayers.map((player) => (
                    <motion.button
                      key={player.id}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => draftPlayer(player)}
                      disabled={viewerMode || drafted.length >= totalPicks || totalPicks === 0}
                      className={`rounded-2xl border-2 p-3 text-left shadow-lg transition hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-40 ${positionCardColour(player.position)}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-bold text-slate-900" title={player.name}>{player.name}</div>
                          <div className="flex items-center gap-1 truncate text-xs font-medium text-slate-600">
                            <CountryFlag country={player.country} className="h-4 w-6" />
                            <span className="truncate">{player.country}</span>
                          </div>
                        </div>
                        <span className={`rounded-full border px-2 py-1 text-[10px] font-bold ${positionColour(player.position)}`}>
                          {positionBadge(player.position)}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-[10px] font-semibold uppercase tracking-widest text-slate-600">
                        <span>#{player.rank}</span>
                        <span className={`rounded-full border px-2 py-1 text-[9px] font-black ${ratingBadgeColour(player.rating)}`}>
                          {ratingLabel(player.rating)}
                        </span>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

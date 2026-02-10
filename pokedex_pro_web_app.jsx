import { useState, useEffect } from "react";

const TYPE_CHART = {
  normal: ["fighting"],
  fire: ["water", "ground", "rock"],
  water: ["electric", "grass"],
  electric: ["ground"],
  grass: ["fire", "ice", "poison", "flying", "bug"],
  ice: ["fire", "fighting", "rock", "steel"],
  fighting: ["flying", "psychic", "fairy"],
  poison: ["ground", "psychic"],
  ground: ["water", "grass", "ice"],
  flying: ["electric", "ice", "rock"],
  psychic: ["bug", "ghost", "dark"],
  bug: ["fire", "flying", "rock"],
  rock: ["water", "grass", "fighting", "ground", "steel"],
  ghost: ["ghost", "dark"],
  dragon: ["ice", "dragon", "fairy"],
  dark: ["fighting", "bug", "fairy"],
  steel: ["fire", "fighting", "ground"],
  fairy: ["poison", "steel"],
};

function getWeaknesses(types) {
  const weak = new Set();
  types.forEach(t => TYPE_CHART[t]?.forEach(w => weak.add(w)));
  return Array.from(weak);
}

// Prosty algorytm rekomendacji movesetu pod PvE
function recommendMoves(moves) {
  const priority = [
    "earthquake", "shadow ball", "close combat", "ice beam", "thunderbolt",
    "flamethrower", "hydro pump", "psychic", "moonblast", "iron head",
    "stone edge", "dark pulse", "draco meteor"
  ];

  const filtered = moves.filter(m => priority.includes(m));
  return [...new Set([...filtered, ...moves])].slice(0, 4);
}

function counterTips(types) {
  const weak = getWeaknesses(types);
  return `Najlepsze kontry: ${weak.join(", ")}. Używaj szybkich, silnych ataków typu super effective oraz unikaj walki typami: ${types.join(", ")}.`;
}

export default function App() {
  const [query, setQuery] = useState("gengar");
  const [data, setData] = useState(null);
  const [evo, setEvo] = useState([]);
  const [moves, setMoves] = useState([]);
  const [bestMoves, setBestMoves] = useState([]);

  useEffect(() => {
    async function load() {
      try {
        const p = await fetch(`https://pokeapi.co/api/v2/pokemon/${query.toLowerCase()}`).then(r => r.json());
        setData(p);

        const species = await fetch(p.species.url).then(r => r.json());
        const chain = await fetch(species.evolution_chain.url).then(r => r.json());

        const evoList = [];
        let node = chain.chain;
        while (node) {
          evoList.push({ name: node.species.name, details: node.evolution_details[0] || null });
          node = node.evolves_to[0];
        }
        setEvo(evoList);

        const swordMoves = p.moves
          .filter(m => m.version_group_details.some(v => v.version_group.name === "sword-shield"))
          .map(m => m.move.name);
        setMoves(swordMoves);
        setBestMoves(recommendMoves(swordMoves));

      } catch (e) {
        setData(null);
      }
    }
    load();
  }, [query]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Pokédex PRO MAX – Sword Edition</h1>

        <p className="text-slate-400">Kompletny Pokédex do Pokémon Sword + DLC – ewolucje, najlepsze movesety, kontry i słabości</p>

        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Wpisz nazwę Pokémona (np. gengar)"
          className="w-full p-3 rounded-xl bg-slate-800 outline-none"
        />

        {data && (
          <div className="bg-slate-900 rounded-2xl p-5 space-y-5 shadow-xl">
            <div className="flex items-center gap-4">
              <img src={data.sprites.front_default} className="w-24 h-24" />
              <div>
                <h2 className="text-2xl font-semibold capitalize">{data.name}</h2>
                <p>Typy: {data.types.map(t => t.type.name).join(", ")}</p>
                <p>Słabości: {getWeaknesses(data.types.map(t => t.type.name)).join(", ")}</p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-lg">Linia ewolucji</h3>
              <ul className="list-disc list-inside">
                {evo.map((e, i) => (
                  <li key={i} className="capitalize">
                    {e.name}
                    {e.details?.min_level && ` (lvl ${e.details.min_level})`}
                    {e.details?.trigger?.name === "trade" && " (wymiana)"}
                    {e.details?.item && ` (${e.details.item.name})`}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-lg">Najlepszy moveset (PvE)</h3>
              <div className="flex flex-wrap gap-2">
                {bestMoves.map(m => (
                  <span key={m} className="bg-emerald-700 rounded-lg px-3 py-1 capitalize text-sm font-semibold">{m}</span>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-lg">Jak pokonać tego Pokémona</h3>
              <p className="text-slate-300">{counterTips(data.types.map(t => t.type.name))}</p>
            </div>

            <div>
              <h3 className="font-semibold text-lg">Pełny moveset – Sword / Shield</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-64 overflow-y-auto">
                {moves.map(m => (
                  <span key={m} className="bg-slate-800 rounded-lg px-2 py-1 capitalize text-sm">{m}</span>
                ))}
              </div>
            </div>
          </div>
        )}

        {!data && <p className="text-red-400">Nie znaleziono Pokémona.</p>}
      </div>
    </div>
  );
}

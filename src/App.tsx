import { useState } from "react";

export default function App() {
  type Player = {
    name: string;
    elo: number;
    races: number;
  };

  const [players, setPlayers] = useState<Player[]>([]);
  const [newPlayer, setNewPlayer] = useState<string>('');
  const [races, setRaces] = useState<string[][]>([]);
  const [currentRace, setCurrentRace] = useState<string[]>(Array(4).fill(''));
  const [showRaces, setShowRaces] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'elo' | 'score'>('elo');
  const [showFullList, setShowFullList] = useState<boolean>(false);
  const calculateScore = (player: Player): number => {
    if (player.races === 0) return -Infinity;
    return (player.elo - 1000) / player.races;
  };

  const addPlayer = () => {
    if (newPlayer.trim() === '') return;
    setPlayers([
      ...players,
      {
        name: newPlayer.trim(),
        elo: 1000,
        races: 0,
      },
    ]);
    setNewPlayer('');
  };
  const sortedPlayers = [...players].sort((a, b) => {
    if (sortBy === 'elo') {
      return b.elo - a.elo;
    } else {
      return calculateScore(b) - calculateScore(a);
    }
  });
  const visiblePlayers = showFullList
    ? sortedPlayers
    : sortedPlayers.slice(0, 8);

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        display: 'flex',
        justifyContent: 'top',
        alignItems: 'center',
        flexDirection: 'column',
        height: '100vh',
        textAlign: 'center',
        backgroundColor: "#b8000f", // Mario-Rot
        color: "white", // Text gut lesbar
      }}
    >
      <h1>Mario Kart Turnier</h1>

      <input
        type="text"
        value={newPlayer}
        onChange={(e) => setNewPlayer(e.target.value)}
        placeholder="Spielername"
      />
      <button onClick={addPlayer}>Hinzufügen</button>
      <button onClick={() => setSortBy(sortBy === 'elo' ? 'score' : 'elo')}>
        Nach {sortBy === 'elo' ? 'Score' : 'Elo'} sortieren
      </button>
      <button onClick={() => setShowFullList(!showFullList)}>
        {showFullList ? 'Nur Top 8 anzeigen' : 'Alle Spieler anzeigen'}
      </button>

      <h2>Spielerliste</h2>
      <ul style={{ textAlign: 'left' }}>
        {visiblePlayers.map((player, index) => (
          <li key={index}>
            {player.name} - Elo: {player.elo} - {player.races} – Score:{' '}
            {player.races > 0 ? Math.round(calculateScore(player)) : '–'} 
            <select
              style={{ fontSize: "0.75rem", marginLeft: "8px" }}
              onChange={(e) => {
                const change = parseInt(e.target.value);
                if (!isNaN(change)) {
                  setPlayers(players.map(p =>
                    p.name === player.name
                      ? { ...p, elo: p.elo + change }
                      : p
                  ));
                }
              }}
              defaultValue=""
            >
              <option value="" disabled>
                Elo ändern...
              </option>
              {[-10, -5, -1, 1, 5, 10].map((change) => (
                <option key={change} value={change}>
                  {change > 0 ? `+${change}` : change}
                </option>
              ))}
            </select>

          </li>
        ))}
      </ul>

      <h2>Neues Rennen</h2>
      {currentRace.map((name: string, index: number) => (
        <div key={index}>
          <label>Platz {index + 1}: </label>
          <select
            value={name}
            onChange={(e) => {
              const updatedRace = [...currentRace];
              updatedRace[index] = e.target.value;
              setCurrentRace(updatedRace);
            }}
          >
            <option value="">-- Spieler auswählen --</option>
            {players
              .filter((p: Player) => !currentRace.includes(p.name) || p.name === name)
              .map((player: Player, i: number) => (
                <option key={i} value={player.name}>
                  {player.name}
                </option>
              ))}
          </select>
        </div>
      ))}
      <button
        onClick={() => {
          if (currentRace.some((name: string) => name.trim() === '')) return;
          // Rennen speichern und Elo berechnen
          const raceWithObjects = currentRace.map((name:string) =>
            players.find((p:Player) => p.name === name)
          );

          // Elo-Funktion: Platzierungsbasierte Punkte
          const placementPoints = [60, 40, 10, -20];
          const validPlayers = raceWithObjects.filter((p) => p !== undefined) as Player[];
          const averageOpponentElo =
            validPlayers.reduce((sum:number, p:Player) => sum + p.elo, 0) /
            validPlayers.length;

          const updatedPlayers = players.map((player:Player) => {
            const raceIndex = currentRace.indexOf(player.name);
            if (raceIndex === -1) return player; // Spieler war in diesem Rennen nicht dabei

            const rawPoints = placementPoints[raceIndex];
            let adjustedPoints = 0;

            if (rawPoints >= 0) {
              adjustedPoints =
                rawPoints * (averageOpponentElo / player.elo) ** 2;
            } else {
              adjustedPoints =
                rawPoints * (player.elo / averageOpponentElo) ** 2;
            }

            const finalPoints = Math.round(adjustedPoints);

            return {
              ...player,
              elo: player.elo + finalPoints,
              races: player.races + 1,
            };
          });

          setPlayers(updatedPlayers);
          setRaces([...races, currentRace]);
          setCurrentRace(Array(4).fill(''));
        }}
      >
        Rennen speichern
      </button>
      <button onClick={() => setShowRaces(!showRaces)}>
        {showRaces ? 'Rennen ausblenden' : 'Rennen anzeigen'}
      </button>

      {showRaces && (
        <>
          <h2>Alle Rennen</h2>
          <ol>
            {races.map((race:string[], idx:number) => (
              <li key={idx}>
                Rennen {idx + 1}:{' '}
                {race.map((name:string, i:number) => `#${i + 1} ${name}`).join(', ')}
              </li>
            ))}
          </ol>
        </>
      )}
      {races.length > 0 && (
        <button
          onClick={() => {
            const lastRace = races[races.length - 1];
            const placementPoints = [60, 40, 10, -20];
      
            // Spieler wieder "zurückrechnen"
            const updatedPlayers = [...players].map((player:Player) => {
              const placeIndex = lastRace.indexOf(player.name);
              if (placeIndex === -1) return player;
      
              const rawPoints = placementPoints[placeIndex];
              const raceWithObjects = lastRace
                .map((name:string) => players.find((p:Player) => p.name === name))
                .filter((p): p is Player => p !== undefined);
      
              const averageOpponentElo =
                raceWithObjects.reduce((sum:number, p:Player) => sum + p.elo, 0) /
                raceWithObjects.length;
      
              let adjustedPoints = 0;
      
              if (rawPoints >= 0) {
                adjustedPoints =
                  rawPoints * (averageOpponentElo / player.elo) ** 2;
              } else {
                adjustedPoints =
                  rawPoints * (player.elo / averageOpponentElo) ** 2;
              }
      
              const finalPoints = Math.round(adjustedPoints);
      
              return {
                ...player,
                elo: player.elo - finalPoints,
                races: player.races - 1,
              };
            });
      
            setPlayers(updatedPlayers);
            setRaces(races.slice(0, -1));
          }}
        >
          Letztes Rennen löschen
        </button>
      )}

    </div>
  );
}

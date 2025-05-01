'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

function Card({ children, className }) {
  return <div className={`rounded-xl border p-4 shadow ${className}`}>{children}</div>;
}

function CardContent({ children, className }) {
  return <div className={className}>{children}</div>;
}

function Button({ children, onClick, variant = 'default', className = '' }) {
  const base = 'px-4 py-2 rounded font-semibold';
  const variants = {
    default: 'bg-green-600 text-white hover:bg-green-700',
    outline: 'border border-green-600 text-green-700 bg-white hover:bg-green-50',
    ghost: 'text-red-600 hover:text-red-800',
  };
  return (
    <button onClick={onClick} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
}

function Input({ value, onChange, placeholder }) {
  return (
    <input
      type="text"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full p-2 border rounded border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-400"
    />
  );
}

const monthNames = [
  "januari", "februari", "maart", "april", "mei", "juni",
  "juli", "augustus", "september", "oktober", "november", "december"
];

export default function Home() {
  const searchParams = useSearchParams();
  const pollParam = searchParams.get("poll");

  const [step, setStep] = useState(1);
  const [title, setTitle] = useState("");
  const [organizer, setOrganizer] = useState("");
  const [options, setOptions] = useState([""]);
  const [votes, setVotes] = useState([]);
  const [name, setName] = useState("");
  const [selected, setSelected] = useState([]);
  const [pollId] = useState(() => pollParam || Math.random().toString(36).substring(2, 8));
  const [createdAt] = useState(() => new Date());

  useEffect(() => {
    const existing = localStorage.getItem("polls");
    if (existing) {
      const parsed = JSON.parse(existing);
      const now = new Date();
      const filtered = parsed.filter(p => new Date(p.createdAt) > new Date(now.getTime() - 1000 * 60 * 60 * 24 * 90));
      localStorage.setItem("polls", JSON.stringify(filtered));

      if (pollParam) {
        const match = filtered.find(p => p.pollId === pollParam);
        if (match) {
          setTitle(match.title);
          setOptions(match.options);
          setOrganizer(match.organizer);
          setStep(2);
        }
      }
    }
  }, [pollParam]);

  useEffect(() => {
    const lowerTitle = title.toLowerCase();
    const foundMonth = monthNames.find((m) => lowerTitle.includes(m));
    if (foundMonth) {
      const monthIndex = monthNames.indexOf(foundMonth);
      const year = new Date().getFullYear();
      const fridays = [];
      const date = new Date(year, monthIndex, 1);

      while (date.getMonth() === monthIndex) {
        if (date.getDay() === 5) {
          fridays.push(date.toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' }));
        }
        date.setDate(date.getDate() + 1);
      }

      setOptions(fridays);
    }
  }, [title]);

  const handleCreatePoll = () => {
    const pollData = { title, organizer, options, createdAt, pollId };
    const existing = JSON.parse(localStorage.getItem("polls") || "[]");
    localStorage.setItem("polls", JSON.stringify([...existing, pollData]));
    setStep(2);
  };

  const handleVote = () => {
    if (!name.trim()) return;
    const vote = { name, selected };
    setVotes((prev) => [...prev.filter(v => v.name !== name), vote]);
    setName("");
    setSelected([]);
  };

  const handleDeleteVote = (voterName) => {
    setVotes(votes.filter(v => v.name !== voterName));
  };

  const getVotersForOption = (option) => {
    return votes.filter(v => v.selected.includes(option)).map(v => v.name);
  };

  const shareableLink = typeof window !== 'undefined'
    ? `${window.location.origin}/?poll=${pollId}`
    : '';

  return (
    <main className="max-w-2xl mx-auto p-4 space-y-6 bg-green-50 min-h-screen">
      {step === 1 && (
        <Card className="bg-green-100 border-green-300">
          <CardContent className="space-y-4 p-4">
            <h1 className="text-2xl font-bold text-green-800">⚽ Nieuwe Zaalvoetbal Poll</h1>
            <Input placeholder="Titel (bv. Wanneer spelen we?)" value={title} onChange={(e) => setTitle(e.target.value)} />
            <Input placeholder="Naam organisator (optioneel)" value={organizer} onChange={(e) => setOrganizer(e.target.value)} />
            <div className="space-y-2">
              {options.map((opt, idx) => (
                <Input
                  key={idx}
                  placeholder={`Optie ${idx + 1}`}
                  value={opt}
                  onChange={(e) => {
                    const newOptions = [...options];
                    newOptions[idx] = e.target.value;
                    setOptions(newOptions);
                  }}
                />
              ))}
              <Button variant="outline" onClick={() => setOptions([...options, ""])}>+ Voeg optie toe</Button>
            </div>
            <Button onClick={handleCreatePoll}>Poll aanmaken</Button>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card className="bg-white border-green-400 shadow-md">
          <CardContent className="space-y-4 p-4">
            <h2 className="text-xl font-semibold text-green-700">🏆 {title}</h2>
            <p className="text-sm text-gray-500">Door: {organizer || "anoniem"}</p>

            <Input placeholder="Jouw naam" value={name} onChange={(e) => setName(e.target.value)} />
            <div className="space-y-4">
              {options.map((opt, idx) => (
                <div key={idx} className="border border-green-300 p-3 rounded bg-green-50">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={selected.includes(opt)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelected([...selected, opt]);
                        } else {
                          setSelected(selected.filter((s) => s !== opt));
                        }
                      }}
                    />
                    <span className="text-green-800 font-medium">{opt}</span>
                  </label>
                  <div className="text-sm text-gray-600 mt-2">
                    {getVotersForOption(opt).map((voter, i) => (
                      <div key={i} className="flex justify-between items-center">
                        <span>✅ {voter}</span>
                        <Button variant="ghost" className="text-red-500 text-xs" onClick={() => handleDeleteVote(voter)}>Verwijder</Button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <Button onClick={handleVote}>Stem</Button>
            <div className="mt-4 text-sm text-gray-500">
              📤 Deel deze poll met je teamgenoten:<br />
              <code className="bg-gray-100 p-1 rounded inline-block mt-1">{shareableLink}</code>
            </div>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
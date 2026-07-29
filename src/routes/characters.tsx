import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Check, PawPrint } from "lucide-react";
import { useEffect, useState } from "react";
import { MobileFrame } from "@/components/echoryx/MobileFrame";
import { BottomNav } from "@/components/echoryx/BottomNav";
import { ScreenHeader } from "@/components/echoryx/ScreenHeader";
import { characters as characterAssets } from "@/components/echoryx/data";
import { charactersApi, childrenApi, ApiError, type AgeGroup, type Character } from "@/lib/api";
import { RequireAuth, useAuth } from "@/lib/auth";

export const Route = createFileRoute("/characters")({
  head: () => ({
    meta: [
      { title: "Choose a character · EchoRyx" },
      { name: "description", content: "Pick your child's favorite AI companion." },
      { property: "og:title", content: "Choose a character · EchoRyx" },
      { property: "og:description", content: "Meet Niso as Ti Ni, Lily, Mimi, Bobby or Panda." },
    ],
  }),
  component: () => (
    <RequireAuth>
      <Characters />
    </RequireAuth>
  ),
});

function ageGroupFromAge(age: number): AgeGroup {
  if (age <= 3) return "toddler";
  if (age <= 5) return "preschool";
  if (age <= 7) return "early_elementary";
  return "elementary";
}

function Characters() {
  const navigate = useNavigate();
  const { refreshChildren, setActiveChildId } = useAuth();
  const [remoteCharacters, setRemoteCharacters] = useState<Character[]>([]);
  const [sel, setSel] = useState("tiger");
  const [childName, setChildName] = useState("");
  const [age, setAge] = useState(5);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    charactersApi.list().then(setRemoteCharacters).catch(() => undefined);
  }, []);

  async function handleSave() {
    setError(null);
    if (!childName.trim()) {
      setError("Give your child a name first.");
      return;
    }
    const characterId = remoteCharacters.find((c) => c.code === sel)?.id;

    setIsSubmitting(true);
    try {
      const child = await childrenApi.create({
        name: childName.trim(),
        ageGroup: ageGroupFromAge(age),
        characterId,
      });
      await refreshChildren();
      setActiveChildId(child.id);
      navigate({ to: "/home" });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't save your choice. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <MobileFrame>
      <ScreenHeader title="Choose your character" right={<PawPrint className="w-5 h-5 text-primary-glow" />} />
      <p className="text-xs text-muted-foreground mb-4">Your companion will play, chat and learn along with your child.</p>

      <div className="space-y-3 mb-4">
        <div>
          <label className="text-xs font-medium text-muted-foreground ml-1">Child's name</label>
          <input
            value={childName}
            onChange={(e) => setChildName(e.target.value)}
            placeholder="e.g. Bé An"
            className="mt-1.5 w-full px-4 py-3 rounded-2xl bg-input/60 border border-border focus:border-primary outline-none text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground ml-1">Age: {age}</label>
          <input
            type="range"
            min={2}
            max={10}
            value={age}
            onChange={(e) => setAge(Number(e.target.value))}
            className="mt-1.5 w-full accent-primary"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {characterAssets.map((c) => {
          const active = sel === c.id;
          return (
            <button
              key={c.id}
              onClick={() => setSel(c.id)}
              className={`relative rounded-2xl p-4 bg-card border transition text-left ${active ? "border-primary shadow-glow" : "border-border/60"}`}
            >
              {active && (
                <span className="absolute top-2 right-2 w-6 h-6 rounded-full gradient-primary flex items-center justify-center">
                  <Check className="w-4 h-4 text-primary-foreground" />
                </span>
              )}
              <div className="h-24 flex items-center justify-center">
                <img src={c.img} alt={c.name} className={`h-24 ${active ? "animate-float" : ""}`} />
              </div>
              <div className="mt-2 font-semibold text-sm">{c.name}</div>
              <div className="text-[11px] text-muted-foreground">"{c.nick}"</div>
            </button>
          );
        })}
      </div>

      {error && <p className="text-xs text-destructive text-center mt-4">{error}</p>}

      <button
        onClick={handleSave}
        disabled={isSubmitting}
        className="mt-6 w-full text-center py-3.5 rounded-2xl gradient-primary text-primary-foreground font-semibold shadow-glow disabled:opacity-60"
      >
        {isSubmitting ? "Saving…" : "Save choice"}
      </button>
      <BottomNav />
    </MobileFrame>
  );
}
